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
}) => {
  const [activeTask, setActiveTask] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // avoid accidental drags on click
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumnOfTask = (taskId) => {
    return tasks.find((t) => t.id === taskId)?.status;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event) => {
    // Optional: live feedback while dragging over another column.
    // We'll keep it minimal for now — actual move happens on drop.
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeColumn = findColumnOfTask(activeId);

    // Determine target column
    let overColumn;
    if (overId.toString().startsWith('column-')) {
      overColumn = overId.toString().replace('column-', '');
    } else {
      overColumn = findColumnOfTask(overId);
    }

    if (!activeColumn || !overColumn) return;

    // ─── Case 1: Same column — reorder ────────────────
    if (activeColumn === overColumn) {
      const columnTasks = tasks.filter((t) => t.status === activeColumn);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reordered = arrayMove(columnTasks, oldIndex, newIndex);
      onTaskMove(activeId, activeColumn, newIndex + 1, reordered);
      return;
    }

    // ─── Case 2: Different column — move to end ────────
    // If dropped on a card, insert before that card
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
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 shadow-xl">
              <TaskCard task={activeTask} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </KanbanDndContext_.Provider>
  );
};