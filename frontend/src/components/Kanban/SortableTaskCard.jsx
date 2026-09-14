import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from '../Task/TaskCard';

export const SortableTaskCard = ({
  task,
  onClick,
  onTaskMove,
  columnId,
  canDrag = true,   // ⬅️ default true (backwards compatible)
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      taskId: task.id,
      columnId,
    },
    disabled: !canDrag,   // ⬅️ disable drag for viewers
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // ⬇️ Only attach drag listeners/handlers when drag is enabled
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
      className={canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
    >
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
};