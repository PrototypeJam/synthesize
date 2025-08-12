import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderContent = () => {
    if (!content) return null;

    const lines = content.split('\n');
    let isFirstH1 = true;
    
    return lines.map((line, index) => {
      line = line.trim();

      if (line.startsWith('## TOPIC FOLLOWS:')) {
        return <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-blue-400">{line.replace('## TOPIC FOLLOWS:', '').trim()}</h2>;
      }
      
      if (line.startsWith('##')) {
        return <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-blue-400">{line.replace('##', '').trim()}</h2>;
      }

      if (line.startsWith('- ') || line.startsWith('- [ ]')) {
        let bulletContent = line.replace(/^- \[ \]\s*/, '').replace(/^- \s*/, '');
        const attributionRegex = /^(According to .*?:)/;
        const match = bulletContent.match(attributionRegex);
        const urlRegex = /(https?:\/\/[^\s)]+)(?=[\s)]|$)/g;

        const renderWithLinks = (text: string) => {
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = urlRegex.exec(text)) !== null) {
            const url = m[1];
            const start = m.index;
            if (start > lastIndex) parts.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex, start)}</span>);
            parts.push(
              <a key={`a-${start}`} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                {url}
              </a>
            );
            lastIndex = start + url.length;
          }
          if (lastIndex < text.length) parts.push(<span key={`t-end`}>{text.slice(lastIndex)}</span>);
          return parts;
        };

        if (match) {
          const attribution = match[1];
          const restOfContent = bulletContent.substring(attribution.length);
          return (
             <li key={index} className="mb-2 list-disc ml-5">
              <strong className="text-teal-400">{attribution}</strong>{renderWithLinks(restOfContent)}
            </li>
          );
        }
        return <li key={index} className="mb-2 list-disc ml-5">{renderWithLinks(bulletContent)}</li>;
      }
      
      if (line.trim() !== '' && isFirstH1) {
        isFirstH1 = false;
        return <h1 key={index} className="text-4xl font-extrabold mb-6 text-center text-white">{line}</h1>;
      }

      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-bold my-2">{line.slice(2, -2)}</p>;
      }
      
      return <p key={index} className="my-2">{line}</p>;
    });
  };

  return <div className="prose prose-invert max-w-none">{renderContent()}</div>;
};

export default MarkdownRenderer;