import React from 'react';
import { HistoryEntry, MODEL_LABEL } from '../types';

interface Props {
  entries: HistoryEntry[];
  onLoad: (id: string) => void;
  onTogglePin: (id: string) => void;
  onClearAll: () => void;
  open: boolean;
  onClose: () => void;
}
export default function HistoryPanel({ entries, onLoad, onTogglePin, onClearAll, open, onClose }: Props) {
  if (!open) return null;
  const pinned = entries.filter(e => e.pinned);
  const rest = entries.filter(e => !e.pinned);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 p-4 overflow-y-auto">
      <div className="mx-auto max-w-3xl bg-gray-850 bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">History & Bookmarks</h2>
          <div className="flex gap-2">
            <button onClick={onClearAll} className="text-sm text-red-400 hover:underline">Clear All</button>
            <button onClick={onClose} className="text-sm text-blue-400 hover:underline">Close</button>
          </div>
        </div>

        {[...pinned, ...rest].map(e => (
          <div key={e.id} className="border border-gray-700 rounded-lg p-3 mb-3 bg-gray-900">
            <div className="text-sm text-gray-400">{new Date(e.createdAt).toLocaleString()} · {MODEL_LABEL[e.model]}</div>
            <div className="mt-1 text-gray-200 line-clamp-2">
              {e.hnTitle || e.title1 || e.url1 || 'Untitled'}
            </div>
            <div className="mt-2 flex gap-3">
              <button onClick={() => onLoad(e.id)} className="text-sm text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700">Load</button>
              <button onClick={() => onTogglePin(e.id)} className="text-sm text-gray-300 bg-gray-700 px-2 py-1 rounded hover:bg-gray-600">
                {e.pinned ? 'Unpin' : 'Pin'}
              </button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="text-gray-400">No saved sessions yet.</p>}
      </div>
    </div>
  );
}