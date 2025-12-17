export interface ExtractedData {
  testDate: string; // Extracted from filename
  sampleName: string;
  thickness: string | number;
  stressValues: (number | string)[]; // The 9 values for strains 5, 10... 80, or '-' if missing
}

export interface DataPoint {
  specimenLabel: string;
  strain: number;
  load: number;
}

export interface ProcessingResult {
  fileName: string;
  specimenLabel: string;
  maxLoad: number;
  maxStrain: number;
  data: DataPoint[];
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}