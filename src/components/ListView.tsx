import React, { useState } from 'react';
import { ClipboardList, Sparkles } from 'lucide-react';
import type { Task } from '../types/todo';
import { TaskCard } from './TaskCard';

interface ListViewProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onEdit: (task: Task) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorderTasks: (draggedId: string, targetId: string) => void;
  onResetFilters?: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  onToggleStatus,
  onEdit,
  onDuplicate,
  onDelete,
  onReorderTasks,
  onResetFilters
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (sourceId && sourceId !== targetId) {
      onReorderTasks(sourceId, targetId);
    }
    setDraggedTaskId(null);
  };

  if (tasks.length === 0) {
    return (
      <div className="empty-hero-state glass-panel animate-fade-in">
        <div className="empty-hero-icon">
          <ClipboardList size={32} />
        </div>
        <div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Không tìm thấy công việc nào</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Không có công việc nào phù hợp với bộ lọc hiện tại hoặc danh sách đang trống.
          </p>
        </div>
        {onResetFilters && (
          <button type="button" className="btn btn-secondary" onClick={onResetFilters}>
            <Sparkles size={16} />
            <span>Xóa bộ lọc & Xem tất cả</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="list-view-container animate-fade-in">
      {tasks.map(task => (
        <div
          key={task.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, task.id)}
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
      ))}
    </div>
  );
};
