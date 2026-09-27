import React, { useState, useEffect } from 'react';
import { Search, LayoutList, Kanban, Sun, Moon, Plus, Trash2, CheckCircle2, Flag } from 'lucide-react';
import type { Task, ViewMode, ThemeMode } from '../types/todo';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onSetViewMode: (mode: ViewMode) => void;
  onToggleTheme: () => void;
  onQuickAdd: () => void;
  onClearCompleted: () => void;
  theme: ThemeMode;
}

interface CommandAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  badge?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onSetViewMode,
  onToggleTheme,
  onQuickAdd,
  onClearCompleted,
  theme
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Close on Escape, keyboard nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const baseActions: CommandAction[] = [
    {
      id: 'cmd-new',
      title: 'Tạo công việc mới...',
      icon: <Plus size={16} />,
      category: 'Hành động',
      badge: 'Enter',
      action: () => {
        onQuickAdd();
        onClose();
      }
    },
    {
      id: 'cmd-list-view',
      title: 'Chuyển sang chế độ Danh sách (List View)',
      icon: <LayoutList size={16} />,
      category: 'Điều hướng',
      action: () => {
        onSetViewMode('list');
        onClose();
      }
    },
    {
      id: 'cmd-kanban-view',
      title: 'Chuyển sang chế độ Bảng Kanban (Kanban Board)',
      icon: <Kanban size={16} />,
      category: 'Điều hướng',
      action: () => {
        onSetViewMode('kanban');
        onClose();
      }
    },
    {
      id: 'cmd-toggle-theme',
      title: theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)',
      icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
      category: 'Tùy chọn',
      action: () => {
        onToggleTheme();
        onClose();
      }
    },
    {
      id: 'cmd-clear-done',
      title: 'Dọn dẹp tất cả công việc đã hoàn thành',
      icon: <Trash2 size={16} />,
      category: 'Hành động',
      action: () => {
        onClearCompleted();
        onClose();
      }
    }
  ];

  // Map tasks into searchable command items
  const taskActions: CommandAction[] = tasks.map(task => ({
    id: `task-${task.id}`,
    title: task.title,
    icon: task.status === 'completed' ? <CheckCircle2 size={16} style={{ color: 'var(--status-completed)' }} /> : <Flag size={16} />,
    category: 'Công việc gần đây',
    badge: task.status === 'completed' ? 'Xong' : task.priority,
    action: () => {
      onSelectTask(task);
      onClose();
    }
  }));

  const allItems = [...baseActions, ...taskActions];

  const filteredItems = allItems.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  return (
    <div className="command-palette-overlay animate-fade-in" onClick={onClose}>
      <div
        className="command-palette-box glass-panel-elevated animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="command-search-header">
          <Search size={18} style={{ color: 'var(--accent-primary)' }} />
          <input
            type="text"
            className="command-search-input"
            placeholder="Tìm kiếm lệnh, công việc hoặc điều hướng..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <span className="kbd-badge">ESC</span>
        </div>

        {/* List of items */}
        <div className="command-list">
          {filteredItems.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Không tìm thấy lệnh hoặc công việc nào khớp với &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                className={`command-item ${selectedIndex === index ? 'selected' : ''}`}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-item-left">
                  {item.icon}
                  <div>
                    <span>{item.title}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.6rem' }}>
                      {item.category}
                    </span>
                  </div>
                </div>
                {item.badge && <span className="kbd-badge">{item.badge}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
