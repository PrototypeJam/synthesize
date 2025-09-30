import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  streamSummary, streamSynthesis, fetchUrlContent, initializeAi, getApiKey,
  clearApiKey, loadModel, saveModel, resolveHN, buildMarkdown
} from './services/geminiService';
import { ProcessState, ResultData, ModelId, MODEL_LABEL, HistoryEntry } from './types';
import Spinner from './components/Spinner';
import UrlInput from './components/UrlInput';
import ResultCard from './components/ResultCard';
import ApiKeyModal from './components/ApiKeyModal';
import SettingsIcon from './components/icons/SettingsIcon';
import ModelSelector from './components/ModelSelector';
import HistoryPanel from './components/HistoryPanel';
import type { SkinComponent } from './components/skins/SkinContract';
import { DEMO_DATA } from './fixtures/demoData';

const HISTORY_KEY = 'synthi-history-v2';
const SKIN_STORAGE_KEY = 'synthi-skin';

function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  }, [entries]);
  const add = (e: HistoryEntry) => setEntries(prev => [e, ...prev].slice(0, 100));
  const togglePin = (id: string) => setEntries(prev => prev.map(x => x.id === id ? { ...x, pinned: !x.pinned } : x));
  const clearAll = () => setEntries([]);
  const get = (id: string) => entries.find(e => e.id === id);
  return { entries, add, togglePin, clearAll, get };
}

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

  // Modes and inputs
  const [mode, setMode] = useState<'single' | 'dual'>('single');
  const [inputType1, setInputType1] = useState<'url' | 'paste'>('url');
  const [inputType2, setInputType2] = useState<'url' | 'paste'>('url');
  const [pastedText1, setPastedText1] = useState('');
  const [pastedText2, setPastedText2] = useState('');

  // Streaming buffers
  const [summary1Buf, setSummary1Buf] = useState('');
  const [summary2Buf, setSummary2Buf] = useState('');
  const [synthesisBuf, setSynthesisBuf] = useState('');

  // Model selection
  const [model, setModel] = useState<ModelId>(loadModel() || 'gemini-2.5-flash');

  // History
  const history = useHistory();
  const [historyOpen, setHistoryOpen] = useState(false);

  // Smart HN
  const [hn, setHn] = useState<{ id?: string; title?: string; articleUrl?: string } | null>(null);
  const [hnUrl, setHnUrl] = useState<string | null>(null);

  // Skin state - now controlled by React state instead of URL params
  const [Skin, setSkin] = useState<SkinComponent | null>(null);
  const [currentSkinName, setCurrentSkinName] = useState<string>(() => {
    // Check URL param first, then localStorage, then default
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('skin') || localStorage.getItem(SKIN_STORAGE_KEY) || 'CarouselSynthesis';
  });

  // Demo mode
  const isDemo = useMemo(() => new URLSearchParams(window.location.search).get('demo') === '1', []);

  // Derived / flags
  const isBusy = ![ProcessState.IDLE, ProcessState.DONE, ProcessState.ERROR].includes(status);
  const statusText = useMemo(() => {
    const m = MODEL_LABEL[model];
    switch (status) {
      case ProcessState.FETCHING_1: return `Fetching source 1…`;
      case ProcessState.SUMMARIZING_1: return `Summarizing (model: ${m})`;
      case ProcessState.FETCHING_2: return `Fetching source 2…`;
      case ProcessState.SUMMARIZING_2: return `Summarizing second source (model: ${m})`;
      case ProcessState.SYNTHESIZING: return `Synthesizing (model: ${m})`;
      default: return '';
    }
  }, [status, model]);

  useEffect(() => { if (navigator.share) setCanShare(true); }, []);
  
  // API key initialization with demo guard
  useEffect(() => {
    if (isDemo) return;
    const k = getApiKey();
    if (k) {
      setApiKey(k);
      initializeAi(k);
    } else {
      setShowKeyModal(true);
    }
  }, [isDemo]);

  useEffect(() => { saveModel(model); }, [model]);

  // Skin loading - now depends on currentSkinName state
  useEffect(() => {
    const loadSkin = async () => {
      const name = currentSkinName.replace(/[^A-Za-z0-9_-]/g, '');
      
      const skins = import.meta.glob('./components/skins/*.tsx');
      const key = `./components/skins/${name}.tsx`;
      const fallbackKey = './components/skins/CarouselSynthesis.tsx';
     
      try {
        const loader = skins[key] || skins[fallbackKey];
        if (!loader) {
          console.error(`No skin found for ${name}, and no CarouselSynthesis fallback`);
          return;
        }
        const module = await loader() as any;
        setSkin(() => module.default as SkinComponent);
      } catch (error) {
        console.error(`Failed to load skin ${name}:`, error);
        try {
          const fallbackModule = await skins[fallbackKey]() as any;
          setSkin(() => fallbackModule.default as SkinComponent);
        } catch (fallbackError) {
          console.error('Failed to load CarouselSynthesis skin:', fallbackError);
        }
      }
    };
   
    loadSkin();
  }, [currentSkinName]);

  // Demo mode data injection
  useEffect(() => {
    if (!isDemo) return;
   
    setMode('dual');
    setResults({
      summary1: DEMO_DATA.summary1,
      summary2: DEMO_DATA.summary2,
      synthesis: DEMO_DATA.synthesis,
    });
    setSummary1Buf(DEMO_DATA.summary1);
    setSummary2Buf(DEMO_DATA.summary2);
    setSynthesisBuf(DEMO_DATA.synthesis);
    setUrl1(DEMO_DATA.url1);
    setUrl2(DEMO_DATA.url2);
    setHn(DEMO_DATA.hnTitle ? { title: DEMO_DATA.hnTitle, articleUrl: DEMO_DATA.url1 } : null);
    setHnUrl(DEMO_DATA.url2);
  }, [isDemo]);

  // Detect HN URL in url1 (single mode)
  useEffect(() => {
    if (isDemo) return;
    if (mode === 'single' && inputType1 === 'url' && /news\.ycombinator\.com\/item\?id=\d+/.test(url1)) {
      setHnUrl(url1);
      resolveHN(url1).then(setHn).catch(() => setHn(null));
    } else {
      setHn(null);
      setHnUrl(null);
    }
  }, [url1, mode, inputType1, isDemo]);

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
  const handleResetKey = () => { clearApiKey(); setApiKey(null); setShowKeyModal(true); };

  const handleShare = useCallback(async (title: string, text: string) => {
    if (!text) return;
    try { await navigator.share({ title, text }); } catch {}
  }, []);

  // Handle skin change without reloading page
  const handleSkinChange = (newSkin: string) => {
    setCurrentSkinName(newSkin);
    localStorage.setItem(SKIN_STORAGE_KEY, newSkin);
  };

  const getHostname = (url: string) => { try { return new URL(url).hostname; } catch { return 'Pasted'; } };

  // Normalize URLs for dedupe (strip trailing slash).
  const normalizeUrl = (u?: string | null) => {
    if (!u) return undefined;
    try {
      const s = new URL(u).toString();
      return s.endsWith('/') ? s.slice(0, -1) : s;
    } catch {
      return u.endsWith('/') ? u.slice(0, -1) : u;
    }
  };

  const appendVerifiedProvenance = useCallback(
    (body: string, links: { src1?: string; src2?: string; hn?: string }): string => {
      const content = (body || '').trim();
      const s1 = normalizeUrl(links.src1);
      const s2 = normalizeUrl(links.src2);
      const hn = normalizeUrl(links.hn);

      const seen = new Set<string>();
      const bullets: string[] = [];
      const add = (label: string, u?: string) => {
        if (!u || seen.has(u)) return;
        seen.add(u);
        bullets.push(`- ${label}: ${u}`);
      };

      add('Source 1', s1);
      add('Source 2', s2);
      if (hn && hn !== s1 && hn !== s2) add('Hacker News Thread', hn);

      if (bullets.length === 0) return content;

      const lines = content.split('\n');
      const provIdx = lines.findIndex(l => /^##\s*PROVENANCE\b/i.test(l));

      if (provIdx === -1) {
        return `${content}\n\n## PROVENANCE\n${bullets.join('\n')}`;
      }

      let nextIdx = lines.length;
      for (let i = provIdx + 1; i < lines.length; i++) {
        if (/^##\s+/.test(lines[i])) { nextIdx = i; break; }
      }
      const before = lines.slice(0, nextIdx);
      const after = lines.slice(nextIdx);
      if (before[before.length - 1]?.trim() !== '') before.push('');
      before.push(...bullets);
      return [...before, ...after].join('\n');
    },
    []
  );

  // --- Actions (Smart HN menu) ---
  const doQuickSummaries = async () => {
    if (!hnUrl || !hn?.articleUrl) return;
    setMode('dual');
    setInputType1('url'); setInputType2('url');
    setUrl1(hn.articleUrl); setUrl2(hnUrl);
    await runSummariesOnly({ url1: hn.articleUrl, url2: hnUrl });
  };
  const doFullAnalysis = async () => {
    if (!hnUrl || !hn?.articleUrl) return;
    setMode('dual');
    setInputType1('url'); setInputType2('url');
    setUrl1(hn.articleUrl); setUrl2(hnUrl);
    await runFull({ url1: hn.articleUrl, url2: hnUrl });
  };
  const doArticleOnly = async () => {
    if (!hnUrl || !hn?.articleUrl) return;
    setMode('single');
    setInputType1('url'); setUrl1(hn.articleUrl);
    await runSingle({ urlOrText: hn.articleUrl, isUrl: true });
  };
  const doDiscussionOnly = async () => {
    if (!hnUrl) return;
    setMode('single');
    setInputType1('url'); setUrl1(hnUrl);
    await runSingle({ urlOrText: hnUrl, isUrl: true });
  };

  // --- Core runners (streaming) ---
  const runSingle = async ({ urlOrText, isUrl }: { urlOrText: string; isUrl: boolean; }) => {
    if (!apiKey) { setShowKeyModal(true); return; }
    setError(null); setResults(null); setSummary1Buf(''); setSynthesisBuf(''); setStatus(ProcessState.IDLE);

    try {
      setStatus(ProcessState.FETCHING_1);
      const content = isUrl ? await fetchUrlContent(urlOrText) : urlOrText;

      setStatus(ProcessState.SUMMARIZING_1);
      const full = await streamSummary(content, model, setSummary1Buf);

      setResults({ summary1: full });
      setStatus(ProcessState.DONE);

      history.add({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        model,
        url1: isUrl ? urlOrText : undefined,
        results: { summary1: full },
        hnThreadUrl: hnUrl || undefined,
        hnTitle: hn?.title
      });
    } catch (err: any) {
      setError(err?.message || 'Unknown error'); setStatus(ProcessState.ERROR);
    }
  };

  const runSummariesOnly = async ({ url1: u1, url2: u2 }: { url1: string; url2: string; }) => {
    if (!apiKey) { setShowKeyModal(true); return; }
    setError(null); setResults(null);
    setSummary1Buf(''); setSummary2Buf(''); setSynthesisBuf('');
    setStatus(ProcessState.FETCHING_1);
    try {
      const [c1, c2] = await Promise.all([fetchUrlContent(u1), fetchUrlContent(u2)]);
      setStatus(ProcessState.SUMMARIZING_1);
      const [full1, full2] = await Promise.all([
        streamSummary(c1, model, setSummary1Buf),
        streamSummary(c2, model, setSummary2Buf)
      ]);
      setResults({ summary1: full1, summary2: full2 });
      setStatus(ProcessState.DONE);

      history.add({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        model,
        url1: u1,
        url2: u2,
        results: { summary1: full1, summary2: full2 },
        hnThreadUrl: hnUrl || undefined,
        hnTitle: hn?.title
      });
    } catch (err: any) {
      setError(err?.message || 'Unknown error'); setStatus(ProcessState.ERROR);
    }
  };

  const runFull = async ({ url1: u1, url2: u2 }: { url1: string; url2: string; }) => {
    if (!apiKey) { setShowKeyModal(true); return; }
    setError(null); setResults(null);
    setSummary1Buf(''); setSummary2Buf(''); setSynthesisBuf('');
    setStatus(ProcessState.FETCHING_1);
    try {
      const [c1, c2] = await Promise.all([fetchUrlContent(u1), fetchUrlContent(u2)]);
      setStatus(ProcessState.SUMMARIZING_1);
      const [full1, full2] = await Promise.all([
        streamSummary(c1, model, setSummary1Buf),
        streamSummary(c2, model, setSummary2Buf)
      ]);
      setResults({ summary1: full1, summary2: full2 });

      setStatus(ProcessState.SYNTHESIZING);
      const fullSynRaw = await streamSynthesis(c1, c2, model, setSynthesisBuf);
      const fullSyn = appendVerifiedProvenance(fullSynRaw, {
        src1: u1,
        src2: u2,
        hn: hnUrl || undefined
      });
      setResults({ summary1: full1, summary2: full2, synthesis: fullSyn });
      setStatus(ProcessState.DONE);

      history.add({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        model,
        url1: u1, url2: u2,
        results: { summary1: full1, summary2: full2, synthesis: fullSyn },
        hnThreadUrl: hnUrl || undefined,
        hnTitle: hn?.title
      });
    } catch (err: any) {
      setError(err?.message || 'Unknown error'); setStatus(ProcessState.ERROR);
    }
  };

  // --- Main button handler for generic flows ---
  const handleRun = async () => {
    if (!apiKey) { setShowKeyModal(true); return; }

    if (mode === 'single') {
      const isUrl = (inputType1 === 'url');
      const value = isUrl ? url1 : pastedText1;
      if (!value) { setError("Provide content for Source 1."); return; }
      await runSingle({ urlOrText: value, isUrl });
      return;
    }

    // dual
    const v1 = (inputType1 === 'url') ? url1 : pastedText1;
    const v2 = (inputType2 === 'url') ? url2 : pastedText2;
    if (!v1 || !v2) { setError("Provide content for both sources."); return; }

    if (inputType1 === 'url' && inputType2 === 'url') {
      await runFull({ url1: url1, url2: url2 });
    } else {
      // Mixed modes
      setError(null); setResults(null);
      setSummary1Buf(''); setSummary2Buf(''); setSynthesisBuf('');
      try {
        setStatus(ProcessState.SUMMARIZING_1);
        const c1 = (inputType1 === 'url') ? await fetchUrlContent(url1) : pastedText1;
        const c2 = (inputType2 === 'url') ? await fetchUrlContent(url2) : pastedText2;

        const [full1, full2] = await Promise.all([
          streamSummary(c1, model, setSummary1Buf),
          streamSummary(c2, model, setSummary2Buf)
        ]);
        setResults({ summary1: full1, summary2: full2 });
        setStatus(ProcessState.SYNTHESIZING);
        const synRaw = await streamSynthesis(c1, c2, model, setSynthesisBuf);
        const synWithProv = appendVerifiedProvenance(synRaw, {
          src1: inputType1 === 'url' ? url1 : undefined,
          src2: inputType2 === 'url' ? url2 : undefined,
          hn: hnUrl || undefined
        });
        setResults({ summary1: full1, summary2: full2, synthesis: synWithProv });
        setStatus(ProcessState.DONE);

        history.add({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          model,
          url1: inputType1 === 'url' ? url1 : undefined,
          url2: inputType2 === 'url' ? url2 : undefined,
          results: { summary1: full1, summary2: full2, synthesis: synWithProv },
          hnThreadUrl: hnUrl || undefined,
          hnTitle: hn?.title
        });
      } catch (err: any) {
        setError(err?.message || 'Unknown error'); setStatus(ProcessState.ERROR);
      }
    }
  };

  // Download helpers with YAML frontmatter
  const download = (markdown: string, filename: string) => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = u; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
  };

  const handleDownloadCard = (sectionBody: string, filename: string) => {
    const md = buildMarkdown({
      title: filename.replace(/\.md$/, ''),
      sections: [{ heading: 'Content', body: sectionBody }],
      model,
      url1: inputType1 === 'url' ? url1 : undefined,
      url2: inputType2 === 'url' ? url2 : undefined,
      workerBase: 'YOUR_WORKER_URL_HERE',
      hnThreadUrl: hnUrl || undefined,
      hnTitle: hn?.title
    });
    download(md, filename);
  };

  const handleDownloadFull = () => {
    const sections: Array<{ heading: string; body: string }> = [];
    if (results?.summary1) sections.push({ heading: 'Summary 1', body: results.summary1 });
    if (results?.summary2) sections.push({ heading: 'Summary 2', body: results.summary2 });
    if (results?.synthesis) sections.push({ heading: 'Synthesis', body: results.synthesis });
    const md = buildMarkdown({
      title: 'Synthi Report',
      sections,
      model,
      url1: inputType1 === 'url' ? url1 : undefined,
      url2: inputType2 === 'url' ? url2 : undefined,
      workerBase: 'YOUR_WORKER_URL_HERE',
      hnThreadUrl: hnUrl || undefined,
      hnTitle: hn?.title
    });
    download(md, 'synthi-report.md');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {!isDemo && showKeyModal && <ApiKeyModal onSave={handleKeySave} />}
      <main className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-10 relative">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            Synthi — Content Synthesizer
          </h1>
          <p className="mt-4 text-lg text-gray-400">Summarize and synthesize content from URLs or pasted text.</p>
          
          {/* Settings button */}
          <button onClick={handleResetKey} className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white" aria-label="Change API Key">
            <SettingsIcon />
          </button>
          
          {/* Design switcher - now updates state instead of reloading */}
          <div className="absolute top-0 right-12 flex items-center gap-2">
            <label htmlFor="skin-select" className="text-xs text-gray-400">Design:</label>
            <select
              id="skin-select"
              value={currentSkinName}
              onChange={(e) => handleSkinChange(e.target.value)}
              className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-600 hover:bg-gray-700"
            >
              <option value="CarouselSynthesis">Carousel</option>
              <option value="Default">Classic</option>
            </select>
          </div>
        </header>

        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 sm:p-8 shadow-2xl">
          {/* Model selector */}
          <ModelSelector value={model} onChange={setModel} />

          {/* Mode toggle */}
          <div className="text-center mb-6">
            <button onClick={() => setMode(mode === 'single' ? 'dual' : 'single')} className="text-blue-400 hover:text-blue-300 text-sm underline">
              {mode === 'single' ? '+ Compare a second source' : '← Just summarize one source'}
            </button>
          </div>

          {/* Inputs */}
          <div className={`grid grid-cols-1 ${mode === 'dual' ? 'md:grid-cols-2' : ''} gap-6 mb-6`}>
            {/* Source 1 */}
            <div className="flex flex-col">
              <div className="flex gap-2 mb-2 self-center">
                <button onClick={() => setInputType1('url')} className={`px-3 py-1 rounded text-sm ${inputType1 === 'url' ? 'bg-blue-600' : 'bg-gray-700'}`}>URL</button>
                <button onClick={() => setInputType1('paste')} className={`px-3 py-1 rounded text-sm ${inputType1 === 'paste' ? 'bg-blue-600' : 'bg-gray-700'}`}>Paste Text</button>
              </div>
              {inputType1 === 'url' ? (
                <UrlInput id="url1" label={mode === 'single' ? "Source URL" : "Source 1 URL"} value={url1} onChange={(e) => setUrl1(e.target.value)} placeholder="https://example.com/article or https://news.ycombinator.com/item?id=..." disabled={isBusy}/>
              ) : (
                <div className="flex-grow flex flex-col"><label className="block text-sm font-medium text-gray-400 mb-2">{mode === 'single' ? "Source Content" : "Source 1 Content"}</label><textarea value={pastedText1} onChange={(e) => setPastedText1(e.target.value)} placeholder="Paste content here..." disabled={isBusy} className="w-full flex-grow bg-gray-800 border border-gray-600 rounded-lg p-3 text-gray-100 disabled:opacity-50"/></div>
              )}
            </div>

            {/* Source 2 */}
            {mode === 'dual' && (
              <div className="flex flex-col">
                <div className="flex gap-2 mb-2 self-center">
                  <button onClick={() => setInputType2('url')} className={`px-3 py-1 rounded text-sm ${inputType2 === 'url' ? 'bg-blue-600' : 'bg-gray-700'}`}>URL</button>
                  <button onClick={() => setInputType2('paste')} className={`px-3 py-1 rounded text-sm ${inputType2 === 'paste' ? 'bg-blue-600' : 'bg-gray-700'}`}>Paste Text</button>
                </div>
                {inputType2 === 'url' ? (
                  <UrlInput id="url2" label="Source 2 URL" value={url2} onChange={(e) => setUrl2(e.target.value)} placeholder="https://example.com/article2" disabled={isBusy}/>
                ) : (
                  <div className="flex-grow flex flex-col"><label className="block text-sm font-medium text-gray-400 mb-2">Source 2 Content</label><textarea value={pastedText2} onChange={(e) => setPastedText2(e.target.value)} placeholder="Paste content here..." disabled={isBusy} className="w-full flex-grow bg-gray-800 border border-gray-600 rounded-lg p-3 text-gray-100 disabled:opacity-50"/></div>
                )}
              </div>
            )}
          </div>

          {/* Smart HN workflow menu */}
          {hnUrl && hn && (
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-300 mb-2">
                Detected Hacker News thread {hn.id ? `#${hn.id}` : ''}{hn.title ? ` — "${hn.title}"` : ''}.
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={doQuickSummaries} className="px-3 py-2 bg-blue-600 rounded text-white hover:bg-blue-700">Quick Summaries</button>
                <button onClick={doFullAnalysis} className="px-3 py-2 bg-teal-600 rounded text-white hover:bg-teal-700">Full Analysis</button>
                <button onClick={doArticleOnly} className="px-3 py-2 bg-gray-700 rounded text-white hover:bg-gray-600">Article Only</button>
                <button onClick={doDiscussionOnly} className="px-3 py-2 bg-gray-700 rounded text-white hover:bg-gray-600">Discussion Only</button>
              </div>
            </div>
          )}

          {/* Primary action (hide when HN menu present in single mode) */}
          {!(hnUrl && hn && mode === 'single') && (
            <button
              onClick={handleRun}
              disabled={isBusy || !apiKey}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
            >
              {isBusy ? (<><Spinner className="w-5 h-5" /><span>{statusText}</span></>) : (mode === 'single' ? 'Summarize' : 'Synthesize')}
            </button>
          )}

          {error && (
            <div className="mt-4 text-center">
              <p className="text-red-400 mb-2">{error}</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setError(null)} className="px-3 py-1 text-sm bg-gray-700 rounded">Dismiss</button>
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500 text-center">
            Status: {status === ProcessState.IDLE ? 'Ready' : (status === ProcessState.DONE ? 'Done' : statusText || '…')}
          </div>
        </div>

        {/* Results */}
        {Skin && !error && (isDemo || results || summary1Buf || summary2Buf || synthesisBuf) && (
          <Skin
            data={{
              summary1: results?.summary1 || summary1Buf,
              summary2: results?.summary2 || summary2Buf,
              synthesis: results?.synthesis || synthesisBuf,
              url1: url1 || undefined,
              url2: url2 || undefined,
              hnTitle: hn?.title || null
            }}
            isBusy={isBusy}
            statusText={statusText}
            canShare={canShare}
            actions={{
              onDownloadFull: handleDownloadFull,
              onShare: handleShare
            }}
          />
        )}
        {!Skin && (results || summary1Buf || summary2Buf || synthesisBuf) && !error && (
          <div className="mt-12">
            {mode === 'single' ? (
              <ResultCard
                title={inputType1 === 'url' ? `Summary of ${getHostname(url1)}` : 'Summary'}
                content={results?.summary1 || summary1Buf}
                isStreaming={isBusy}
                onDownload={() => handleDownloadCard(results?.summary1 || summary1Buf, 'summary.md')}
                onShare={() => handleShare('Summary', results?.summary1 || summary1Buf)}
                canShare={canShare}
                sources={inputType1 === 'url' ? [{ label: getHostname(url1), url: url1 }] : []}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <ResultCard
                    title={inputType1 === 'url' ? `Summary of ${getHostname(url1)}` : 'Summary 1'}
                    content={results?.summary1 || summary1Buf}
                    isStreaming={isBusy && !results?.summary1}
                    onDownload={() => handleDownloadCard(results?.summary1 || summary1Buf, 'summary-1.md')}
                    onShare={() => handleShare('Summary 1', results?.summary1 || summary1Buf)}
                    canShare={canShare}
                    sources={inputType1 === 'url' ? [{ label: getHostname(url1), url: url1 }] : []}
                  />
                  <ResultCard
                    title={inputType2 === 'url' ? `Summary of ${getHostname(url2)}` : 'Summary 2'}
                    content={results?.summary2 || summary2Buf}
                    isStreaming={isBusy && !results?.summary2}
                    onDownload={() => handleDownloadCard(results?.summary2 || summary2Buf, 'summary-2.md')}
                    onShare={() => handleShare('Summary 2', results?.summary2 || summary2Buf)}
                    canShare={canShare}
                    sources={inputType2 === 'url' ? [{ label: getHostname(url2), url: url2 }] : []}
                  />
                </div>
                <ResultCard
                  title="Synthesis of Both Sources"
                  content={results?.synthesis || synthesisBuf}
                  isSynthesis
                  isStreaming={isBusy && !results?.synthesis}
                  onDownload={handleDownloadFull}
                  onShare={() => handleShare('Synthesis', results?.synthesis || synthesisBuf)}
                  canShare={canShare}
                  sources={[
                    ...(inputType1 === 'url' ? [{ label: getHostname(url1), url: url1 }] : []),
                    ...(inputType2 === 'url' ? [{ label: getHostname(url2), url: url2 }] : [])
                  ]}
                />
              </>
            )}
          </div>
        )}

        {/* History */}
        <div className="mt-8 text-center">
          <button onClick={() => setHistoryOpen(true)} className="text-sm text-blue-400 hover:underline">Open History & Bookmarks</button>
        </div>
        <HistoryPanel
          entries={history.entries}
          onLoad={(id) => {
            const e = history.get(id); if (!e) return;
            setMode(e.url2 ? 'dual' : 'single');
            setInputType1('url'); setUrl1(e.url1 || '');
            if (e.url2) { setInputType2('url'); setUrl2(e.url2); }
            setResults(e.results);
            setSummary1Buf(e.results.summary1 || ''); setSummary2Buf(e.results.summary2 || ''); setSynthesisBuf(e.results.synthesis || '');
            setHnUrl(e.hnThreadUrl || null);
            setHn(e.hnTitle ? { title: e.hnTitle } : null);
          }}
          onTogglePin={history.togglePin}
          onClearAll={history.clearAll}
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />
      </main>
    </div>
  );
};

export default App;