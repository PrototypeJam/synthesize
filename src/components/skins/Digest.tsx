import React, { useState, useMemo } from 'react';
import type { SkinProps } from './SkinContract';

const Digest: React.FC<SkinProps> = ({ data, isBusy, statusText, canShare, actions }) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const toggleSection = (id: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Extract executive summary (first 3 key points from synthesis)
    const executiveSummary = useMemo(() => {
        const lines = (data.synthesis || '').split('\n').filter(l => l.trim().startsWith('•') || l.trim().startsWith('- '));
        return lines.slice(0, 3).map(l => l.replace(/^[•-]\s*/, ''));
    }, [data.synthesis]);

    // Parse synthesis into topics
    const topics = useMemo(() => {
        const lines = (data.synthesis || '').split('\n');
        const result: Array<{ title: string; bullets: string[]; id: string }> = [];
        let current: { title: string; bullets: string[]; id: string } | null = null;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (trimmed.startsWith('## TOPIC FOLLOWS:') || (trimmed.startsWith('##') && !/^##\s*PROVENANCE\b/i.test(trimmed))) {
                const title = trimmed.replace('## TOPIC FOLLOWS:', '').replace(/^##\s*/, '').trim();
                current = { title: title || 'Topic', bullets: [], id: title.toLowerCase().replace(/\s+/g, '-') };
                result.push(current);
            } else if ((trimmed.startsWith('•') || trimmed.startsWith('- ')) && current) {
                current.bullets.push(trimmed.replace(/^[•-]\s*/, ''));
            }
        });

        return result;
    }, [data.synthesis]);

    // Estimate read time (rough: 200 words per minute)
    const estimateReadTime = (text: string) => {
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {data.hnTitle || 'Content Digest'}
                            </h1>
                            {isBusy && <p className="text-sm text-blue-600 mt-1">{statusText}</p>}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={actions.onDownloadFull}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
                            >
                                Download
                            </button>
                            {canShare && (
                                <button
                                    onClick={() => actions.onShare('Digest', data.synthesis || '')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                                >
                                    Share
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Executive Summary */}
                {executiveSummary.length > 0 && (
                    <section className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded-r">
                        <h2 className="text-lg font-bold text-blue-900 mb-3">Executive Summary</h2>
                        <ul className="space-y-2">
                            {executiveSummary.map((point, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-800">
                                    <span className="text-blue-600 font-bold">•</span>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Table of Contents */}
                {topics.length > 0 && (
                    <nav className="bg-white border border-gray-200 rounded p-5 mb-8">
                        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                            Contents
                        </h2>
                        <ul className="space-y-1.5">
                            {topics.map((topic, i) => (
                                <li key={i}>
                                    <a
                                        href={`#${topic.id}`}
                                        className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById(topic.id)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    >
                                        {i + 1}. {topic.title}
                                    </a>
                                    <span className="text-gray-400 text-xs ml-2">
                                        ({topic.bullets.length} point{topic.bullets.length !== 1 ? 's' : ''})
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}

                {/* Source Summaries (Expandable) */}
                <div className="space-y-4 mb-8">
                    {data.summary1 && (
                        <div className="bg-white border border-gray-200 rounded overflow-hidden">
                            <button
                                onClick={() => toggleSection('summary1')}
                                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{expandedSections.has('summary1') ? '▼' : '▶'}</span>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-gray-900">Article Summary</h3>
                                        <p className="text-sm text-gray-500">{estimateReadTime(data.summary1)}</p>
                                    </div>
                                </div>
                            </button>
                            {expandedSections.has('summary1') && (
                                <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
                                    <div className="prose prose-sm max-w-none text-gray-800">
                                        {data.summary1.split('\n').map((line, i) => {
                                            const trimmed = line.trim();
                                            if (trimmed.startsWith('•') || trimmed.startsWith('- ')) {
                                                return <li key={i} className="ml-5 mb-1">{trimmed.replace(/^[•-]\s*/, '')}</li>;
                                            }
                                            if (trimmed) return <p key={i} className="mb-2">{trimmed}</p>;
                                            return null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {data.summary2 && (
                        <div className="bg-white border border-gray-200 rounded overflow-hidden">
                            <button
                                onClick={() => toggleSection('summary2')}
                                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{expandedSections.has('summary2') ? '▼' : '▶'}</span>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-gray-900">Discussion Summary</h3>
                                        <p className="text-sm text-gray-500">{estimateReadTime(data.summary2)}</p>
                                    </div>
                                </div>
                            </button>
                            {expandedSections.has('summary2') && (
                                <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
                                    <div className="prose prose-sm max-w-none text-gray-800">
                                        {data.summary2.split('\n').map((line, i) => {
                                            const trimmed = line.trim();
                                            if (trimmed.startsWith('•') || trimmed.startsWith('- ')) {
                                                return <li key={i} className="ml-5 mb-1">{trimmed.replace(/^[•-]\s*/, '')}</li>;
                                            }
                                            if (trimmed) return <p key={i} className="mb-2">{trimmed}</p>;
                                            return null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Synthesis Topics */}
                <div className="space-y-6">
                    {topics.map((topic, i) => (
                        <article key={i} id={topic.id} className="bg-white border border-gray-200 rounded p-6 scroll-mt-20">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="text-blue-600">{i + 1}.</span>
                                {topic.title}
                            </h2>
                            <ul className="space-y-2.5">
                                {topic.bullets.map((bullet, j) => (
                                    <li key={j} className="flex items-start gap-3 text-gray-700 leading-relaxed">
                                        <span className="text-blue-500 font-bold mt-0.5">•</span>
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>

                {/* Provenance */}
                {(data.synthesis || '').includes('## PROVENANCE') && (
                    <footer className="mt-12 pt-6 border-t border-gray-300">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                            Sources
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            {data.url1 && <p>• Article: {data.url1}</p>}
                            {data.url2 && <p>• Discussion: {data.url2}</p>}
                        </div>
                    </footer>
                )}
            </main>
        </div>
    );
};

export default Digest;
