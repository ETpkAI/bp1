export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateHealthRecord = (data: {
  systolic: number;
  diastolic: number;
  heartRate: number;
  notes?: string;
}): ValidationResult => {
  const errors: string[] = [];

  // 血压范围验证
  if (data.systolic < 70 || data.systolic > 300) {
    errors.push('收缩压应在 70-300 mmHg 范围内');
  }
  if (data.diastolic < 40 || data.diastolic > 200) {
    errors.push('舒张压应在 40-200 mmHg 范围内');
  }
  if (data.systolic <= data.diastolic) {
    errors.push('收缩压必须大于舒张压');
  }

  // 心率范围验证
  if (data.heartRate < 30 || data.heartRate > 250) {
    errors.push('心率应在 30-250 bpm 范围内');
  }

  // 备注长度验证
  if (data.notes && data.notes.length > 500) {
    errors.push('备注不能超过 500 字符');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getBPLevel = (systolic: number, diastolic: number) => {
  if (systolic < 120 && diastolic < 80) return { text: 'Normal', color: 'text-green-600', level: 'normal' };
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) return { text: 'Elevated', color: 'text-yellow-600', level: 'elevated' };
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) return { text: 'High BP (S1)', color: 'text-orange-600', level: 'stage1' };
  if (systolic >= 140 || diastolic >= 90) return { text: 'High BP (S2)', color: 'text-red-600', level: 'stage2' };
  if (systolic > 180 || diastolic > 120) return { text: 'Crisis', color: 'text-red-800 font-bold', level: 'crisis' };
  return { text: 'N/A', color: 'text-gray-500', level: 'unknown' };
};

export const getBPLevelText = (systolic: number, diastolic: number): string => {
  return getBPLevel(systolic, diastolic).text;
}; 