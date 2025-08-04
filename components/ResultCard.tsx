import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import DownloadIcon from './icons/DownloadIcon';
import ShareIcon from './icons/ShareIcon';

interface ResultCardProps {
  title: string;
  content: string;
  isSynthesis?: boolean;
  onDownload: () => void;
  onShare: () => void;
  canShare: boolean;
}

const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode; 'aria-label': string }> = ({ onClick, children, ...props }) => (
  <button
    onClick={onClick}
    className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 hover:text-white transition-colors"
    {...props}
  >
    {children}
  </button>
);

const ResultCard: React.FC<ResultCardProps> = ({ title, content, isSynthesis = false, onDownload, onShare, canShare }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg p-6 flex flex-col">
      <h3 className="text-xl font-bold mb-4 text-blue-300">{title}</h3>
      <div className="text-gray-300 space-y-2 max-h-[40vh] md:max-h-[500px] overflow-y-auto pr-2 flex-grow">
        {isSynthesis ? (
          <MarkdownRenderer content={content} />
        ) : (
          content.split('\n').map((line, i) => {
            line = line.trim();
            if (line.startsWith('* ') || line.startsWith('- ')) {
              return <li key={i} className="list-disc ml-5 mb-1">{line.substring(2)}</li>
            }
            return <p key={i}>{line}</p>
          })
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-end items-center gap-3">
        <ActionButton onClick={onDownload} aria-label="Download content as markdown file">
            <DownloadIcon />
        </ActionButton>
        {canShare && (
            <ActionButton onClick={onShare} aria-label="Share content">
                <ShareIcon />
            </ActionButton>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
