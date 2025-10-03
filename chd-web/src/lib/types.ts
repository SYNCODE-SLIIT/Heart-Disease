// TypeScript types for API communication

export interface PredictIn {
  // Demographics
  age: number;
  gender: 'Male' | 'Female';
  
  // Vital signs
  sysBP: number;
  pulsePressure?: number;
  BMI: number;
  heartRate?: number;
  
  // Lab values
  totChol?: number;
  glucose?: number;
  
  // Lifestyle
  cigsPerDay?: number;
  currentSmoker?: 'Yes' | 'No';
  
  // Medical history
  BPMeds?: 'Yes' | 'No';
  prevalentStroke?: 'Yes' | 'No';
  prevalentHyp?: 'Yes' | 'No';
  diabetes?: 'Yes' | 'No';
}

export interface PredictOut {
  probability: number;
  prediction: number;
  threshold: number;
  model_version: string;
}

export interface MetaOut {
  expected_columns: string[];
  threshold: number;
  model_version: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface RiskBand {
  level: RiskLevel;
  color: string;
  bgColor: string;
  description: string;
}

// Batch API types
export interface BatchPredictResponseBase {
  batch_id: string;
  total: number;
  threshold: number;
  model_version: string;
  required_columns: string[];
  extras_dropped: string[];
  missing_inserted: string[];
  warnings: string[];
  mapping_summary: Record<string, string>;
}

export type BatchRow = Record<string, string | number | null> & {
  probability: number;
  risk_level: RiskLevel;
  prediction: number;
};

export interface BatchPredictResponseRows extends BatchPredictResponseBase {
  rows: BatchRow[];
}

export interface BatchPredictResponsePreview extends BatchPredictResponseBase {
  preview_rows: BatchRow[];
}

export type BatchPredictResponse = BatchPredictResponseRows | BatchPredictResponsePreview;