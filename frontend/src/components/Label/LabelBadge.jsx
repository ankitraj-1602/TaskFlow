import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Colored pill for a label.
 *
 * Usage:
 *   <LabelBadge label={{ name: 'Bug', color: '#dc2626' }} />
 *   <LabelBadge label={label} onRemove={() => detach(label.id)} />
 */
export const LabelBadge = ({ label, onRemove, size = 'sm' }) => {
  if (!label) return null;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  // Compute readable text color based on background luminance
  const textColor = getReadableTextColor(label.color);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: label.color,
        color: textColor,
      }}
    >
      <span className="truncate max-w-[120px]">{label.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-80"
        >
          <XMarkIcon className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

/**
 * Compute black or white text based on the background hex color.
 * Uses relative luminance (WCAG formula).
 */
function getReadableTextColor(hexColor) {
  if (!hexColor || !hexColor.startsWith('#')) return '#ffffff';

  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? '#111827' : '#ffffff';
}