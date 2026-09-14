import React, { createContext, useContext } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { TaskCard } from '../Task/TaskCard';

const KanbanDndContext_ = createContext(null);

export const useKanbanDnd = () => useContext(KanbanDndContext_);

export const KanbanDndProvider = ({
  children,
  tasks,
  onTaskMove,
  onTaskClick,
  canDrag = true,   // ⬅️ ADD THIS — was missing
}) => {
  const [activeTask, setActiveTask] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumnOfTask = (taskId) => {
    return tasks.find((t) => t.id === taskId)?.status;
  };

  const handleDragStart = (event) => {
    if (!canDrag) return;
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event) => {
    if (!canDrag) return;   // now `canDrag` is defined ✅

    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeColumn = findColumnOfTask(activeId);

    let overColumn;
    if (overId.toString().startsWith('column-')) {
      overColumn = overId.toString().replace('column-', '');
    } else {
      overColumn = findColumnOfTask(overId);
    }

    if (!activeColumn || !overColumn) return;

    // ─── Same column: reorder ─────────────────────────
    if (activeColumn === overColumn) {
      const columnTasks = tasks.filter((t) => t.status === activeColumn);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(columnTasks, oldIndex, newIndex);
      onTaskMove(activeId, activeColumn, newIndex + 1, reordered);
      return;
    }

    // ─── Different column: move to position ───────────
    let newPosition = 1;
    if (!overId.toString().startsWith('column-')) {
      const targetColumnTasks = tasks.filter((t) => t.status === overColumn);
      const overIndex = targetColumnTasks.findIndex((t) => t.id === overId);
      newPosition = overIndex >= 0 ? overIndex + 1 : targetColumnTasks.length + 1;
    } else {
      const targetColumnTasks = tasks.filter((t) => t.status === overColumn);
      newPosition = targetColumnTasks.length + 1;
    }

    onTaskMove(activeId, overColumn, newPosition);
  };

  return (
    <KanbanDndContext_.Provider value={{ activeTask }}>
      <DndContext
        sensors={canDrag ? sensors : []}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}
        {canDrag && (
          <DragOverlay>
            {activeTask ? (
              <div className="rotate-3 shadow-xl">
                <TaskCard task={activeTask} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        )}
      </DndContext>
    </KanbanDndContext_.Provider>
  );
};