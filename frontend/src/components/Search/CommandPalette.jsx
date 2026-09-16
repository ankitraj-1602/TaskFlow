import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { searchApi } from '../../api/search.api';
import { HighlightText } from './HighlightText';

export const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef(null);

  // Debounce input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Fetch results
  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery, { limit: 5 }),
    enabled: debouncedQuery.trim().length > 0 && isOpen,
    staleTime: 30_000,
  });

  // Escape key closes
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleNavigate = (item) => {
    onClose();

    if (item.type === 'task') {
      navigate(
        `/workspaces/${item.workspaceId}/projects/${item.projectId}/tasks?taskId=${item.id}`
      );
    } else if (item.type === 'project') {
      navigate(`/workspaces/${item.workspaceId}/projects/${item.id}`);
    } else if (item.type === 'comment') {
      navigate(
        `/workspaces/${item.workspaceId}/projects/${item.projectId}/tasks?taskId=${item.taskId}`
      );
    }
  };

  if (!isOpen) return null;

  const results = data || { tasks: [], projects: [], comments: [] };
  const hasResults =
    results.tasks.length + results.projects.length + results.comments.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, projects, comments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none text-base placeholder:text-gray-400"
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && debouncedQuery && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-indigo-600" />
            </div>
          )}

          {!isLoading && !hasResults && debouncedQuery && (
            <div className="text-center py-8 text-sm text-gray-500">
              No results for "{debouncedQuery}"
            </div>
          )}

          {!debouncedQuery && (
            <div className="text-center py-8 text-xs text-gray-400">
              Type to search across your workspaces
            </div>
          )}

          {hasResults && (
            <div className="py-2">
              {/* Tasks */}
              {results.tasks.length > 0 && (
                <ResultGroup
                  title="Tasks"
                  icon={ClipboardDocumentListIcon}
                  items={results.tasks}
                  onSelect={handleNavigate}
                  renderItem={(task) => ({
                    primary: <HighlightText text={task.highlightedTitle} />,
                    secondary: task.projectName,
                  })}
                />
              )}

              {/* Projects */}
              {results.projects.length > 0 && (
                <ResultGroup
                  title="Projects"
                  icon={FolderIcon}
                  items={results.projects}
                  onSelect={handleNavigate}
                  renderItem={(p) => ({
                    primary: <HighlightText text={p.highlightedName} />,
                    secondary: p.workspaceName,
                  })}
                />
              )}

              {/* Comments */}
              {results.comments.length > 0 && (
                <ResultGroup
                  title="Comments"
                  icon={ChatBubbleLeftIcon}
                  items={results.comments}
                  onSelect={handleNavigate}
                  renderItem={(c) => ({
                    primary: (
                      <HighlightText text={c.highlightedContent} truncate />
                    ),
                    secondary: `on ${c.taskTitle} · ${c.authorName}`,
                  })}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          <span>Navigate with ↑ ↓ · Select with Enter</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};

// ─── Result group component ─────────────────────────
const ResultGroup = ({ title, icon: Icon, items, onSelect, renderItem }) => (
  <div className="mb-2">
    <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
      {title}
    </div>
    {items.map((item) => {
      const { primary, secondary } = renderItem(item);
      return (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
        >
          <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-900 truncate">{primary}</div>
            {secondary && (
              <div className="text-xs text-gray-500 truncate mt-0.5">
                {secondary}
              </div>
            )}
          </div>
        </button>
      );
    })}
  </div>
);