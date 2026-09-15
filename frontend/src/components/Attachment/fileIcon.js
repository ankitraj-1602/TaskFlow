import {
  DocumentIcon,
  PhotoIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ArchiveBoxIcon,
  FilmIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';

export const getFileIcon = (mimeType) => {
  if (!mimeType) return { Icon: DocumentIcon, color: 'text-gray-500' };

  if (mimeType.startsWith('image/')) {
    return { Icon: PhotoIcon, color: 'text-purple-500' };
  }
  if (mimeType === 'application/pdf') {
    return { Icon: DocumentTextIcon, color: 'text-red-500' };
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'text/csv') {
    return { Icon: TableCellsIcon, color: 'text-green-600' };
  }
  if (mimeType.includes('word') || mimeType === 'text/plain') {
    return { Icon: DocumentTextIcon, color: 'text-blue-500' };
  }
  if (mimeType === 'application/zip') {
    return { Icon: ArchiveBoxIcon, color: 'text-yellow-600' };
  }
  if (mimeType.startsWith('video/')) {
    return { Icon: FilmIcon, color: 'text-pink-500' };
  }
  if (mimeType.startsWith('audio/')) {
    return { Icon: MusicalNoteIcon, color: 'text-indigo-500' };
  }

  return { Icon: DocumentIcon, color: 'text-gray-500' };
};