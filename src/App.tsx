import React, { useState, useCallback, useEffect } from 'react';
import { getSummary, getSynthesis, fetchUrlContent, initializeAi, getApiKey, clearApiKey } from './services/geminiService';
import { ProcessState, ResultData } from './types';
import Spinner from './components/Spinner';
import UrlInput from './components/UrlInput';
import ResultCard from './components/ResultCard';
import ApiKeyModal from './components/ApiKeyModal';
import SettingsIcon from './components/icons/SettingsIcon';

const App: React.FC = () => {
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [status, setStatus] = useState<ProcessState>(ProcessState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultData | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

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
    if (!url1 || !url2) {
      setError("Please provide both URLs.");
      return;
    }
    setError(null);
    setResults(null);
    setStatus(ProcessState.IDLE);

    let content1 = '', content2 = '';

    try {
      setStatus(ProcessState.FETCHING_1);
      content1 = await fetchUrlContent(url1);
      setStatus(ProcessState.SUMMARIZING_1);
      const summary1 = await getSummary(content1);
      setResults(prev => ({ ...prev, summary1 } as ResultData));

      setStatus(ProcessState.FETCHING_2);
      content2 = await fetchUrlContent(url2);
      setStatus(ProcessState.SUMMARIZING_2);
      const summary2 = await getSummary(content2);
      setResults(prev => ({ ...prev, summary2 } as ResultData));

      setStatus(ProcessState.SYNTHESIZING);
      const synthesis = await getSynthesis(content1, content2);
      setResults(prev => ({ ...prev, synthesis } as ResultData));

      setStatus(ProcessState.DONE);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error(err);
      setError(errorMessage);
      setStatus(ProcessState.ERROR);
    }
  }, [url1, url2, apiKey]);

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'URL';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {showKeyModal && <ApiKeyModal onSave={handleKeySave} />}
      <main className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-10 relative">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            URL Content Synthesizer
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Summarize and synthesize content from two URLs using the Gemini API.
          </p>
          <button onClick={handleResetKey} className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white transition-colors" aria-label="Change API Key">
              <SettingsIcon />
          </button>
        </header>

        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <UrlInput
              id="url1"
              label="URL 1"
              value={url1}
              onChange={(e) => setUrl1(e.target.value)}
              placeholder="https://example.com/article"
              disabled={isLoading}
            />
            <UrlInput
              id="url2"
              label="URL 2"
              value={url2}
              onChange={(e) => setUrl2(e.target.value)}
              placeholder="https://news.ycombinator.com/item?id=..."
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSynthesize}
            disabled={isLoading || !url1 || !url2 || !apiKey}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
          >
            {isLoading ? (
              <>
                <Spinner className="w-5 h-5" />
                <span>{status}</span>
              </>
            ) : (
              'Synthesize Content'
            )}
          </button>
          {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>

        {(status === ProcessState.DONE || (isLoading && results)) && results && (
          <div className="mt-12 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ResultCard
                    title={`Summary of ${getHostname(url1)}`}
                    content={results.summary1 || ''}
                    onDownload={() => handleDownload(results.summary1, 'summary-1.md')}
                    onShare={() => handleShare(`Summary of ${url1}`, results.summary1)}
                    canShare={canShare}
                />
                <ResultCard
                    title={`Summary of ${getHostname(url2)}`}
                    content={results.summary2 || ''}
                    onDownload={() => handleDownload(results.summary2, 'summary-2.md')}
                    onShare={() => handleShare(`Summary of ${url2}`, results.summary2)}
                    canShare={canShare}
                />
            </div>
            {results.synthesis && (
                <ResultCard
                    title="Synthesis of Both URLs"
                    content={results.synthesis}
                    isSynthesis={true}
                    onDownload={() => handleDownload(results.synthesis, 'synthesis.md')}
                    onShare={() => handleShare('Synthesis of URLs', results.synthesis)}
                    canShare={canShare}
                />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;