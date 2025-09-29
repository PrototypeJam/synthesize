import { type FC } from 'react';

export interface SkinProps {
  data: {
    summary1?: string;
    summary2?: string;
    synthesis?: string;
    url1?: string;
    url2?: string;
    hnTitle?: string | null;
  };
  isBusy: boolean;
  statusText: string;
  canShare: boolean;
  actions: {
    onDownloadFull: () => void;
    onShare: (title: string, text: string) => void;
  };
}

export type SkinComponent = FC<SkinProps>;