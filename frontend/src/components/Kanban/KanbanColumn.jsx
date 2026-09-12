import React, { useMemo } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { PlusIcon } from '@heroicons/react/24/outline';
import { SortableTaskCard } from './SortableTaskCard';
import { useKanbanDnd } from './KanbanDndContext';

export const KanbanColumn = ({
  column,
  tasks,
  onTaskClick,
  onAddTask,
  onTaskMove,
  canCreate,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div
      className={`flex-shrink-0 w-80 bg-gray-100 rounded-lg flex flex-col max-h-[calc(100vh-220px)] transition-colors ${
        isOver ? 'ring-2 ring-indigo-500' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={`${column.color} h-3 w-3 rounded-full`}></div>
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        {canCreate && (
          <button
            onClick={onAddTask}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Add task"
          >
            <PlusIcon className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[100px]"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
              Drop tasks here
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onTaskMove={onTaskMove}
                columnId={column.id}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};