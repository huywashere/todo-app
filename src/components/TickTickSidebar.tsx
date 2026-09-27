import React, { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  Inbox,
  User,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Plus
} from 'lucide-react';
import type { TaskList, ActiveListType } from '../types/todo';

interface TickTickSidebarProps {
  activeList: ActiveListType;
  onSelectList: (listId: ActiveListType) => void;
  lists: TaskList[];
  counts: Record<string, number>;
  onAddList: (name: string, emoji?: string, color?: string) => void;
}

export const TickTickSidebar: React.FC<TickTickSidebarProps> = ({
  activeList,
  onSelectList,
  lists,
  counts,
  onAddList
}) => {
  const [isListsExpanded, setIsListsExpanded] = useState(true);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListEmoji, setNewListEmoji] = useState('📁');

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onAddList(newListName.trim(), newListEmoji);
    setNewListName('');
    setIsAddingList(false);
  };

  return (
    <aside className="tt-sidebar">
      {/* 1. Smart Lists */}
      <div className="sidebar-section">
        <button
          type="button"
          className={`sidebar-item ${activeList === 'today' ? 'active' : ''}`}
          onClick={() => onSelectList('today')}
        >
          <div className="sidebar-item-left">
            <Calendar size={17} style={{ color: '#4772FA' }} />
            <span className="sidebar-item-name">Today</span>
          </div>
          <span className="sidebar-item-count" style={{ color: '#4772FA' }}>
            {counts.today || 11}
          </span>
        </button>

        <button
          type="button"
          className={`sidebar-item ${activeList === 'tomorrow' ? 'active' : ''}`}
          onClick={() => onSelectList('tomorrow')}
        >
          <div className="sidebar-item-left">
            <Calendar size={17} style={{ color: '#FA8C16' }} />
            <span className="sidebar-item-name">Tomorrow</span>
          </div>
          <span className="sidebar-item-count">
            {counts.tomorrow || 7}
          </span>
        </button>

        <button
          type="button"
          className={`sidebar-item ${activeList === 'next7days' ? 'active' : ''}`}
          onClick={() => onSelectList('next7days')}
        >
          <div className="sidebar-item-left">
            <CalendarDays size={17} style={{ color: '#722ED1' }} />
            <span className="sidebar-item-name">Next 7 Days</span>
          </div>
          <span className="sidebar-item-count">
            {counts.next7days || 24}
          </span>
        </button>

        <button
          type="button"
          className={`sidebar-item ${activeList === 'assigned' ? 'active' : ''}`}
          onClick={() => onSelectList('assigned')}
        >
          <div className="sidebar-item-left">
            <User size={17} style={{ color: '#8F95B2' }} />
            <span className="sidebar-item-name">Assigned to Me</span>
          </div>
        </button>

        <button
          type="button"
          className={`sidebar-item ${activeList === 'inbox' ? 'active' : ''}`}
          onClick={() => onSelectList('inbox')}
        >
          <div className="sidebar-item-left">
            <Inbox size={17} style={{ color: '#4772FA' }} />
            <span className="sidebar-item-name">Inbox</span>
          </div>
          <span className="sidebar-item-count">
            {counts.inbox || 10}
          </span>
        </button>
      </div>

      {/* 2. Custom Lists Section */}
      <div className="sidebar-section">
        <div
          className="sidebar-section-title"
          onClick={() => setIsListsExpanded(!isListsExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ChevronDown
              size={14}
              style={{
                transform: isListsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 150ms ease'
              }}
            />
            <span>Lists</span>
          </div>
          <button
            type="button"
            className="icon-btn-ghost"
            style={{ width: '20px', height: '20px' }}
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingList(true);
            }}
            title="Thêm danh sách mới"
          >
            <Plus size={14} />
          </button>
        </div>

        {isListsExpanded && (
          <div className="sidebar-section">
            {lists.map(list => {
              const count = counts[list.id];
              return (
                <button
                  key={list.id}
                  type="button"
                  className={`sidebar-item ${activeList === list.id ? 'active' : ''}`}
                  onClick={() => onSelectList(list.id)}
                >
                  <div className="sidebar-item-left">
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>{list.emoji || '📁'}</span>
                    <span className="sidebar-item-name">{list.name}</span>
                    {list.hasDot && (
                      <span className="list-dot" style={{ backgroundColor: list.color || '#4772FA' }} />
                    )}
                  </div>
                  {count !== undefined && count > 0 && (
                    <span className="sidebar-item-count">{count}</span>
                  )}
                </button>
              );
            })}

            {isAddingList && (
              <form onSubmit={handleCreateList} style={{ padding: '0.4rem 0.5rem', display: 'flex', gap: '0.35rem' }}>
                <input
                  type="text"
                  placeholder="Emoji"
                  value={newListEmoji}
                  onChange={(e) => setNewListEmoji(e.target.value)}
                  style={{ width: '38px', padding: '0.25rem', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--tt-border)' }}
                />
                <input
                  type="text"
                  placeholder="Tên danh sách..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  autoFocus
                  style={{ flex: 1, padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--tt-border)', fontSize: '0.85rem' }}
                />
              </form>
            )}

            <button
              type="button"
              className="add-list-btn"
              onClick={() => setIsAddingList(true)}
            >
              <Plus size={15} />
              <span>Add List</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Bottom Utility Lists */}
      <div className="sidebar-section" style={{ marginTop: 'auto', borderTop: '1px solid var(--tt-border-subtle)', paddingTop: '0.75rem' }}>
        <button
          type="button"
          className={`sidebar-item ${activeList === 'completed' ? 'active' : ''}`}
          onClick={() => onSelectList('completed')}
        >
          <div className="sidebar-item-left">
            <CheckCircle2 size={16} style={{ color: '#52C41A' }} />
            <span className="sidebar-item-name">Completed</span>
          </div>
          {counts.completed > 0 && (
            <span className="sidebar-item-count">{counts.completed}</span>
          )}
        </button>

        <button
          type="button"
          className={`sidebar-item ${activeList === 'trash' ? 'active' : ''}`}
          onClick={() => onSelectList('trash')}
        >
          <div className="sidebar-item-left">
            <Trash2 size={16} style={{ color: '#8F95B2' }} />
            <span className="sidebar-item-name">Trash</span>
          </div>
        </button>
      </div>
    </aside>
  );
};
