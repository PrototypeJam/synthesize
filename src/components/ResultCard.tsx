import React, { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import DownloadIcon from './icons/DownloadIcon';
import ShareIcon from './icons/ShareIcon';
import CopyIcon from './icons/CopyIcon';

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
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Visual feedback for 2 seconds
    } catch (err) {
      // Fallback for older browsers or if the API fails
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed'; // Keep it off-screen
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
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
        <ActionButton onClick={handleCopy} aria-label="Copy to clipboard">
          {copied ? <span className="text-green-400">✓</span> : <CopyIcon />}
        </ActionButton>
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