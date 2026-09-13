import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
  AtSymbolIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';

export const activityIcon = (action) => {
  switch (action) {
    case 'CREATED':
      return { Icon: PlusCircleIcon, color: 'text-green-600', bg: 'bg-green-50' };
    case 'UPDATED':
      return { Icon: PencilSquareIcon, color: 'text-blue-600', bg: 'bg-blue-50' };
    case 'DELETED':
      return { Icon: TrashIcon, color: 'text-red-600', bg: 'bg-red-50' };
    case 'ASSIGNED':
      return { Icon: UserPlusIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    case 'REASSIGNED':
      return { Icon: ArrowsRightLeftIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    case 'STATUS_CHANGED':
      return { Icon: ArrowPathIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    case 'PRIORITY_CHANGED':
      return { Icon: FlagIcon, color: 'text-orange-600', bg: 'bg-orange-50' };
    case 'COMMENTED':
      return { Icon: ChatBubbleLeftIcon, color: 'text-blue-600', bg: 'bg-blue-50' };
    case 'MENTIONED':
      return { Icon: AtSymbolIcon, color: 'text-purple-600', bg: 'bg-purple-50' };
    case 'ATTACHED':
      return { Icon: PaperClipIcon, color: 'text-gray-600', bg: 'bg-gray-50' };
    case 'COMPLETED':
      return { Icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50' };
    case 'ARCHIVED':
      return { Icon: ArchiveBoxIcon, color: 'text-gray-600', bg: 'bg-gray-50' };
    case 'RESTORED':
      return { Icon: ArrowUturnLeftIcon, color: 'text-green-600', bg: 'bg-green-50' };
    default:
      return { Icon: PencilSquareIcon, color: 'text-gray-600', bg: 'bg-gray-50' };
  }
};