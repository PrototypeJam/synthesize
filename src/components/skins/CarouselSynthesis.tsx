import React, { useState, useRef, useEffect } from 'react';
import type { SkinProps } from './SkinContract';

interface Topic {
  title: string;
  bullets: string[];
}

const CarouselSynthesis: React.FC<SkinProps> = ({ data, isBusy, statusText, canShare, actions }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState({ summary1: false, summary2: false });
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedTopics, setExpandedTopics] = useState<{ [key: number]: boolean }>({});
  const topicRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const topics: Topic[] = React.useMemo(() => {
    if (!data.synthesis) return [];
    const lines = data.synthesis.split('\n');
    const result: Topic[] = [];
    let currentTopic: Topic | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      const hasTopicFollows = trimmed.includes('TOPIC FOLLOWS');
      
      if (hasTopicFollows) {
        if (currentTopic) result.push(currentTopic);
        let title = trimmed
          .replace(/^TOPIC FOLLOWS\s*##\s*/i, '')
          .replace(/^##\s*TOPIC FOLLOWS:\s*/i, '')
          .replace(/^TOPIC FOLLOWS:\s*/i, '')
          .trim();
        currentTopic = { title, bullets: [] };
      } else if (currentTopic && (trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-'))) {
        const bullet = trimmed.replace(/^[•*-]\s*/, '');
        if (bullet) currentTopic.bullets.push(bullet);
      } else if (trimmed.startsWith('## ') && !hasTopicFollows) {
        if (currentTopic) result.push(currentTopic);
        currentTopic = null;
      }
    }
    if (currentTopic) result.push(currentTopic);
    return result;
  }, [data.synthesis]);

  const scrollToTopic = (index: number) => {
    setActiveIndex(index);
    topicRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const nextTopic = () => {
    const next = (activeIndex + 1) % topics.length;
    scrollToTopic(next);
  };

  const prevTopic = () => {
    const prev = (activeIndex - 1 + topics.length) % topics.length;
    scrollToTopic(prev);
  };

  const toggleTopic = (index: number) => {
    setExpandedTopics(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const renderBullet = (bullet: string, index: number) => {
    const articleMatch = bullet.match(/^(According to the Article:)/i);
    const hnMatch = bullet.match(/^(According to Hacker News User [^:]+:)/i);
    
    if (articleMatch) {
      return (
        <li key={index} className="mb-3">
          <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold mr-2">
            {articleMatch[1]}
          </span>
          <span>{bullet.substring(articleMatch[1].length).trim()}</span>
        </li>
      );
    }
    
    if (hnMatch) {
      return (
        <li key={index} className="mb-3">
          <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold mr-2">
            {hnMatch[1]}
          </span>
          <span>{bullet.substring(hnMatch[1].length).trim()}</span>
        </li>
      );
    }
    
    return <li key={index} className="mb-3">{bullet}</li>;
  };

  const renderSummaryContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        return <li key={i} className="list-disc ml-5 mb-2">{trimmed.replace(/^[•-]\s*/, '')}</li>;
      }
      if (trimmed) {
        return <p key={i} className="mb-2">{trimmed}</p>;
      }
      return null;
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pb-20">
      {isBusy && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 text-center z-50">
          {statusText}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 mt-4">
        {topics.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 justify-center">
            {topics.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => scrollToTopic(idx)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeIndex === idx
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {topic.title}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {data.summary1 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-gray-750 border-b border-gray-700">
                  <h3 className="font-bold text-sm">Article Summary</h3>
                  <button
                    onClick={() => setSidebarExpanded(prev => ({ ...prev, summary1: !prev.summary1 }))}
                    className="text-xs text-teal-400 hover:text-teal-300"
                  >
                    {sidebarExpanded.summary1 ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                <div
                  className="p-3 overflow-y-auto text-sm text-gray-300"
                  style={{ maxHeight: sidebarExpanded.summary1 ? '384px' : '192px' }}
                >
                  {renderSummaryContent(data.summary1)}
                </div>
                {data.url1 && (
                  <div className="p-2 border-t border-gray-700 text-xs">
                    <a href={data.url1} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Source
                    </a>
                  </div>
                )}
              </div>
            )}

            {data.summary2 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-gray-750 border-b border-gray-700">
                  <h3 className="font-bold text-sm">Discussion Summary</h3>
                  <button
                    onClick={() => setSidebarExpanded(prev => ({ ...prev, summary2: !prev.summary2 }))}
                    className="text-xs text-teal-400 hover:text-teal-300"
                  >
                    {sidebarExpanded.summary2 ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                <div
                  className="p-3 overflow-y-auto text-sm text-gray-300"
                  style={{ maxHeight: sidebarExpanded.summary2 ? '384px' : '192px' }}
                >
                  {renderSummaryContent(data.summary2)}
                </div>
                {data.url2 && (
                  <div className="p-2 border-t border-gray-700 text-xs">
                    <a href={data.url2} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Source
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {topics.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={prevTopic}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium"
                  >
                    ← Prev
                  </button>
                  <h2 className="text-xl font-bold text-center">Interactive Synthesis</h2>
                  <button
                    onClick={nextTopic}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium"
                  >
                    Next →
                  </button>
                </div>

                <div className="space-y-4">
                  {topics.map((topic, idx) => (
                    <div
                      key={idx}
                      ref={el => topicRefs.current[idx] = el}
                      className={`bg-gray-800 border-2 rounded-lg overflow-hidden transition-all ${
                        activeIndex === idx ? 'border-teal-500' : 'border-gray-700'
                      }`}
                    >
                      <div
                        onClick={() => toggleTopic(idx)}
                        className="p-4 cursor-pointer hover:bg-gray-750 flex items-start justify-between"
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{topic.title}</h3>
                          {!expandedTopics[idx] && topic.bullets[0] && (
                            <p className="text-sm text-gray-400 line-clamp-2">
                              {topic.bullets[0].substring(0, 100)}...
                            </p>
                          )}
                        </div>
                        <span className="text-2xl text-gray-500 ml-4">
                          {expandedTopics[idx] ? '▼' : '▶'}
                        </span>
                      </div>
                      {expandedTopics[idx] && (
                        <div className="p-4 pt-0 border-t border-gray-700">
                          <ul className="list-disc ml-5 space-y-2 text-gray-300">
                            {topic.bullets.map((bullet, bIdx) => renderBullet(bullet, bIdx))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                No synthesis available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-center gap-4">
          <button
            onClick={actions.onDownloadFull}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
          >
            Download
          </button>
          {canShare && (
            <button
              onClick={() => actions.onShare('Synthesis Carousel', data.synthesis || '')}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium"
            >
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarouselSynthesis;