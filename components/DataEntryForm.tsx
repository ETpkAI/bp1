

import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { HealthRecord, Translations } from '../types.ts';
import { validateHealthRecord } from '../utils/validation.ts';
import { useToast } from './ToastManager.tsx';

interface DataEntryFormProps {
  addRecord: (record: Omit<HealthRecord, 'id' | 'timestamp'>) => void;
  t: Translations;
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({ addRecord, t }) => {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    if (!value.trim()) {
      newErrors[name] = '此字段为必填项';
    } else if (name !== 'notes') {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) {
        newErrors[name] = '请输入有效数字';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 清除之前的错误
    setErrors({});
    
    // 验证所有字段
    const systolicValid = validateField('systolic', systolic);
    const diastolicValid = validateField('diastolic', diastolic);
    const heartRateValid = validateField('heartRate', heartRate);
    
    if (!systolicValid || !diastolicValid || !heartRateValid) {
      setIsSubmitting(false);
      return;
    }

    const recordData = {
      systolic: parseInt(systolic, 10),
      diastolic: parseInt(diastolic, 10),
      heartRate: parseInt(heartRate, 10),
      notes: notes.trim(),
    };

    // 验证数据范围
    const validation = validateHealthRecord(recordData);
    if (!validation.isValid) {
      setErrors({ general: validation.errors.join(', ') });
      showToast(validation.errors.join(', '), 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      addRecord(recordData);
      showToast('记录添加成功！', 'success');
      
      // Reset form
      setSystolic('');
      setDiastolic('');
      setHeartRate('');
      setNotes('');
      setErrors({});
    } catch (error) {
      showToast('添加记录失败，请重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getInputClasses = (fieldName: string) => {
    const baseClasses = "mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm transition-colors";
    const hasError = errors[fieldName];
    
    if (hasError) {
      return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500`;
    }
    return `${baseClasses} border-gray-300 focus:ring-brand-primary focus:border-brand-primary`;
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  // 简单图像预处理：灰度 + 对比度提升 + 二值化
  const preprocessImage = (file: File): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(2000 / Math.max(img.width, img.height), 2); // 限制最大边到 2000px 以内，且不超过 2x 放大
        const w = Math.round(img.width * (scale > 1 ? scale : 1));
        const h = Math.round(img.height * (scale > 1 ? scale : 1));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        // 灰度 + 增强对比 + 二值化
        const contrast = 1.25; // 对比度系数
        const threshold = 140; // 二值阈值
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2];
          // 灰度
          let v = 0.299 * r + 0.587 * g + 0.114 * b;
          // 对比度
          v = (v - 128) * contrast + 128;
          // 二值化
          const bin = v >= threshold ? 255 : 0;
          data[i] = data[i+1] = data[i+2] = bin;
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const parseLabeledValues = (text: string) => {
    const normalized = text
      .replace(/\u3000/g, ' ') // 全角空格
      .replace(/\s+/g, ' ')
      .toUpperCase();

    // 直接匹配 XX/YY 形式
    const bpPair = normalized.match(/\b(\d{2,3})\s*\/\s*(\d{2,3})\b/);
    let sysFromPair: number | undefined;
    let diaFromPair: number | undefined;
    if (bpPair) {
      const a = parseInt(bpPair[1], 10);
      const b = parseInt(bpPair[2], 10);
      sysFromPair = Math.max(a, b);
      diaFromPair = Math.min(a, b);
    }

    const pickNumber = (re: RegExp): number | undefined => {
      const m = normalized.match(re);
      return m ? parseInt(m[2], 10) : undefined;
    };

    // 支持中英文标签
    const sys = pickNumber(/\b(SYS|SYSTOLIC|收缩压|高压|上压)\D{0,10}(\d{2,3})\b/);
    const dia = pickNumber(/\b(DIA|DIASTOLIC|舒张压|低压|下压)\D{0,10}(\d{2,3})\b/);
    const pul = pickNumber(/\b(PUL|PULSE|HR|心率)\D{0,10}(\d{2,3})\b/);

    // 最终合并：优先标签值，其次 pair
    const finalSys = sys ?? sysFromPair;
    const finalDia = dia ?? diaFromPair;
    return { sys: finalSys, dia: finalDia, pul };
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsOcrLoading(true);
    try {
      const canvas = await preprocessImage(file);
      const configStr = 'tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:/. - --psm 6';
      // 第一次尝试：中英双语
      let result = await Tesseract.recognize(canvas, 'eng+chi_sim', { logger: () => {}, config: configStr });
      let raw = (result.data.text || '').trim();
      let { sys, dia, pul } = parseLabeledValues(raw);

      // 若未命中标签/分数形式，尝试仅英文再识别一次
      if (!sys || !dia) {
        result = await Tesseract.recognize(canvas, 'eng', { logger: () => {}, config: configStr });
        raw = (result.data.text || '').trim();
        const parsed = parseLabeledValues(raw);
        sys = sys ?? parsed.sys;
        dia = dia ?? parsed.dia;
        pul = pul ?? parsed.pul;
      }

      if (sys && dia) {
        setSystolic(String(sys));
        setDiastolic(String(dia));
        if (pul) setHeartRate(String(pul));
        showToast('已从图片识别读数，请确认后保存。', 'success');
      } else {
        showToast('未识别到有效血压读数，请重试或手动输入。', 'warning');
      }
    } catch (err) {
      showToast('图片识别失败，请重试。', 'error');
    } finally {
      setIsOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-text-primary mb-4">{t.addNewRecord as string}</h2>
      
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="systolic" className="block text-sm font-medium text-text-secondary">
              {t.systolic as string} <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              id="systolic" 
              value={systolic} 
              onChange={e => {
                setSystolic(e.target.value);
                if (errors.systolic) {
                  setErrors(prev => ({ ...prev, systolic: '' }));
                }
              }}
              onBlur={() => validateField('systolic', systolic)}
              required 
              className={getInputClasses('systolic')}
              min="70"
              max="300"
              placeholder="120"
            />
            {errors.systolic && (
              <p className="mt-1 text-sm text-red-600">{errors.systolic}</p>
            )}
          </div>
          <div>
            <label htmlFor="diastolic" className="block text-sm font-medium text-text-secondary">
              {t.diastolic as string} <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              id="diastolic" 
              value={diastolic} 
              onChange={e => {
                setDiastolic(e.target.value);
                if (errors.diastolic) {
                  setErrors(prev => ({ ...prev, diastolic: '' }));
                }
              }}
              onBlur={() => validateField('diastolic', diastolic)}
              required 
              className={getInputClasses('diastolic')}
              min="40"
              max="200"
              placeholder="80"
            />
            {errors.diastolic && (
              <p className="mt-1 text-sm text-red-600">{errors.diastolic}</p>
            )}
          </div>
          <div>
            <label htmlFor="heartRate" className="block text-sm font-medium text-text-secondary">
              {t.heartRate as string} <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              id="heartRate" 
              value={heartRate} 
              onChange={e => {
                setHeartRate(e.target.value);
                if (errors.heartRate) {
                  setErrors(prev => ({ ...prev, heartRate: '' }));
                }
              }}
              onBlur={() => validateField('heartRate', heartRate)}
              required 
              className={getInputClasses('heartRate')}
              min="30"
              max="250"
              placeholder="72"
            />
            {errors.heartRate && (
              <p className="mt-1 text-sm text-red-600">{errors.heartRate}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelected} />
          <button type="button" onClick={handlePickImage} disabled={isOcrLoading} className="inline-flex items-center px-3 py-2 border rounded bg-white hover:bg-gray-50 text-sm">
            {isOcrLoading ? '识别中...' : '拍照/上传识别'}
          </button>
          <span className="text-xs text-gray-500">提示：对准血压计读数拍照，系统将自动识别 SYS/DIA/PUL。</span>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-text-secondary">{t.notes as string}</label>
          <textarea 
            id="notes" 
            value={notes} 
            onChange={e => setNotes(e.target.value)}
            rows={3} 
            className={getInputClasses('notes')}
            maxLength={500}
            placeholder="添加备注（可选）"
          ></textarea>
          <p className="mt-1 text-xs text-gray-500">{notes.length}/500</p>
        </div>
        <div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '保存中...' : (t.saveRecord as string)}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DataEntryForm;