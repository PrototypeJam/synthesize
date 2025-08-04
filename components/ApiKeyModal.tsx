
import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Enter Gemini API Key</h2>
        <p className="text-gray-400 mb-6">
          To use this application, you need to provide your Google AI Gemini API key. 
          You can get one from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>.
          Your key will be saved in your browser's local storage and will not be shared.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your API key here..."
            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-4 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            aria-label="Gemini API Key Input"
          />
          <button
            type="submit"
            disabled={!key.trim()}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            Save and Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;
