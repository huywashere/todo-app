import React, { useState } from 'react';
import { Plus, ListTodo, Flame, CheckCircle2 } from 'lucide-react';
import type { Task, TaskStatus } from '../types/todo';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onEdit: (task: Task) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveToColumn: (taskId: string, targetStatus: TaskStatus) => void;
  onReorderTasks: (draggedId: string, targetId: string, newStatus?: TaskStatus) => void;
  onQuickAddForStatus: (status: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onToggleStatus,
  onEdit,
  onDuplicate,
  onDelete,
  onMoveToColumn,
  onReorderTasks,
  onQuickAddForStatus
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const columns: { status: TaskStatus; title: string; icon: React.ReactNode; indicatorClass: string }[] = [
    {
      status: 'todo',
      title: 'Cần làm',
      icon: <ListTodo size={16} />,
      indicatorClass: 'todo'
    },
    {
      status: 'in_progress',
      title: 'Đang thực hiện',
      icon: <Flame size={16} />,
      indicatorClass: 'in_progress'
    },
    {
      status: 'completed',
      title: 'Đã hoàn thành',
      icon: <CheckCircle2 size={16} />,
      indicatorClass: 'completed'
    }
  ];

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleColumnDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleColumnDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleColumnDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (sourceId) {
      onMoveToColumn(sourceId, targetStatus);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleTaskDrop = (e: React.DragEvent, targetTaskId: string, targetStatus: TaskStatus) => {
    e.stopPropagation();
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (sourceId && sourceId !== targetTaskId) {
      onReorderTasks(sourceId, targetTaskId, targetStatus);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="kanban-grid animate-fade-in">
      {columns.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.status);

        return (
          <div
            key={col.status}
            className={`kanban-column ${dragOverColumn === col.status ? 'drag-over' : ''}`}
            onDragOver={(e) => handleColumnDragOver(e, col.status)}
            onDragLeave={handleColumnDragLeave}
            onDrop={(e) => handleColumnDrop(e, col.status)}
          >
            {/* Column Header */}
            <div className="kanban-column-header">
              <div className="column-title-wrap">
                <span className={`column-indicator ${col.indicatorClass}`} />
                <span className="column-title">{col.title}</span>
                <span className="column-count">{columnTasks.length}</span>
              </div>
              <button
                type="button"
                className="action-btn-sm"
                onClick={() => onQuickAddForStatus(col.status)}
                title={`Thêm công việc vào mục ${col.title}`}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Column Cards Container */}
            <div className="kanban-cards-container">
              {columnTasks.length === 0 ? (
                <div className="column-empty-state">
                  {col.icon}
                  <span>Chưa có việc nào ở đây. Kéo thả hoặc bấm + để thêm.</span>
                </div>
              ) : (
                columnTasks.map(task => (
                  <div
                    key={task.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => handleTaskDrop(e, task.id, col.status)}
                  >
                    <TaskCard
                      task={task}
                      onToggleStatus={onToggleStatus}
                      onEdit={onEdit}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedTaskId === task.id}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
