import React, { useState } from 'react';
import { Plus, Tag, Calendar, Flag, Sparkles } from 'lucide-react';
import type { TaskPriority } from '../types/todo';

interface QuickAddTaskProps {
  onAddTask: (title: string, priority: TaskPriority, tags: string[], dueDate?: string, description?: string) => void;
}

export const QuickAddTask: React.FC<QuickAddTaskProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [tagsInput, setTagsInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onAddTask(title, priority, tags, dueDate || undefined);

    // Reset form
    setTitle('');
    setTagsInput('');
    setDueDate('');
    setShowOptions(false);
  };

  return (
    <div className="quick-add-container glass-panel">
      <form onSubmit={handleSubmit} className="quick-add-form">
        <div className="quick-add-main">
          <Sparkles className="quick-add-icon" size={20} />
          <input
            type="text"
            className="quick-add-input"
            placeholder="Thêm công việc mới... (Gõ tiêu đề và nhấn Enter)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setShowOptions(true)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!title.trim()}
            style={{ opacity: title.trim() ? 1 : 0.6 }}
          >
            <Plus size={16} />
            <span>Thêm việc</span>
          </button>
        </div>

        {/* Options Row (Visible when typing or expanded) */}
        {(showOptions || title.length > 0) && (
          <div className="quick-add-options animate-fade-in">
            <div className="quick-add-controls">
              {/* Priority Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Flag size={14} style={{ color: 'var(--text-muted)' }} />
                <select
                  className="option-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  aria-label="Mức độ ưu tiên"
                >
                  <option value="low">Thấp (Low)</option>
                  <option value="medium">Bình thường (Medium)</option>
                  <option value="high">Cao (High)</option>
                  <option value="urgent">Khẩn cấp (Urgent)</option>
                </select>
              </div>

              {/* Tags Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Tag size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="option-input"
                  placeholder="Tags (cách nhau dấu phẩy)"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  style={{ width: '180px' }}
                />
              </div>

              {/* Due Date Picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  className="option-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  aria-label="Ngày hết hạn"
                />
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Mẹo: Nhấn <kbd style={{ padding: '2px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>Enter</kbd> để thêm nhanh
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
