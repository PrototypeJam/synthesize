import React from 'react';
import type { SkinProps } from './SkinContract';

const Default: React.FC<SkinProps> = ({ data, isBusy, statusText, canShare, actions }) => {
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-3xl font-bold mb-4">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold mt-6 mb-3 text-blue-400">{line.slice(3)}</h2>;
      }
      if (line.startsWith('• ')) {
        return <li key={i} className="ml-6 mb-2 list-disc">{line.slice(2)}</li>;
      }
      if (line.trim()) {
        return <p key={i} className="mb-2">{line}</p>;
      }
      return <br key={i} />;
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {isBusy && (
        <div className="bg-blue-600 text-white p-2 rounded mb-4 text-center">
          {statusText}
        </div>
      )}
      
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {data.summary1 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-blue-300">Article Summary</h3>
            <div className="text-gray-300">
              {renderContent(data.summary1)}
            </div>
          </div>
        )}
        
        {data.summary2 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-orange-300">Discussion Summary</h3>
            <div className="text-gray-300">
              {renderContent(data.summary2)}
            </div>
          </div>
        )}
      </div>
      
      {data.synthesis && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-teal-300">Synthesis</h3>
          <div className="text-gray-300">
            {renderContent(data.synthesis)}
          </div>
        </div>
      )}
      
      <div className="flex gap-4 mt-6 justify-center">
        <button 
          onClick={actions.onDownloadFull}
          className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
        >
          Download
        </button>
        {canShare && (
          <button 
            onClick={() => actions.onShare('Synthesis', data.synthesis || '')}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
};

export default Default;