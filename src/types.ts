export type ModelId = 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';

export const MODEL_LABEL: Record<ModelId, string> = {
  'gemini-2.5-pro': 'Best Quality',
  'gemini-2.5-flash': 'Balanced',
  'gemini-2.5-flash-lite': 'Blast Speed',
};

export enum ProcessState {
  IDLE = 'idle',
  FETCHING_1 = 'fetching_1',
  SUMMARIZING_1 = 'summarizing_1',
  FETCHING_2 = 'fetching_2',
  SUMMARIZING_2 = 'summarizing_2',
  SYNTHESIZING = 'synthesizing',
  DONE = 'done',
  ERROR = 'error'
}

export interface ResultData {
  summary1?: string;
  summary2?: string;
  synthesis?: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string; // ISO
  model: ModelId;
  url1?: string;
  url2?: string;
  title1?: string;
  title2?: string;
  results: ResultData;
  hnThreadUrl?: string;
  hnTitle?: string;
  pinned?: boolean;
}