import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../Forms/Button';
import { useProjectStore } from '../../store/project.store';

export const CommentInput = ({
  initialValue = '',
  placeholder = 'Add a comment...',
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Post',
  autoFocus = false,
}) => {
  const [value, setValue] = useState(initialValue);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef(null);

  const { projectMembers } = useProjectStore();

  const filteredMembers = projectMembers
    .filter((m) => {
      if (!mentionQuery) return true;
      const q = mentionQuery.toLowerCase();
      return (
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  const handleChange = (e) => {
    const text = e.target.value;
    setValue(text);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAt >= 0) {
      const afterAt = textBeforeCursor.slice(lastAt + 1);
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionQuery(afterAt);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }

    setShowMentions(false);
  };

  const insertMention = (member) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = value.slice(cursorPos);

    const newValue =
      value.slice(0, lastAt) + `@${member.email} ` + textAfterCursor;

    setValue(newValue);
    setShowMentions(false);
    setMentionQuery('');

    setTimeout(() => {
      const newCursorPos = lastAt + member.email.length + 2;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % filteredMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(
          (i) => (i - 1 + filteredMembers.length) % filteredMembers.length
        );
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    if (!initialValue) setValue('');
  };

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        rows={2}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      />

      {showMentions && filteredMembers.length > 0 && (
        <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredMembers.map((member, idx) => (
            <button
              key={member.id}
              type="button"
              onClick={() => insertMention(member)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-indigo-50 ${
                idx === mentionIndex ? 'bg-indigo-50' : ''
              }`}
            >
              {member.profile_picture ? (
                <img
                  src={member.profile_picture}
                  alt={member.name}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 text-xs font-medium">
                    {member.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {member.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{member.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-2">
        {onCancel && (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!value.trim()}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};