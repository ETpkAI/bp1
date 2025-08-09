
import React, { useState } from 'react';
import { HealthRecord, Translations, AnalysisResult } from '../types.ts';
import { SparklesIcon } from './Icons.tsx';
import { getBPLevelText } from '../utils/validation.ts';
import { useToast } from './ToastManager.tsx';

// 由服务器端代理 AI 调用，无需在前端保留密钥

interface AnalysisCardProps {
  records: HealthRecord[];
  t: Translations;
}




const AnalysisCard: React.FC<AnalysisCardProps> = ({ records, t }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const recentRecords = records.slice(0, 30).map(r => ({
          systolic: r.systolic,
          diastolic: r.diastolic,
          heartRate: r.heartRate,
          timestamp: r.timestamp,
          category: getBPLevelText(r.systolic, r.diastolic)
      }));

      if (recentRecords.length < 3) {
        const errorMsg = "Not enough data for a meaningful analysis. Please add at least 3 records.";
        setError(errorMsg);
        showToast(errorMsg, 'warning');
        setIsLoading(false);
        return;
      }
      
      const res = await fetch('/api/v1/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({ records: recentRecords })
      });

      if (!res.ok) {
        throw new Error('AI 分析请求失败');
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.message || 'AI 分析失败');
      }

      const parsedResult = json.data as Omit<AnalysisResult, 'disclaimer'>;

      setResult({
          ...parsedResult,
          disclaimer: t.aiDisclaimer as string,
      });

    } catch (err) {
      console.error("AI Analysis Error:", err);
      const errorMsg = t.analysisError as string;
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center mb-4">
        <SparklesIcon className="h-6 w-6 text-brand-primary mr-3" />
        <h2 className="text-lg font-semibold text-text-primary">{t.aiAnalysisTitle as string}</h2>
      </div>
      
      {!result && !isLoading && !error && (
        <p className="text-sm text-text-secondary mb-4">{t.aiAnalysisDescription as string}</p>
      )}

      {error && (
         <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
         </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          <p className="ml-3 text-text-secondary">{t.analyzing as string}</p>
        </div>
      ) : (
        <button 
          onClick={handleAnalyze} 
          disabled={records.length === 0}
          className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed">
          <SparklesIcon className="h-5 w-5 mr-2" />
          {t.analyzeData as string}
        </button>
      )}

      {result && !isLoading && (
        <div className="mt-6 space-y-4 animate-fade-in">
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-lg">
                <p className="text-sm">{result.disclaimer}</p>
            </div>
            
            <div>
                <h3 className="font-semibold text-text-primary">{t.trendAnalysis as string}</h3>
                <p className="text-sm text-text-secondary">{result.trendAnalysis}</p>
            </div>
            
             <div>
                <h3 className="font-semibold text-text-primary">{t.categoryDistribution as string}</h3>
                <p className="text-sm text-text-secondary">{result.categoryDistribution}</p>
            </div>

            <div>
                <h3 className="font-semibold text-text-primary">{t.lifestyleSuggestions as string}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary mt-1">
                    {result.lifestyleSuggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                    ))}
                </ul>
            </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisCard;
