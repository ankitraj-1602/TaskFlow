import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDownIcon,
  PlusIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { LabelBadge } from './LabelBadge';
import { useLabelStore } from '../../store/label.store';
import { labelApi } from '../../api/label.api';
import toast from 'react-hot-toast';

/**
 * Multi-select dropdown for attaching labels to a task.
 * Calls `onUpdate` after attach/detach so the parent can refetch.
 */
export const LabelPicker = ({
  taskId,
  projectId,
  currentLabels = [],
  disabled = false,
  onUpdate,
}) => {
  // ⬇️ FIXED: subscribe to the specific project's labels
  const allLabels = useLabelStore((s) => s.labelsByProject[projectId]) || [];
  const loadProjectLabels = useLabelStore((s) => s.loadProjectLabels);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState(null);
  const dropdownRef = useRef(null);

  const currentIds = new Set(currentLabels.map((l) => l.id));

  useEffect(() => {
    if (projectId) {
      loadProjectLabels(projectId).catch(() => {});
    }
  }, [projectId, loadProjectLabels]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLabels = allLabels.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

const handleToggle = async (label) => {
  if (disabled || pending) return;

  const isAttached = currentIds.has(label.id);
  setPending(label.id);

  try {
    if (isAttached) {
      await labelApi.detachFromTask(taskId, label.id);
    } else {
      await labelApi.attachToTask(taskId, label.id);
    }

    if (onUpdate) {
      await onUpdate();
    }

    // ⬇️ NEW: notify parent page to refresh its selectedTask
    window.dispatchEvent(new CustomEvent('task-updated', { detail: { taskId } }));
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to update label');
  } finally {
    setPending(null);
  }
};

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-wrap items-center gap-1.5">
        {currentLabels.map((label) => (
          <LabelBadge
            key={label.id}
            label={label}
            onRemove={disabled ? undefined : () => handleToggle(label)}
            size="sm"
          />
        ))}
        {!disabled && (
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 px-2 py-0.5 rounded-full border border-dashed border-gray-300 hover:border-indigo-400 transition-colors"
          >
            <PlusIcon className="h-3 w-3" />
            Add label
            <ChevronDownIcon className="h-3 w-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search labels..."
              autoFocus
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {filteredLabels.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-500 text-center">
                {allLabels.length === 0
                  ? 'No labels yet. Create one in project settings.'
                  : 'No labels match your search.'}
              </p>
            ) : (
              filteredLabels.map((label) => {
                const isAttached = currentIds.has(label.id);
                const isPending = pending === label.id;
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => handleToggle(label)}
                    disabled={!!pending}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-gray-50 ${
                      isPending ? 'opacity-50' : ''
                    }`}
                  >
                    <LabelBadge label={label} size="sm" />
                    {isAttached && (
                      <CheckIcon className="h-4 w-4 text-indigo-600" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};