
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { HealthRecord, Translations, AnalysisResult } from '../types.ts';
import { SparklesIcon } from './Icons.tsx';

// Assume process.env.API_KEY is available in the environment
const API_KEY = process.env.API_KEY;

interface AnalysisCardProps {
  records: HealthRecord[];
  t: Translations;
}

const getBPLevelText = (systolic: number, diastolic: number): string => {
  if (systolic < 120 && diastolic < 80) return 'Normal';
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) return 'Elevated';
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) return 'High BP (Stage 1)';
  if (systolic >= 140 || diastolic >= 90) return 'High BP (Stage 2)';
  if (systolic > 180 || diastolic > 120) return 'Hypertensive Crisis';
  return 'N/A';
};


const AnalysisCard: React.FC<AnalysisCardProps> = ({ records, t }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!API_KEY) {
      setError("API Key is not configured.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const recentRecords = records.slice(0, 30).map(r => ({
          systolic: r.systolic,
          diastolic: r.diastolic,
          heartRate: r.heartRate,
          timestamp: r.timestamp,
          category: getBPLevelText(r.systolic, r.diastolic)
      }));

      if (recentRecords.length < 3) {
        setError("Not enough data for a meaningful analysis. Please add at least 3 records.");
        setIsLoading(false);
        return;
      }
      
      const schema = {
        type: Type.OBJECT,
        properties: {
          trendAnalysis: {
            type: Type.STRING,
            description: "A brief, 1-2 sentence summary of trends in blood pressure and heart rate (e.g., stable, increasing, fluctuating).",
          },
          categoryDistribution: {
              type: Type.STRING,
              description: "A one-sentence summary of how the readings are distributed across blood pressure categories (e.g., 'Most readings are in the Normal range, with a few in Elevated.')."
          },
          lifestyleSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 3-4 general, non-prescriptive lifestyle suggestions for cardiovascular health, such as diet or exercise tips."
          },
        },
        required: ["trendAnalysis", "categoryDistribution", "lifestyleSuggestions"],
      };

      const prompt = `You are a helpful health data analyst. Analyze the following blood pressure and heart rate data from a user. The data is in JSON format, with the most recent record first. Each record includes a "category" field based on standard blood pressure classifications.
      
      Do not provide medical advice. Your entire response must be a valid JSON object that conforms to the provided schema. Be encouraging and focus on general wellness.

      Data:
      ${JSON.stringify(recentRecords, null, 2)}
      `;

      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: schema,
          },
      });
      
      const responseText = response.text;
      const parsedResult = JSON.parse(responseText) as Omit<AnalysisResult, 'disclaimer'>;

      setResult({
          ...parsedResult,
          disclaimer: t.aiDisclaimer as string,
      });

    } catch (err) {
      console.error("AI Analysis Error:", err);
      setError(t.analysisError as string);
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
