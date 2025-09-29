import React from 'react';
import type { SkinProps } from './SkinContract';

const Magazine: React.FC<SkinProps> = ({ data, isBusy, statusText, canShare, actions }) => {
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-5xl font-serif font-bold mb-6 leading-tight">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-serif font-bold mt-8 mb-4 text-red-600 uppercase tracking-wide border-b-2 border-red-600 pb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('• ')) {
        return <li key={i} className="ml-8 mb-3 leading-relaxed">{line.slice(2)}</li>;
      }
      if (line.trim()) {
        return <p key={i} className="mb-4 leading-relaxed text-lg">{line}</p>;
      }
      return <br key={i} />;
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {isBusy && (
          <div className="bg-red-600 text-white px-6 py-3 mb-8 font-bold uppercase tracking-wider text-sm">
            {statusText}
          </div>
        )}
        
        <header className="mb-12 text-center">
          <div className="text-red-600 font-bold uppercase tracking-widest text-sm mb-2">Exclusive Analysis</div>
          <h1 className="text-6xl font-serif font-bold mb-4">{data.hnTitle || 'Technology Deep Dive'}</h1>
          <div className="w-24 h-1 bg-red-600 mx-auto"></div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            {data.summary1 && (
              <article className="bg-gray-50 p-8 border-l-4 border-red-600">
                <h3 className="text-sm font-bold uppercase tracking-widest text-red-600 mb-4">The Article</h3>
                <div className="text-gray-800 font-serif text-lg leading-relaxed">
                  {renderContent(data.summary1)}
                </div>
              </article>
            )}
          </div>
          
          <aside className="lg:col-span-1">
            {data.summary2 && (
              <div className="bg-black text-white p-6 sticky top-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-red-600 mb-4">Community Voice</h3>
                <div className="text-gray-200 text-sm leading-relaxed">
                  {renderContent(data.summary2)}
                </div>
              </div>
            )}
          </aside>
        </div>

        {data.synthesis && (
          <section className="mb-12">
            <div className="flex items-center justify-center mb-8">
              <div className="w-full h-px bg-gray-300"></div>
              <span className="px-4 bg-white text-red-600 font-bold uppercase tracking-widest text-sm">Feature Story</span>
              <div className="w-full h-px bg-gray-300"></div>
            </div>
            <div className="columns-1 md:columns-2 gap-8 text-gray-800">
              <div className="prose prose-lg max-w-none">
                {renderContent(data.synthesis)}
              </div>
            </div>
          </section>
        )}

        <footer className="border-t-4 border-black pt-6 mt-12">
          <div className="flex justify-center gap-4">
            <button 
              onClick={actions.onDownloadFull}
              className="px-6 py-3 bg-black text-white font-bold uppercase tracking-wider hover:bg-red-600 transition-colors"
            >
              Download Issue
            </button>
            {canShare && (
              <button 
                onClick={() => actions.onShare('Synthesis', data.synthesis || '')}
                className="px-6 py-3 border-2 border-black text-black font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
              >
                Share Article
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Magazine;