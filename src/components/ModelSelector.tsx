import React from 'react';
import { ModelId, MODEL_LABEL } from '../types';

interface Props {
  value: ModelId;
  onChange: (m: ModelId) => void;
}
const models: ModelId[] = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'];

export default function ModelSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {models.map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-3 py-1 rounded-full text-sm border ${value === m ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'}`}
          aria-pressed={value === m}
        >
          {MODEL_LABEL[m]}
        </button>
      ))}
    </div>
  );
}