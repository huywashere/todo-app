import React from 'react';
import { Check, Edit2, Copy, Trash2, Calendar, CheckSquare, GripVertical, AlertCircle } from 'lucide-react';
import type { Task } from '../types/todo';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (id: string) => void;
  onEdit: (task: Task) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleStatus,
  onEdit,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging
}) => {
  const isCompleted = task.status === 'completed';

  // Compute due date label and urgency
  const getDueDateInfo = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = dueDateStr < today && !isCompleted;
    const isToday = dueDateStr === today;

    const parts = dueDateStr.split('-');
    const formatted = `${parts[2]}/${parts[1]}`;

    if (isOverdue) {
      return { text: `Quá hạn (${formatted})`, className: 'badge-date overdue' };
    }
    if (isToday) {
      return { text: `Hôm nay`, className: 'badge-date today' };
    }
    return { text: formatted, className: 'badge-date' };
  };

  const dueDateInfo = getDueDateInfo(task.dueDate);

  // Subtask progress
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const priorityLabels: Record<string, string> = {
    none: 'Không',
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    urgent: 'Khẩn cấp'
  };

  return (
    <div
      className={`task-card ${isCompleted ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, task.id)}
      onDragEnd={onDragEnd}
    >
      <div className="task-card-header">
        {/* Drag handle icon */}
        <div style={{ color: 'var(--text-muted)', cursor: 'grab', marginTop: '2px' }} title="Kéo để sắp xếp">
          <GripVertical size={16} />
        </div>

        {/* Checkbox */}
        <button
          type="button"
          className={`custom-checkbox ${isCompleted ? 'checked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(task.id);
          }}
          aria-label={isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
        >
          {isCompleted && <Check size={14} strokeWidth={3} />}
        </button>

        {/* Title & Description */}
        <div className="task-title-area" onClick={() => onEdit(task)} style={{ cursor: 'pointer' }}>
          <h3 className={`task-title ${isCompleted ? 'completed' : ''}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="task-desc">{task.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="task-actions">
          <button
            type="button"
            className="action-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            title="Chỉnh sửa công việc"
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            className="action-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(task.id);
            }}
            title="Nhân bản"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            className="action-btn-sm delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            title="Xóa công việc"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Footer Metadata */}
      <div className="task-card-footer">
        <div className="task-meta-left">
          {/* Priority Badge */}
          <span className={`badge-priority ${task.priority}`}>
            {task.priority === 'urgent' && <AlertCircle size={11} />}
            {priorityLabels[task.priority]}
          </span>

          {/* Tags */}
          {task.tags.map(tag => (
            <span key={tag} className="badge-tag">
              #{tag}
            </span>
          ))}

          {/* Subtasks Count */}
          {totalSubtasks > 0 && (
            <span className="badge-subtasks">
              <CheckSquare size={12} />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </span>
          )}

          {/* Due date */}
          {dueDateInfo && (
            <span className={dueDateInfo.className}>
              <Calendar size={12} />
              <span>{dueDateInfo.text}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
