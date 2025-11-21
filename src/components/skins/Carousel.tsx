import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { SkinProps } from './SkinContract';

// :contentReference[oaicite:0]{index=0}
const Carousel: React.FC<SkinProps> = ({ data, isBusy, statusText, canShare, actions }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);

  const parseBullets = (text?: string) =>
    (text || '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map((l, i) => {
        if (l.startsWith('•')) return <li key={i} className="list-disc ml-5 mb-1">{l.replace(/^•\s?/, '')}</li>;
        return <p key={i} className="mb-1">{l}</p>;
      });

  const topics = useMemo(() => {
    const lines = (data.synthesis || '').split('\n');
    const out: Array<{ title: string; bullets: string[] }> = [];
    let current: { title: string; bullets: string[] } | null = null;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('## TOPIC FOLLOWS:') || (line.startsWith('##') && !/^##\s*PROVENANCE\b/i.test(line))) {
        const title = line.replace('## TOPIC FOLLOWS:', '').replace(/^##\s*/, '').trim();
        current = { title: title || 'Topic', bullets: [] };
        out.push(current);
        continue;
      }
      if ((line.startsWith('•') || line.startsWith('- ')) && current) current.bullets.push(line.replace(/^- /, '•'));
    }
    return out;
  }, [data.synthesis]);

  const slides = useMemo(() => {
    const arr: Array<React.ReactNode> = [];

    if (data.summary1 || data.summary2) {
      arr.push(
        <div key="summaries" className="w-full h-full p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">At-a-Glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.summary1 && (
              <section className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <div className="text-sm uppercase tracking-wide text-blue-300 mb-2">Article</div>
                <div className="text-gray-200 max-h-72 overflow-y-auto pr-2">
                  {parseBullets(data.summary1)}
                </div>
              </section>
            )}
            {data.summary2 && (
              <section className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <div className="text-sm uppercase tracking-wide text-orange-300 mb-2">HN Discussion</div>
                <div className="text-gray-200 max-h-72 overflow-y-auto pr-2">
                  {parseBullets(data.summary2)}
                </div>
              </section>
            )}
          </div>
        </div>
      );
    }

    topics.forEach((t, i) => {
      arr.push(
        <div key={`topic-${i}`} className="w-full h-full p-6 md:p-10">
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-700 rounded-2xl h-full p-6 md:p-8">
            <h3 className="text-2xl md:text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-400">
              {t.title}
            </h3>
            <ul className="text-gray-200 space-y-2 leading-relaxed">
              {t.bullets.map((b, j) => (
                <li key={j} className="list-disc ml-5">{b.replace(/^•\s?/, '')}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    });

    if ((data.synthesis || '').split('\n').some(l => /^##\s*PROVENANCE\b/i.test(l))) {
      const provLines = (data.synthesis || '').split('\n');
      const start = provLines.findIndex(l => /^##\s*PROVENANCE\b/i.test(l));
      const bullets = start >= 0 ? provLines.slice(start + 1).filter(l => l.trim().startsWith('-')) : [];
      if (bullets.length) {
        arr.push(
          <div key="prov" className="w-full h-full p-6 md:p-10">
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl h-full p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-100 mb-4">Provenance</h3>
              <ul className="text-gray-300 space-y-2">{bullets.map((l, i) => <li key={i} className="list-disc ml-5">{l.replace(/^-+\s*/, '')}</li>)}</ul>
            </div>
          </div>
        );
      }
    }

    return arr;
  }, [data.summary1, data.summary2, topics, data.synthesis]);

  const clampIdx = (n: number) => Math.max(0, Math.min(slides.length - 1, n));
  const go = (n: number) => setIdx(prev => clampIdx(prev + n));
  const setSlide = (n: number) => setIdx(clampIdx(n));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    setTouchDeltaX(e.touches[0].clientX - touchStartX);
  };
  const onTouchEnd = () => {
    if (Math.abs(touchDeltaX) > 60) {
      if (touchDeltaX < 0) go(1); else go(-1);
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  const progress = `${Math.min(idx + 1, Math.max(1, slides.length))} of ${Math.max(1, slides.length)}`;
  const translate = `-${idx * 100}%`;
  const dragOffset = touchDeltaX ? `${(touchDeltaX / (containerRef.current?.clientWidth || 1)) * 100}%` : '0%';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="sticky top-0 z-20 backdrop-blur bg-gray-900/70 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{data.hnTitle ? 'HN:' : 'Synthesis'}</span>
            <h1 className="text-base md:text-lg font-semibold truncate max-w-[55vw]">{data.hnTitle || 'Topic Carousel'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isBusy && <span className="text-xs text-blue-300">{statusText}</span>}
            <button
              onClick={actions.onDownloadFull}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm"
            >
              Download
            </button>
            {canShare && (
              <button
                onClick={() => actions.onShare('Synthesis', data.synthesis || '')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm"
              >
                Share
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div
          ref={containerRef}
          className="relative overflow-hidden h-[calc(100vh-140px)] md:h-[calc(100vh-160px)]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex h-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(calc(${translate} + ${dragOffset}))` }}
          >
            {slides.map((s, i) => (
              <div key={i} className="min-w-full">{s}</div>
            ))}
            {slides.length === 0 && (
              <div className="min-w-full h-full flex items-center justify-center p-8 text-gray-400">
                No synthesis available. Run a synthesis to view the carousel.
              </div>
            )}
          </div>

          <button
            aria-label="Previous"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-700/80 border border-gray-700 rounded-full w-10 h-10 flex items-center justify-center"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-700/80 border border-gray-700 rounded-full w-10 h-10 flex items-center justify-center"
          >
            ›
          </button>

          <div className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-2">
            <div className="px-2 py-1 text-xs rounded bg-gray-800/80 border border-gray-700">{progress}</div>
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === idx ? 'bg-blue-400 w-6' : 'bg-gray-600 hover:bg-gray-500'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Carousel;
