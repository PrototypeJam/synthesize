import React, { useState, useCallback, useEffect } from 'react';
import { getSummary, getSynthesis, fetchUrlContent, initializeAi, getApiKey, clearApiKey } from './services/geminiService';
import { ProcessState, ResultData } from './types';
import Spinner from './components/Spinner';
import UrlInput from './components/UrlInput';
import ResultCard from './components/ResultCard';
import ApiKeyModal from './components/ApiKeyModal';
import SettingsIcon from './components/icons/SettingsIcon';

const App: React.FC = () => {
  // Core state
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [status, setStatus] = useState<ProcessState>(ProcessState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultData | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  
  // New feature state
  const [mode, setMode] = useState<'single' | 'dual'>('single');
  const [inputType1, setInputType1] = useState<'url' | 'paste'>('url');
  const [inputType2, setInputType2] = useState<'url' | 'paste'>('url');
  const [pastedText1, setPastedText1] = useState('');
  const [pastedText2, setPastedText2] = useState('');

  useEffect(() => {
    if (navigator.share) {
      setCanShare(true);
    }
    const storedKey = getApiKey();
    if (storedKey) {
      setApiKey(storedKey);
      initializeAi(storedKey);
    } else {
      setShowKeyModal(true);
    }
  }, []);
  
  const handleKeySave = (key: string) => {
    try {
        initializeAi(key);
        setApiKey(key);
        setShowKeyModal(false);
        setError(null);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };
  
  const handleResetKey = () => {
    clearApiKey();
    setApiKey(null);
    setShowKeyModal(true);
  }

  const isLoading = status !== ProcessState.IDLE && status !== ProcessState.DONE && status !== ProcessState.ERROR;

  const handleDownload = useCallback((content: string, filename: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleShare = useCallback(async (title: string, text: string) => {
    if (!text) return;
    try {
      await navigator.share({ title, text });
    } catch (err) {
      console.error("Sharing failed:", err);
    }
  }, []);

  const handleSynthesize = useCallback(async () => {
    if (!apiKey) {
        setError("API Key is not set. Please set your API key.");
        setShowKeyModal(true);
        return;
    }
    
    // Improved Validation Logic
    if (mode === 'single') {
      if (inputType1 === 'url' && !url1) { setError("Please provide a URL for Source 1."); return; }
      if (inputType1 === 'paste' && !pastedText1) { setError("Please paste some content for Source 1."); return; }
    } else { // dual mode
      if (inputType1 === 'url' && !url1) { setError("Please provide a URL for Source 1."); return; }
      if (inputType1 === 'paste' && !pastedText1) { setError("Please paste some content for Source 1."); return; }
      if (inputType2 === 'url' && !url2) { setError("Please provide a URL for Source 2."); return; }
      if (inputType2 === 'paste' && !pastedText2) { setError("Please paste some content for Source 2."); return; }
    }
    
    setError(null);
    setResults(null);
    setStatus(ProcessState.IDLE);

    try {
      if (mode === 'single') {
        setStatus(ProcessState.FETCHING_1);
        const content1 = inputType1 === 'url' ? await fetchUrlContent(url1) : pastedText1;
        
        setStatus(ProcessState.SUMMARIZING_1);
        const summary1 = await getSummary(content1);
        setResults({ summary1 });
        setStatus(ProcessState.DONE);
        return;
      }
      
      // Dual mode with parallel processing
      setStatus(ProcessState.FETCHING_1);
      const [content1, content2] = await Promise.all([
        inputType1 === 'url' ? fetchUrlContent(url1) : Promise.resolve(pastedText1),
        inputType2 === 'url' ? fetchUrlContent(url2) : Promise.resolve(pastedText2)
      ]);
      
      setStatus(ProcessState.SUMMARIZING_1);
      const [summary1, summary2] = await Promise.all([
        getSummary(content1),
        getSummary(content2)
      ]);
      setResults({ summary1, summary2 });
      
      setStatus(ProcessState.SYNTHESIZING);
      const synthesis = await getSynthesis(content1, content2);
      setResults(prev => ({ ...prev, synthesis }));
      
      setStatus(ProcessState.DONE);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error(err);
      setError(errorMessage);
      setStatus(ProcessState.ERROR);
    }
  }, [url1, url2, pastedText1, pastedText2, apiKey, mode, inputType1, inputType2]);

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'Pasted';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {showKeyModal && <ApiKeyModal onSave={handleKeySave} />}
      <main className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-10 relative">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            Content Synthesizer
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Summarize and synthesize content from URLs or pasted text.
          </p>
          <button onClick={handleResetKey} className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white transition-colors" aria-label="Change API Key">
              <SettingsIcon />
          </button>
        </header>

        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <button 
              onClick={() => setMode(mode === 'single' ? 'dual' : 'single')}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              {mode === 'single' ? '+ Compare a second source' : '← Just summarize one source'}
            </button>
          </div>
          
          <div className={`grid grid-cols-1 ${mode === 'dual' ? 'md:grid-cols-2' : ''} gap-6 mb-6`}>
            {/* Source 1 Input */}
            <div className="flex flex-col">
              <div className="flex gap-2 mb-2 self-center">
                <button onClick={() => setInputType1('url')} className={`px-3 py-1 rounded text-sm ${inputType1 === 'url' ? 'bg-blue-600' : 'bg-gray-700'}`}>URL</button>
                <button onClick={() => setInputType1('paste')} className={`px-3 py-1 rounded text-sm ${inputType1 === 'paste' ? 'bg-blue-600' : 'bg-gray-700'}`}>Paste Text</button>
              </div>
              {inputType1 === 'url' ? (
                <UrlInput id="url1" label={mode === 'single' ? "Source URL" : "Source 1 URL"} value={url1} onChange={(e) => setUrl1(e.target.value)} placeholder="https://example.com/article" disabled={isLoading}/>
              ) : (
                <div className="flex-grow flex flex-col"><label className="block text-sm font-medium text-gray-400 mb-2">{mode === 'single' ? "Source Content" : "Source 1 Content"}</label><textarea value={pastedText1} onChange={(e) => setPastedText1(e.target.value)} placeholder="Paste content here..." disabled={isLoading} className="w-full flex-grow bg-gray-800 border border-gray-600 rounded-lg p-3 text-gray-100 disabled:opacity-50"/></div>
              )}
            </div>
            
            {/* Source 2 Input (Conditional) */}
            {mode === 'dual' && (
              <div className="flex flex-col">
                <div className="flex gap-2 mb-2 self-center">
                  <button onClick={() => setInputType2('url')} className={`px-3 py-1 rounded text-sm ${inputType2 === 'url' ? 'bg-blue-600' : 'bg-gray-700'}`}>URL</button>
                  <button onClick={() => setInputType2('paste')} className={`px-3 py-1 rounded text-sm ${inputType2 === 'paste' ? 'bg-blue-600' : 'bg-gray-700'}`}>Paste Text</button>
                </div>
                {inputType2 === 'url' ? (
                  <UrlInput id="url2" label="Source 2 URL" value={url2} onChange={(e) => setUrl2(e.target.value)} placeholder="https://example.com/article2" disabled={isLoading}/>
                ) : (
                  <div className="flex-grow flex flex-col"><label className="block text-sm font-medium text-gray-400 mb-2">Source 2 Content</label><textarea value={pastedText2} onChange={(e) => setPastedText2(e.target.value)} placeholder="Paste content here..." disabled={isLoading} className="w-full flex-grow bg-gray-800 border border-gray-600 rounded-lg p-3 text-gray-100 disabled:opacity-50"/></div>
                )}
              </div>
            )}
          </div>
          
          <button onClick={handleSynthesize} disabled={isLoading || !apiKey} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/50">
            {isLoading ? (<><Spinner className="w-5 h-5" /><span>{status}</span></>) : (mode === 'single' ? 'Summarize' : 'Synthesize')}
          </button>
          
          {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
          
          <p className="text-xs text-gray-500 mt-4 text-center">Note: URL fetching uses a public proxy. If it fails, please use the "Paste Text" option.</p>
        </div>

        {results && !error && (
          <div className="mt-12 animate-fade-in">
            {mode === 'single' ? (
              results.summary1 && <ResultCard title={inputType1 === 'url' ? `Summary of ${getHostname(url1)}` : 'Summary'} content={results.summary1} onDownload={() => handleDownload(results.summary1!, 'summary.md')} onShare={() => handleShare('Summary', results.summary1!)} canShare={canShare}/>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {results.summary1 && <ResultCard title={inputType1 === 'url' ? `Summary of ${getHostname(url1)}` : 'Summary 1'} content={results.summary1} onDownload={() => handleDownload(results.summary1!, 'summary-1.md')} onShare={() => handleShare('Summary 1', results.summary1!)} canShare={canShare}/>}
                  {results.summary2 && <ResultCard title={inputType2 === 'url' ? `Summary of ${getHostname(url2)}` : 'Summary 2'} content={results.summary2} onDownload={() => handleDownload(results.summary2!, 'summary-2.md')} onShare={() => handleShare('Summary 2', results.summary2!)} canShare={canShare}/>}
                </div>
                {results.synthesis && <ResultCard title="Synthesis of Both Sources" content={results.synthesis} isSynthesis={true} onDownload={() => handleDownload(results.synthesis!, 'synthesis.md')} onShare={() => handleShare('Synthesis', results.synthesis!)} canShare={canShare}/>}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;