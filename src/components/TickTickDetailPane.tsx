import React, { useState } from 'react';
import {
  Check,
  Calendar,
  Flag,
  MoreHorizontal,
  Trash2,
  Plus,
  Inbox,
  X,
  ListTodo
} from 'lucide-react';
import type { Task, TaskPriority, TaskList } from '../types/todo';

interface TickTickDetailPaneProps {
  task: Task | null;
  lists: TaskList[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onClose: () => void;
}

export const TickTickDetailPane: React.FC<TickTickDetailPaneProps> = ({
  task,
  lists,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onClose
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (!task) {
    return (
      <aside className="tt-detail-pane" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--tt-text-muted)' }}>
        <ListTodo size={36} strokeWidth={1.5} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
        <span>Chọn một công việc để xem chi tiết</span>
      </aside>
    );
  }

  const isCompleted = task.status === 'completed';

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateTask(task.id, { title: e.target.value });
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateTask(task.id, { description: e.target.value });
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const togglePriority = () => {
    const cycle: TaskPriority[] = ['none', 'low', 'medium', 'high'];
    const currentIdx = cycle.indexOf(task.priority || 'none');
    const nextPriority = cycle[(currentIdx + 1) % cycle.length];
    onUpdateTask(task.id, { priority: nextPriority });
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return '#F5222D';
      case 'medium': return '#FA8C16';
      case 'low': return '#4772FA';
      default: return '#8F95B2';
    }
  };

  const listName = lists.find(l => l.id === task.listId)?.name || 'Inbox';

  return (
    <aside className="tt-detail-pane animate-fade">
      {/* 1. Detail Top Bar */}
      <div className="detail-top-bar">
        <div className="detail-top-left">
          {/* Checkbox */}
          <button
            type="button"
            className={`tt-checkbox ${isCompleted ? 'checked' : ''}`}
            onClick={() => onToggleTask(task.id)}
            title={isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành'}
          >
            {isCompleted && <Check size={12} strokeWidth={3} />}
          </button>

          {/* Date Chip */}
          <div className="date-chip">
            <Calendar size={13} />
            <span>{task.dateLabel || 'Today, Sep 6, 09:00 - 10:00 AM'}</span>
          </div>

          {/* Priority Flag */}
          <button
            type="button"
            className="icon-btn-ghost"
            onClick={togglePriority}
            title={`Mức độ ưu tiên: ${task.priority}`}
          >
            <Flag size={15} style={{ color: getPriorityColor() }} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button type="button" className="icon-btn-ghost" title="Tùy chọn">
            <MoreHorizontal size={16} />
          </button>
          <button type="button" className="icon-btn-ghost" onClick={onClose} title="Đóng bảng chi tiết">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2. Detail Main Content */}
      <div className="detail-content">
        {/* Large Task Title */}
        <input
          type="text"
          className="detail-title-input"
          value={task.title}
          onChange={handleTitleChange}
          placeholder="Tên công việc..."
        />

        {/* Note / Subtitle */}
        <textarea
          className="detail-note-input"
          value={task.description || ''}
          onChange={handleDescChange}
          placeholder="Thêm mô tả hoặc ghi chú..."
          rows={2}
        />

        {/* Subtasks Checklist */}
        <div className="subtasks-container">
          {task.subtasks.map(subtask => (
            <div key={subtask.id} className="subtask-row">
              <button
                type="button"
                className={`subtask-checkbox ${subtask.completed ? 'checked' : ''}`}
                onClick={() => onToggleSubtask(task.id, subtask.id)}
              >
                {subtask.completed && <Check size={11} strokeWidth={3} />}
              </button>

              <span className={`subtask-title ${subtask.completed ? 'completed' : ''}`}>
                {subtask.title}
              </span>

              <button
                type="button"
                className="icon-btn-ghost"
                style={{ width: '22px', height: '22px' }}
                onClick={() => onDeleteSubtask(task.id, subtask.id)}
                title="Xóa việc con"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* Add Subtask Input */}
          <form onSubmit={handleAddSubtaskSubmit} className="add-subtask-box">
            <Plus size={15} />
            <input
              type="text"
              className="add-subtask-input"
              placeholder="+ Thêm mục kiểm tra con..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
            />
          </form>
        </div>
      </div>

      {/* 3. Detail Bottom Bar */}
      <div className="detail-bottom-bar">
        <div className="list-selector-badge" title="Danh sách hiện tại">
          <Inbox size={15} style={{ color: '#4772FA' }} />
          <span>{listName}</span>
        </div>

        <button
          type="button"
          className="icon-btn-ghost"
          onClick={() => onDeleteTask(task.id)}
          title="Xóa công việc"
          style={{ color: '#F5222D' }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </aside>
  );
};
