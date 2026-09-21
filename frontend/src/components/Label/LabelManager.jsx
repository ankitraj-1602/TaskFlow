import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '../Forms/Button';
import { LabelBadge } from './LabelBadge';
import { ColorPicker } from './ColorPicker';
import { useLabelStore } from '../../store/label.store';
import { DEFAULT_LABEL_COLOR } from '../../utils/labelColors';

/**
 * Full CRUD for project labels. Used in Project Settings.
 */
export const LabelManager = ({ projectId }) => {
  // ⬇️ FIXED: subscribe to specific slices
  const labels = useLabelStore((s) => s.labelsByProject[projectId]) || [];
  const loadProjectLabels = useLabelStore((s) => s.loadProjectLabels);
  const createLabel = useLabelStore((s) => s.createLabel);
  const updateLabel = useLabelStore((s) => s.updateLabel);
  const deleteLabel = useLabelStore((s) => s.deleteLabel);
  const isLoading = useLabelStore((s) => s.isLoading);

  const [isEditing, setIsEditing] = useState(null); // label id or 'new'
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_LABEL_COLOR);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadProjectLabels(projectId, true).catch(() => {
        toast.error('Failed to load labels');
      });
    }
  }, [projectId, loadProjectLabels]);

  const resetForm = () => {
    setName('');
    setColor(DEFAULT_LABEL_COLOR);
    setIsEditing(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsEditing('new');
  };

  const handleStartEdit = (label) => {
    setName(label.name);
    setColor(label.color);
    setIsEditing(label.id);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Label name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing === 'new') {
        await createLabel(projectId, { name: name.trim(), color });
        toast.success('Label created');
      } else {
        await updateLabel(isEditing, projectId, { name: name.trim(), color });
        toast.success('Label updated');
      }
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save label');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (labelId) => {
    try {
      await deleteLabel(labelId, projectId);
      toast.success('Label deleted');
      setConfirmDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete label');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Labels</h3>
          <p className="text-sm text-gray-500">
            Create custom labels for this project. Tasks can have multiple labels.
          </p>
        </div>
        {isEditing !== 'new' && (
          <Button size="sm" onClick={handleStartCreate}>
            <PlusIcon className="h-4 w-4 mr-1" />
            New Label
          </Button>
        )}
      </div>

      {/* Create/Edit form */}
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bug, Feature, Urgent"
              maxLength={50}
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Color
            </label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Preview:</span>
            <LabelBadge label={{ name: name || 'Label', color }} size="sm" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={resetForm}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} loading={submitting}>
              {isEditing === 'new' ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Label list */}
      {isLoading && labels.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-indigo-600" />
        </div>
      ) : labels.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-8">
          No labels yet. Create one to get started.
        </p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {labels.map((label) => (
            <div
              key={label.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <LabelBadge label={label} size="md" />
                {label.usageCount !== undefined && (
                  <span className="text-xs text-gray-500">
                    {label.usageCount} {label.usageCount === 1 ? 'task' : 'tasks'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStartEdit(label)}
                  className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                  title="Edit"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(label)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Delete label?
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              The label <strong>{confirmDelete.name}</strong> will be removed from all
              tasks. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(confirmDelete.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};