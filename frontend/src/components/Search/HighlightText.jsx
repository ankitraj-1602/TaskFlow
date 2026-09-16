import React from 'react';

/**
 * Renders highlighted snippets from Postgres ts_headline.
 * Input: string with <b>...</b> markup.
 */
export const HighlightText = ({ text, truncate }) => {
  if (!text) return null;

  // Postgres uses <b> tags. Split and render.
  const parts = [];
  const regex = /(<b>.*?<\/b>)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const highlighted = match[1].replace(/<\/?b>/g, '');
    parts.push({ type: 'highlight', value: highlighted });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return (
    <span className={truncate ? 'line-clamp-1' : ''}>
      {parts.map((p, i) =>
        p.type === 'highlight' ? (
          <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">
            {p.value}
          </mark>
        ) : (
          <React.Fragment key={i}>{p.value}</React.Fragment>
        )
      )}
    </span>
  );
};