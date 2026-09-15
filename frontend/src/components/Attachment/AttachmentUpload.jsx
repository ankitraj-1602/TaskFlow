import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PaperClipIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useAttachmentStore } from '../../store/attachment.store';
import { formatFileSize } from '../../utils/formatFileSize';
import { Button } from '../Forms/Button';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export const AttachmentUpload = ({ taskId, disabled }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadAttachment, isUploading, uploadProgress } = useAttachmentStore();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    if (file.size > MAX_SIZE) {
      toast.error(`File too large. Max ${formatFileSize(MAX_SIZE)}`);
      return;
    }

    try {
      await uploadAttachment(taskId, file);
      toast.success(`${file.name} uploaded`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleFileInput = (e) => {
    handleFiles(e.target.files);
    e.target.value = ''; // reset so same file can be re-uploaded
  };

  if (disabled) return null;

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInput}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,image/*"
      />

      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        {isUploading ? (
          <div className="space-y-2">
            <ArrowUpTrayIcon className="h-6 w-6 mx-auto text-indigo-600 animate-pulse" />
            <p className="text-sm text-gray-700 font-medium">
              Uploading... {uploadProgress}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <PaperClipIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
            <p className="text-sm text-gray-700">
              <span className="font-medium text-indigo-600">Click to upload</span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOC, XLS, CSV, TXT, ZIP, images — max {formatFileSize(MAX_SIZE)}
            </p>
          </>
        )}
      </div>
    </div>
  );
};