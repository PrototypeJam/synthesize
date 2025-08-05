export enum ProcessState {
  IDLE = 'idle',
  FETCHING_1 = 'Fetching content...',
  SUMMARIZING_1 = 'Summarizing...',
  FETCHING_2 = 'Fetching second URL...',
  SUMMARIZING_2 = 'Summarizing second URL...',
  SYNTHESIZING = 'Synthesizing content...',
  DONE = 'done',
  ERROR = 'error'
}

export interface ResultData {
  summary1?: string;
  summary2?: string;
  synthesis?: string;
}