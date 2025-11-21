import React, { useState, useMemo } from 'react';
import type { SkinProps } from './SkinContract';

interface Node {
    id: string;
    label: string;
    type: 'center' | 'topic' | 'point';
    children?: string[];
    content?: string;
    x: number;
    y: number;
}

const MindMap: React.FC<SkinProps> = ({ data, isBusy, statusText, canShare, actions }) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['center']));
    const [selectedNode, setSelectedNode] = useState<string | null>('center');

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectNode = (id: string) => {
        setSelectedNode(id);
        if (!expandedNodes.has(id)) {
            setExpandedNodes(prev => new Set([...prev, id]));
        }
    };

    // Parse synthesis into mind map structure
    const { nodes, edges } = useMemo(() => {
        const lines = (data.synthesis || '').split('\n');
        const nodeList: Node[] = [];
        const edgeList: Array<{ from: string; to: string }> = [];

        // Center node
        nodeList.push({
            id: 'center',
            label: data.hnTitle || 'Synthesis',
            type: 'center',
            children: [],
            x: 50,
            y: 50,
        });

        let topicCounter = 0;
        let currentTopic: Node | null = null;
        let pointCounter = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const hasTopicFollows = trimmed.includes('TOPIC FOLLOWS');

            // Topics become main branches
            if (hasTopicFollows || (trimmed.startsWith('##') && !/^##\s*PROVENANCE\b/i.test(trimmed))) {
                topicCounter++;
                let title = trimmed
                    .replace(/^TOPIC FOLLOWS\s*##\s*/i, '')
                    .replace(/^##\s*TOPIC FOLLOWS:\s*/i, '')
                    .replace(/^TOPIC FOLLOWS:\s*/i, '')
                    .replace(/^##\s*/, '')
                    .trim();

                const angle = (topicCounter - 1) * (360 / 8); // Assume max 8 topics for layout
                const radius = 35;
                const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
                const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

                currentTopic = {
                    id: `topic-${topicCounter}`,
                    label: title || `Topic ${topicCounter}`,
                    type: 'topic',
                    children: [],
                    x,
                    y,
                };
                nodeList.push(currentTopic);
                nodeList[0].children!.push(currentTopic.id);
                edgeList.push({ from: 'center', to: currentTopic.id });
                pointCounter = 0;
            }
            // Bullet points become leaf nodes
            else if (currentTopic && (trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-'))) {
                pointCounter++;
                const content = trimmed.replace(/^[•*-]\s*/, '');
                if (!content) continue;

                const pointId = `${currentTopic.id}-point-${pointCounter}`;

                // Arrange points around their topic
                const angle = (pointCounter - 1) * (360 / 6); // Assume max 6 points per topic
                const offset = 15;
                const x = currentTopic.x + offset * Math.cos((angle * Math.PI) / 180);
                const y = currentTopic.y + offset * Math.sin((angle * Math.PI) / 180);

                const pointNode: Node = {
                    id: pointId,
                    label: content.substring(0, 40) + (content.length > 40 ? '...' : ''),
                    type: 'point',
                    content,
                    x,
                    y,
                };
                nodeList.push(pointNode);
                currentTopic.children!.push(pointId);
                edgeList.push({ from: currentTopic.id, to: pointId });
            }
        }

        return { nodes: nodeList, edges: edgeList };
    }, [data.synthesis, data.hnTitle]);

    const selectedNodeData = nodes.find(n => n.id === selectedNode);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-gray-100">
            {/* Header */}
            <header className="bg-gray-900/80 backdrop-blur border-b border-gray-700 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white">Mind Map</h1>
                            {isBusy && <p className="text-xs text-blue-400">{statusText}</p>}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={actions.onDownloadFull}
                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                            >
                                Download
                            </button>
                            {canShare && (
                                <button
                                    onClick={() => actions.onShare('Mind Map', data.synthesis || '')}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                >
                                    Share
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex h-[calc(100vh-4rem)]">
                {/* Mind Map Visualization */}
                <div className="flex-1 relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                        {/* Edges */}
                        <g className="edges">
                            {edges.map((edge, i) => {
                                const fromNode = nodes.find(n => n.id === edge.from);
                                const toNode = nodes.find(n => n.id === edge.to);
                                if (!fromNode || !toNode) return null;

                                const shouldShow = expandedNodes.has(edge.from);
                                if (!shouldShow) return null;

                                return (
                                    <line
                                        key={i}
                                        x1={fromNode.x}
                                        y1={fromNode.y}
                                        x2={toNode.x}
                                        y2={toNode.y}
                                        stroke={
                                            toNode.type === 'topic' ? '#60a5fa' :
                                                toNode.type === 'point' ? '#6ee7b7' :
                                                    '#9ca3af'
                                        }
                                        strokeWidth="0.2"
                                        opacity="0.5"
                                    />
                                );
                            })}
                        </g>

                        {/* Nodes */}
                        <g className="nodes">
                            {nodes.map(node => {
                                // Only show if parent is expanded (or if it's the center)
                                const parent = edges.find(e => e.to === node.id);
                                const shouldShow = !parent || expandedNodes.has(parent.from);
                                if (!shouldShow) return null;

                                const isSelected = selectedNode === node.id;
                                const isExpanded = expandedNodes.has(node.id);
                                const hasChildren = (node.children?.length || 0) > 0;

                                return (
                                    <g key={node.id}>
                                        <circle
                                            cx={node.x}
                                            cy={node.y}
                                            r={node.type === 'center' ? 5 : node.type === 'topic' ? 3 : 2}
                                            fill={
                                                node.type === 'center' ? '#f59e0b' :
                                                    node.type === 'topic' ? '#3b82f6' :
                                                        '#10b981'
                                            }
                                            stroke={isSelected ? '#fff' : 'none'}
                                            strokeWidth={isSelected ? '0.5' : '0'}
                                            className="cursor-pointer transition-all"
                                            onClick={() => selectNode(node.id)}
                                            opacity={isSelected ? 1 : 0.9}
                                        />
                                        <text
                                            x={node.x}
                                            y={node.y - (node.type === 'center' ? 6 : node.type === 'topic' ? 4 : 3)}
                                            textAnchor="middle"
                                            fontSize={node.type === 'center' ? 2.5 : node.type === 'topic' ? 1.8 : 1.2}
                                            fill="#fff"
                                            className="pointer-events-none select-none"
                                            fontWeight={node.type === 'center' ? 'bold' : 'normal'}
                                        >
                                            {node.label.substring(0, node.type === 'center' ? 20 : node.type === 'topic' ? 15 : 10)}
                                        </text>
                                        {hasChildren && (
                                            <circle
                                                cx={node.x}
                                                cy={node.y}
                                                r={node.type === 'center' ? 6 : 3.5}
                                                fill="none"
                                                stroke={isExpanded ? '#10b981' : '#6b7280'}
                                                strokeWidth="0.3"
                                                strokeDasharray={isExpanded ? 'none' : '1,0.5'}
                                                className="cursor-pointer"
                                                onClick={() => toggleNode(node.id)}
                                                opacity="0.6"
                                            />
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    </svg>

                    {/* Instructions */}
                    <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur rounded-lg p-3 text-xs text-gray-300 max-w-xs">
                        <p className="font-semibold mb-1">How to use:</p>
                        <ul className="space-y-0.5">
                            <li>• Click nodes to select and view details</li>
                            <li>• Click outer ring to expand/collapse children</li>
                            <li>• 🟡 Center = Main topic</li>
                            <li>• 🔵 Branches = Key topics</li>
                            <li>• 🟢 Leaves = Individual points</li>
                        </ul>
                    </div>
                </div>

                {/* Detail Panel */}
                {selectedNodeData && (
                    <aside className="w-80 bg-gray-800/50 backdrop-blur border-l border-gray-700 p-6 overflow-y-auto">
                        <div className="mb-4">
                            <span className={`inline-block px-2 py-  rounded text-xs font-semibold mb-2 ${selectedNodeData.type === 'center' ? 'bg-yellow-600' :
                                selectedNodeData.type === 'topic' ? 'bg-blue-600' :
                                    'bg-green-600'
                                }`}>
                                {selectedNodeData.type.toUpperCase()}
                            </span>
                            <h2 className="text-xl font-bold text-white mb-2">
                                {selectedNodeData.label}
                            </h2>
                        </div>

                        {selectedNodeData.content && (
                            <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                                <p className="text-gray-300 leading-relaxed">
                                    {selectedNodeData.content}
                                </p>
                            </div>
                        )}

                        {selectedNodeData.children && selectedNodeData.children.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                    Connected Nodes ({selectedNodeData.children.length})
                                </h3>
                                <ul className="space-y-1.5">
                                    {selectedNodeData.children.map(childId => {
                                        const child = nodes.find(n => n.id === childId);
                                        if (!child) return null;
                                        return (
                                            <li key={childId}>
                                                <button
                                                    onClick={() => selectNode(childId)}
                                                    className="w-full text-left px-3 py-2 rounded bg-gray-700/50 hover:bg-gray-700 transition text-sm text-gray-300 hover:text-white"
                                                >
                                                    {child.label}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {selectedNodeData.type === 'center' && (
                            <div className="mt-6">
                                <button
                                    onClick={() => {
                                        const allIds = new Set(nodes.map(n => n.id));
                                        setExpandedNodes(allIds);
                                    }}
                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium mb-2"
                                >
                                    Expand All
                                </button>
                                <button
                                    onClick={() => setExpandedNodes(new Set(['center']))}
                                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium"
                                >
                                    Collapse All
                                </button>
                            </div>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
};

export default MindMap;
