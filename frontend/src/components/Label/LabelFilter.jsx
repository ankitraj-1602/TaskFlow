import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LabelBadge } from './LabelBadge';
import { useLabelStore } from '../../store/label.store';

/**
 * Multi-select filter for labels.
 * Controlled by selectedLabelIds and onToggle.
 */
export const LabelFilter = ({
  projectId,
  selectedLabelIds = [],
  onToggle,
}) => {
  // ⬇️ FIXED: subscribe to the specific project's labels
  const labels = useLabelStore((s) => s.labelsByProject[projectId]) || [];
  const loadProjectLabels = useLabelStore((s) => s.loadProjectLabels);

  // Ensure labels are loaded
  useEffect(() => {
    if (projectId) {
      loadProjectLabels(projectId).catch(() => {});
    }
  }, [projectId, loadProjectLabels]);

  if (labels.length === 0) return null;

  return (
    <div className="flex items-center flex-wrap gap-2">
      <span className="text-xs text-gray-500 font-medium">Labels:</span>
      {labels.map((label) => {
        const isSelected = selectedLabelIds.includes(label.id);
        return (
          <button
            key={label.id}
            onClick={() => onToggle(label.id)}
            className={`inline-flex items-center transition-opacity ${
              isSelected ? 'opacity-100' : 'opacity-40 hover:opacity-70'
            }`}
          >
            <LabelBadge label={label} size="sm" />
            {isSelected && (
              <XMarkIcon className="h-3 w-3 ml-0.5 text-gray-500" />
            )}
          </button>
        );
      })}
      {selectedLabelIds.length > 0 && (
        <button
          onClick={() => selectedLabelIds.forEach((id) => onToggle(id))}
          className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
        >
          Clear
        </button>
      )}
    </div>
  );
};