import React, { useState, useMemo } from 'react';
import type { SkinProps } from './SkinContract';

const Outline: React.FC<SkinProps> = ({ data, isBusy, statusText, canShare, actions }) => {
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const toggleSection = (id: string) => {
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Parse synthesis into hierarchical outline
    const outline = useMemo(() => {
        const lines = (data.synthesis || '').split('\n');
        const structure: Array<{
            level: number;
            number: string;
            title: string;
            content: string[];
            id: string;
        }> = [];

        let currentSection: typeof structure[0] | null = null;
        let sectionCounter = 0;
        let topicCounter = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const hasTopicFollows = trimmed.includes('TOPIC FOLLOWS');

            // Main topic headings (## TOPIC FOLLOWS or ## heading)
            if (hasTopicFollows || (trimmed.startsWith('##') && !/^##\s*PROVENANCE\b/i.test(trimmed))) {
                topicCounter++;
                let title = trimmed
                    .replace(/^TOPIC FOLLOWS\s*##\s*/i, '')
                    .replace(/^##\s*TOPIC FOLLOWS:\s*/i, '')
                    .replace(/^TOPIC FOLLOWS:\s*/i, '')
                    .replace(/^##\s*/, '')
                    .trim();

                const romanNumeral = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
                    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'][topicCounter - 1] || String(topicCounter);
                currentSection = {
                    level: 1,
                    number: romanNumeral,
                    title: title || `Topic ${topicCounter}`,
                    content: [],
                    id: `section-${topicCounter}`
                };
                structure.push(currentSection);
                sectionCounter = 0;
            }
            // Bullet points under current topic
            else if (currentSection && (trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-'))) {
                sectionCounter++;
                const bulletText = trimmed.replace(/^[•*-]\s*/, '');
                if (bulletText) {
                    const letter = String.fromCharCode(64 + sectionCounter); // A, B, C, etc.
                    currentSection.content.push(`${letter}. ${bulletText}`);
                }
            }
        }

        return structure;
    }, [data.synthesis]);

    // Summary sections
    const summaries = useMemo(() => {
        const items = [];
        if (data.summary1) {
            items.push({ id: 'summary1', title: 'Article Summary', content: data.summary1 });
        }
        if (data.summary2) {
            items.push({ id: 'summary2', title: 'Discussion Summary', content: data.summary2 });
        }
        return items;
    }, [data.summary1, data.summary2]);

    const copyLink = (id: string) => {
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        navigator.clipboard.writeText(url);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                {data.hnTitle || 'Synthesis Outline'}
                            </h1>
                            {isBusy && <p className="text-sm text-blue-400 mt-1">{statusText}</p>}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={actions.onDownloadFull}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                            >
                                Download
                            </button>
                            {canShare && (
                                <button
                                    onClick={() => actions.onShare('Outline', data.synthesis || '')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                >
                                    Share
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex max-w-7xl mx-auto">
                {/* Sidebar Table of Contents */}
                <aside className="hidden lg:block w-64 border-r border-gray-700 bg-gray-800/50 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                    <nav className="p-4">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            Contents
                        </h2>
                        <ul className="space-y-0.5 text-sm">
                            {summaries.map(s => (
                                <li key={s.id}>
                                    <a
                                        href={`#${s.id}`}
                                        className="block py-1.5 px-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    >
                                        {s.title}
                                    </a>
                                </li>
                            ))}
                            {outline.map((section, i) => (
                                <li key={i}>
                                    <a
                                        href={`#${section.id}`}
                                        className="block py-1.5 px-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    >
                                        <span className="text-blue-400">{section.number}.</span> {section.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 px-6 py-8">
                    {/* Summary Sections */}
                    {summaries.map((summary, i) => (
                        <section key={summary.id} id={summary.id} className="mb-8 scroll-mt-20">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-2xl font-bold text-blue-400">
                                    {summary.title}
                                </h2>
                                <button
                                    onClick={() => copyLink(summary.id)}
                                    className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800"
                                    title="Copy link to section"
                                >
                                    🔗 Copy Link
                                </button>
                            </div>
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
                                <div className="space-y-1.5 text-gray-300">
                                    {summary.content.split('\n').map((line, j) => {
                                        const trimmed = line.trim();
                                        if (trimmed.startsWith('•') || trimmed.startsWith('- ')) {
                                            return (
                                                <div key={j} className="flex gap-2 ml-4">
                                                    <span className="text-blue-400">•</span>
                                                    <span>{trimmed.replace(/^[•-]\s*/, '')}</span>
                                                </div>
                                            );
                                        }
                                        if (trimmed) return <p key={j}>{trimmed}</p>;
                                        return null;
                                    })}
                                </div>
                            </div>
                        </section>
                    ))}

                    {/* Synthesis Outline */}
                    <div className="space-y-6">
                        {outline.map((section, i) => {
                            const isCollapsed = collapsed.has(section.id);

                            return (
                                <section key={i} id={section.id} className="scroll-mt-20">
                                    <div className="flex items-center justify-between mb-3">
                                        <button
                                            onClick={() => toggleSection(section.id)}
                                            className="flex items-center gap-3 group flex-1"
                                        >
                                            <span className="text-lg text-gray-500 group-hover:text-gray-300 transition">
                                                {isCollapsed ? '▸' : '▾'}
                                            </span>
                                            <h2 className="text-2xl font-bold text-white group-hover:text-blue-300 transition text-left">
                                                <span className="text-blue-400">{section.number}.</span> {section.title}
                                            </h2>
                                        </button>
                                        <button
                                            onClick={() => copyLink(section.id)}
                                            className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800"
                                            title="Copy link to section"
                                        >
                                            🔗
                                        </button>
                                    </div>

                                    {!isCollapsed && (
                                        <div className="ml-12 space-y-2.5">
                                            {section.content.map((item, j) => (
                                                <div key={j} className="flex gap-3 text-gray-300 leading-relaxed">
                                                    <span className="text-teal-400 font-mono text-sm">{item.split('.')[0]}.</span>
                                                    <span>{item.substring(item.indexOf('.') + 1).trim()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                    </div>

                    {/* Provenance */}
                    {data.url1 || data.url2 ? (
                        <footer className="mt-12 pt-6 border-t border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                Sources
                            </h3>
                            <ul className="text-sm text-gray-400 space-y-1.5">
                                {data.url1 && (
                                    <li className="flex gap-2">
                                        <span className="text-blue-400">•</span>
                                        <a href={data.url1} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 hover:underline break-all">
                                            {data.url1}
                                        </a>
                                    </li>
                                )}
                                {data.url2 && (
                                    <li className="flex gap-2">
                                        <span className="text-orange-400">•</span>
                                        <a href={data.url2} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 hover:underline break-all">
                                            {data.url2}
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </footer>
                    ) : null}
                </main>
            </div>
        </div>
    );
};

export default Outline;
