export enum ProcessState {
  IDLE = 'idle',
  FETCHING_1 = 'Fetching URL 1...',
  SUMMARIZING_1 = 'Summarizing URL 1...',
  FETCHING_2 = 'Fetching URL 2...',
  SUMMARIZING_2 = 'Summarizing URL 2...',
  SYNTHESIZING = 'Synthesizing content...',
  DONE = 'done',
  ERROR = 'error'
}

export interface ResultData {
  summary1: string;
  summary2: string;
  synthesis: string;
}