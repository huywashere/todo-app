import React, { useState } from 'react';
import {
  Menu,
  MoreHorizontal,
  ArrowUpDown,
  ChevronDown,
  Check,
  Plus
} from 'lucide-react';
import type { Task, ActiveListType, TaskList } from '../types/todo';

interface TickTickMainPaneProps {
  activeList: ActiveListType;
  lists: TaskList[];
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string, listId?: string, time?: string) => void;
}

export const TickTickMainPane: React.FC<TickTickMainPaneProps> = ({
  activeList,
  lists,
  tasks,
  selectedTaskId,
  onSelectTask,
  onToggleTask,
  onAddTask
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('');

  // Group expand/collapse states
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    today: true,
    tomorrow: true,
    next7days: true,
    other: true
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const getListTitle = () => {
    switch (activeList) {
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
      case 'next7days': return 'Next 7 Days';
      case 'assigned': return 'Assigned to Me';
      case 'inbox': return 'Inbox';
      case 'completed': return 'Completed';
      case 'trash': return 'Trash';
      default: {
        const found = lists.find(l => l.id === activeList);
        return found ? `${found.emoji || '📁'} ${found.name}` : 'Tasks';
      }
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAddTask(quickTitle.trim(), activeList, quickTime || undefined);
    setQuickTitle('');
    setQuickTime('');
  };

  // Organize tasks into sections if in Inbox or flat list
  const isInboxOrDateView = activeList === 'inbox' || activeList === 'today';

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const todayTasks = tasks.filter(t => t.dueDate === todayStr || t.dateLabel?.toLowerCase().includes('today'));
  const tomorrowTasks = tasks.filter(t => t.dueDate === tomorrowStr || t.dateLabel?.toLowerCase().includes('tomorrow'));
  const next7Tasks = tasks.filter(t => t.dateLabel?.toLowerCase().includes('next 7') || (t.dueDate && t.dueDate > tomorrowStr));
  const otherTasks = tasks.filter(t => !todayTasks.includes(t) && !tomorrowTasks.includes(t) && !next7Tasks.includes(t));

  const renderTaskRow = (task: Task) => {
    const isSelected = selectedTaskId === task.id;
    const isCompleted = task.status === 'completed';

    return (
      <div
        key={task.id}
        className={`tt-task-row ${isSelected ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
        onClick={() => onSelectTask(task.id)}
      >
        <div className="tt-task-left">
          {/* Checkbox */}
          <button
            type="button"
            className={`tt-checkbox ${isCompleted ? 'checked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleTask(task.id);
            }}
            aria-label={isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
          >
            {isCompleted && <Check size={12} strokeWidth={3} />}
          </button>

          {/* Task Title */}
          <span className="tt-task-title">{task.title}</span>
        </div>

        <div className="tt-task-right">
          {/* Time Badge */}
          {task.time && (
            <span className={`tt-time-badge ${task.time.includes(':') ? '' : 'muted'}`}>
              {task.time}
            </span>
          )}

          {/* Priority indicator */}
          {task.priority && task.priority !== 'none' && (
            <span className={`priority-dot ${task.priority}`} />
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="tt-main-pane">
      {/* 1. Header */}
      <div className="main-header">
        <div className="main-title-wrap">
          <button type="button" className="icon-btn-ghost" title="Toggle Sidebar">
            <Menu size={18} />
          </button>
          <h1 className="main-title">{getListTitle()}</h1>
        </div>

        <div className="header-actions-right">
          <button type="button" className="icon-btn-ghost" title="Sắp xếp danh sách">
            <ArrowUpDown size={17} />
          </button>
          <button type="button" className="icon-btn-ghost" title="Tùy chọn khác">
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* 2. Quick Add Task Input */}
      <form onSubmit={handleQuickSubmit} className="quick-add-box">
        <Plus size={18} style={{ color: 'var(--tt-text-placeholder)', flexShrink: 0 }} />
        <input
          type="text"
          className="quick-add-input"
          placeholder="+ Add task"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
        />
        {quickTitle && (
          <input
            type="text"
            placeholder="09:00"
            value={quickTime}
            onChange={(e) => setQuickTime(e.target.value)}
            style={{ width: '60px', padding: '2px 6px', border: '1px solid var(--tt-border)', borderRadius: '4px', fontSize: '0.8rem' }}
          />
        )}
      </form>

      {/* 3. Task List Scroll Area with Groups */}
      <div className="task-scroll-area">
        {isInboxOrDateView && todayTasks.length > 0 && (
          <div className="task-group">
            <div
              className="task-group-header"
              onClick={() => toggleGroup('today')}
            >
              <ChevronDown
                size={13}
                style={{
                  transform: expandedGroups.today ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 150ms ease'
                }}
              />
              <span>Today</span>
              <span className="task-group-count">{todayTasks.length}</span>
            </div>

            {expandedGroups.today && todayTasks.map(renderTaskRow)}
          </div>
        )}

        {isInboxOrDateView && tomorrowTasks.length > 0 && (
          <div className="task-group">
            <div
              className="task-group-header"
              onClick={() => toggleGroup('tomorrow')}
            >
              <ChevronDown
                size={13}
                style={{
                  transform: expandedGroups.tomorrow ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 150ms ease'
                }}
              />
              <span>Tomorrow</span>
              <span className="task-group-count">{tomorrowTasks.length}</span>
            </div>

            {expandedGroups.tomorrow && tomorrowTasks.map(renderTaskRow)}
          </div>
        )}

        {isInboxOrDateView && next7Tasks.length > 0 && (
          <div className="task-group">
            <div
              className="task-group-header"
              onClick={() => toggleGroup('next7days')}
            >
              <ChevronDown
                size={13}
                style={{
                  transform: expandedGroups.next7days ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 150ms ease'
                }}
              />
              <span>Next 7 Days</span>
              <span className="task-group-count">{next7Tasks.length}</span>
            </div>

            {expandedGroups.next7days && next7Tasks.map(renderTaskRow)}
          </div>
        )}

        {(!isInboxOrDateView ? tasks : otherTasks).length > 0 && (
          <div className="task-group">
            {(!isInboxOrDateView ? tasks : otherTasks).map(renderTaskRow)}
          </div>
        )}

        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--tt-text-muted)', fontSize: '0.9rem' }}>
            Không có công việc nào trong danh sách này
          </div>
        )}
      </div>
    </section>
  );
};
