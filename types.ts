
export interface HealthRecord {
  id: string; // Unique ID, typically a timestamp as a string
  systolic: number;
  diastolic: number;
  heartRate: number;
  notes?: string;
  timestamp: string; // ISO 8601 string
}

export type TranslationValue = string | ((...args: any[]) => string);

export interface Translations {
  [key: string]: TranslationValue | { [key: string]: TranslationValue };
}
