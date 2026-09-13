import React from 'react';

export const MentionText = ({ content, className = '' }) => {
  if (!content) return null;

  const regex = /@([\w.+-]+@[\w-]+\.[\w.-]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: content.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'mention',
      value: match[1],
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      value: content.slice(lastIndex),
    });
  }

  return (
    <p className={className}>
      {parts.map((part, idx) =>
        part.type === 'mention' ? (
          <span
            key={idx}
            className="text-indigo-600 bg-indigo-50 px-1 rounded font-medium"
          >
            @{part.value}
          </span>
        ) : (
          <React.Fragment key={idx}>{part.value}</React.Fragment>
        )
      )}
    </p>
  );
};