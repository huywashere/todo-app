import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Calendar,
  Flag,
  MoreHorizontal,
  Trash2,
  Plus,
  Inbox,
  X,
  ListTodo,
  RotateCcw,
  MessageCircle,
  Paperclip,
  Download,
  Copy
} from 'lucide-react';
import type { Task, TaskPriority, TaskList, TaskAttachment, TaskComment } from '../types/todo';
import { apiService } from '../services/api';

function utcToLocalInput(value?: string) {
  if (!value) return '';
  const date = new Date(value.endsWith('Z') ? value : `${value}Z`);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function localInputToUtc(value: string) {
  return value ? new Date(value).toISOString().slice(0, 19) : undefined;
}

interface TickTickDetailPaneProps {
  task: Task | null;
  lists: TaskList[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onRestoreTask: (id: string) => void;
  onPermanentlyDeleteTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onDuplicateTask: (id: string) => void;
  onClose: () => void;
}

export const TickTickDetailPane: React.FC<TickTickDetailPaneProps> = ({
  task,
  lists,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onRestoreTask,
  onPermanentlyDeleteTask,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onDuplicateTask,
  onClose
}) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [collaborationError, setCollaborationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreMenuOpen]);

  useEffect(() => {
    if (!task?.id || task.deletedAt) { setComments([]); setAttachments([]); return; }
    let active = true;
    void Promise.all([apiService.getComments(task.id), apiService.getAttachments(task.id)])
      .then(([loadedComments, loadedAttachments]) => { if (active) { setComments(loadedComments); setAttachments(loadedAttachments); } })
      .catch(() => { if (active) setCollaborationError('Không thể tải bình luận hoặc tệp đính kèm khi offline.'); });
    return () => { active = false; };
  }, [task?.id, task?.deletedAt]);

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
  const addComment = async (event: React.FormEvent) => {
    event.preventDefault(); if (!commentBody.trim()) return;
    try { const created = await apiService.addComment(task.id, commentBody.trim()); setComments(values => [...values, created]); setCommentBody(''); }
    catch { setCollaborationError('Không thể gửi bình luận.'); }
  };
  const uploadFile = async (file?: File) => {
    if (!file) return;
    try { const created = await apiService.uploadAttachment(task.id, file); setAttachments(values => [...values, created]); }
    catch { setCollaborationError('Tải tệp lên thất bại. Kiểm tra giới hạn 10 MB và kết nối mạng.'); }
  };

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', position: 'relative' }} ref={moreMenuRef}>
          <button type="button" className="icon-btn-ghost" title="Tùy chọn" onClick={() => setMoreMenuOpen(v => !v)}>
            <MoreHorizontal size={16} />
          </button>
          {moreMenuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 100,
              background: 'var(--tt-surface, #1f2937)', border: '1px solid var(--tt-border, #374151)',
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.3)', minWidth: 160, padding: '4px 0'
            }}>
              <button
                type="button"
                onClick={() => { onDuplicateTask(task.id); setMoreMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  width: '100%', padding: '8px 14px', background: 'none', border: 'none',
                  color: 'var(--tt-text, #f9fafb)', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <Copy size={14} /> Nhân bản task
              </button>
            </div>
          )}
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

        <div className="task-field-grid">
          <label>
            Due date
            <input type="date" value={task.dueDate || ''} onChange={event => onUpdateTask(task.id, { dueDate: event.target.value, dateLabel: event.target.value })} />
          </label>
          <label>
            Time
            <input type="time" value={task.time?.includes(':') ? task.time : ''} onChange={event => onUpdateTask(task.id, { time: event.target.value })} />
          </label>
          <label>
            Repeat
            <select value={task.recurrenceRule || 'NONE'} onChange={event => onUpdateTask(task.id, { recurrenceRule: event.target.value as Task['recurrenceRule'] })}>
              <option value="NONE">Does not repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="WEEKDAYS">Weekdays</option>
              <option value="MONTHLY_LAST_DAY">Last day of month</option>
            </select>
          </label>
          <label>
            Every
            <input type="number" min="1" max="365" value={task.recurrenceInterval || 1} onChange={event => onUpdateTask(task.id, { recurrenceInterval: Math.max(1, Number(event.target.value) || 1) })} />
          </label>
          <label>
            Repeat until
            <input type="date" value={task.recurrenceEndDate || ''} onChange={event => onUpdateTask(task.id, { recurrenceEndDate: event.target.value || undefined })} />
          </label>
          <label>
            List
            <select value={task.listId || 'inbox'} onChange={event => onUpdateTask(task.id, { listId: event.target.value })}>
              <option value="inbox">Inbox</option>
              {lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
            </select>
          </label>
          <label className="field-wide">
            Reminder
            <input type="datetime-local" value={utcToLocalInput(task.reminderAt)} onChange={event => onUpdateTask(task.id, { reminderAt: localInputToUtc(event.target.value) })} />
          </label>
          <label className="field-wide">
            Tags
            <input value={task.tags.join(', ')} onChange={event => onUpdateTask(task.id, { tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })} placeholder="work, important" />
          </label>
          <label className="field-wide">
            Assignee
            <input type="email" value={task.assigneeEmail || ''} onChange={event => onUpdateTask(task.id, { assigneeEmail: event.target.value })} placeholder="name@example.com" />
          </label>
        </div>

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

        {!task.deletedAt && <section className="collaboration-section">
          <header><span><Paperclip size={15} /> Attachments</span><button type="button" className="secondary-action" onClick={() => fileInputRef.current?.click()}>Add file</button></header>
          <input ref={fileInputRef} type="file" hidden onChange={event => { void uploadFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
          {attachments.length === 0 ? <p className="collaboration-empty">No attachments yet</p> : attachments.map(attachment => <div className="attachment-row" key={attachment.id}>
            <Paperclip size={14} /><span>{attachment.fileName}</span><small>{Math.ceil(attachment.sizeBytes / 1024)} KB</small>
            <button type="button" className="icon-btn-ghost" title="Download" onClick={() => void apiService.downloadAttachment(task.id, attachment.id, attachment.fileName).catch(() => setCollaborationError('Không thể tải tệp đính kèm.'))}><Download size={14} /></button>
            <button type="button" className="icon-btn-ghost" onClick={() => void apiService.deleteAttachment(task.id, attachment.id).then(() => setAttachments(values => values.filter(value => value.id !== attachment.id)))}><X size={14} /></button>
          </div>)}
        </section>}

        {!task.deletedAt && <section className="collaboration-section">
          <header><span><MessageCircle size={15} /> Activity & comments</span></header>
          {comments.length === 0 ? <p className="collaboration-empty">Start a discussion with your workspace.</p> : comments.map(comment => <article className="comment-row" key={comment.id}>
            <strong>{comment.authorName}</strong><time>{new Date(comment.createdAt).toLocaleString()}</time><p>{comment.body}</p>
          </article>)}
          <form className="comment-form" onSubmit={addComment}><input value={commentBody} onChange={event => setCommentBody(event.target.value)} placeholder="Write a comment…" /><button type="submit" className="primary-action">Send</button></form>
          {collaborationError && <p className="collaboration-error">{collaborationError}</p>}
        </section>}
      </div>

      {/* 3. Detail Bottom Bar */}
      <div className="detail-bottom-bar">
        <div className="list-selector-badge" title="Danh sách hiện tại">
          <Inbox size={15} style={{ color: '#4772FA' }} />
          <span>{listName}</span>
        </div>

        {task.deletedAt ? (
          <div className="trash-actions">
            <button type="button" className="restore-task-btn" onClick={() => onRestoreTask(task.id)}><RotateCcw size={15} /> Restore</button>
            <button type="button" className="danger-action compact" onClick={() => { if (window.confirm('Xóa vĩnh viễn công việc này?')) onPermanentlyDeleteTask(task.id); }}><Trash2 size={14} /> Delete forever</button>
          </div>
        ) : (
          <button type="button" className="icon-btn-ghost" onClick={() => onDeleteTask(task.id)} title="Move to trash" style={{ color: '#F5222D' }}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};
