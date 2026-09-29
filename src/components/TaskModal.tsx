import React, { useState } from 'react';
import { X, Check, Trash2, Plus, Calendar, Tag, Flag, AlignLeft, CheckSquare } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '../types/todo';

interface TaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Task>) => void;
  onToggleSubTask: (taskId: string, subtaskId: string) => void;
  onAddSubTask: (taskId: string, title: string) => void;
  onDeleteSubTask: (taskId: string, subtaskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  task,
  onClose,
  onSave,
  onToggleSubTask,
  onAddSubTask,
  onDeleteSubTask
}) => {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [tagsInput, setTagsInput] = useState(task?.tags.join(', ') ?? '');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (!isOpen || !task) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSave(task.id, {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || undefined,
      tags
    });
    onClose();
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAddSubTask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="modal-content glass-panel-elevated animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Chi tiết công việc</h2>
          <button type="button" className="btn-icon" onClick={onClose} title="Đóng modal (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Tiêu đề công việc</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề..."
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlignLeft size={14} />
              <span>Mô tả chi tiết</span>
            </label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thêm ghi chú, yêu cầu chi tiết hoặc liên kết..."
              rows={3}
            />
          </div>

          {/* Status & Priority Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="todo">Cần làm (To Do)</option>
                <option value="in_progress">Đang làm (In Progress)</option>
                <option value="completed">Đã hoàn thành (Done)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Flag size={14} />
                <span>Mức độ ưu tiên</span>
              </label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Thấp (Low)</option>
                <option value="medium">Bình thường (Medium)</option>
                <option value="high">Cao (High)</option>
                <option value="urgent">Khẩn cấp (Urgent)</option>
              </select>
            </div>
          </div>

          {/* Due date & Tags Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} />
                <span>Hạn hoàn thành (Deadline)</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Tag size={14} />
                <span>Tags / Dự án</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Design, Frontend, Ops..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          {/* Subtasks / Checklist */}
          <div className="subtasks-section">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckSquare size={14} />
              <span>Checklist công việc phụ ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</span>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {task.subtasks.map(subtask => (
                <div key={subtask.id} className="subtask-item">
                  <button
                    type="button"
                    className={`custom-checkbox ${subtask.completed ? 'checked' : ''}`}
                    onClick={() => onToggleSubTask(task.id, subtask.id)}
                    style={{ width: '18px', height: '18px' }}
                  >
                    {subtask.completed && <Check size={12} strokeWidth={3} />}
                  </button>
                  <span className={subtask.completed ? 'completed' : ''}>
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    className="action-btn-sm delete"
                    onClick={() => onDeleteSubTask(task.id, subtask.id)}
                    title="Xóa việc phụ"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask mini input */}
            <div className="add-subtask-form">
              <input
                type="text"
                className="form-input"
                placeholder="Thêm mục checklist mới..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
              >
                <Plus size={16} />
                <span>Thêm</span>
              </button>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
