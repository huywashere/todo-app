import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, Check, ChevronDown, Columns3, LayoutList, Menu, MoreHorizontal, Plus, Search, X } from 'lucide-react';
import { addDays, localDateKey } from '../utils/date';
import type { ActiveListType, Task, TaskList, TaskPriority, TaskStatus, ViewMode } from '../types/todo';

interface TickTickMainPaneProps {
  activeList: ActiveListType;
  lists: TaskList[];
  tasks: Task[];
  selectedTaskId: string | null;
  viewMode: ViewMode;
  quickAddNonce: number;
  onViewModeChange: (mode: ViewMode) => void;
  onSelectTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string, listId?: string, time?: string) => void;
  onToggleSidebar: () => void;
  onReorderTasks: (draggedId: string, targetId: string, newStatus?: TaskStatus) => void;
  onMoveStatus: (taskId: string, status: TaskStatus) => void;
}

const priorityRank: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

export const TickTickMainPane: React.FC<TickTickMainPaneProps> = ({
  activeList, lists, tasks, selectedTaskId, viewMode, quickAddNonce, onViewModeChange,
  onSelectTask, onToggleTask, onAddTask, onToggleSidebar, onReorderTasks, onMoveStatus,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('');
  const [sortMode, setSortMode] = useState<'manual' | 'due' | 'priority'>('manual');
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<'all' | TaskPriority>('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ today: true, tomorrow: true, next7days: true, other: true });

  useEffect(() => { if (quickAddNonce > 0) quickInputRef.current?.focus(); }, [quickAddNonce]);

  const title = useMemo(() => {
    const smart: Record<string, string> = { today: 'Today', tomorrow: 'Tomorrow', next7days: 'Next 7 Days', assigned: 'Assigned to Me', inbox: 'Inbox', completed: 'Completed', trash: 'Trash' };
    if (smart[activeList]) return smart[activeList];
    const list = lists.find(item => item.id === activeList);
    return list ? `${list.emoji || '📁'} ${list.name}` : 'Tasks';
  }, [activeList, lists]);

  const filteredTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = tasks.filter(task => {
      if (priority !== 'all' && task.priority !== priority) return false;
      if (!normalized) return true;
      return [task.title, task.description, ...task.tags].some(value => value?.toLowerCase().includes(normalized));
    });
    if (sortMode === 'manual') return result;
    return [...result].sort((a, b) => sortMode === 'due'
      ? (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31')
      : priorityRank[a.priority] - priorityRank[b.priority]);
  }, [priority, query, sortMode, tasks]);

  const today = localDateKey();
  const tomorrow = addDays(today, 1);
  const groups = useMemo(() => {
    const todayTasks = filteredTasks.filter(task => task.dueDate === today || task.dateLabel?.toLowerCase().includes('today'));
    const tomorrowTasks = filteredTasks.filter(task => task.dueDate === tomorrow || task.dateLabel?.toLowerCase().includes('tomorrow'));
    const nextTasks = filteredTasks.filter(task => task.dueDate && task.dueDate > tomorrow && task.dueDate <= addDays(today, 7));
    const grouped = new Set([...todayTasks, ...tomorrowTasks, ...nextTasks].map(task => task.id));
    return { today: todayTasks, tomorrow: tomorrowTasks, next7days: nextTasks, other: filteredTasks.filter(task => !grouped.has(task.id)) };
  }, [filteredTasks, today, tomorrow]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!quickTitle.trim()) return;
    onAddTask(quickTitle.trim(), activeList, quickTime || undefined);
    setQuickTitle(''); setQuickTime('');
  };

  const renderTask = (task: Task) => (
    <div
      key={task.id}
      draggable
      className={`tt-task-row ${selectedTaskId === task.id ? 'active' : ''} ${task.status === 'completed' ? 'completed' : ''}`}
      onDragStart={event => { setDraggedId(task.id); event.dataTransfer.setData('text/plain', task.id); }}
      onDragEnd={() => setDraggedId(null)}
      onDragOver={event => event.preventDefault()}
      onDrop={event => { event.preventDefault(); const source = event.dataTransfer.getData('text/plain') || draggedId; if (source && source !== task.id) onReorderTasks(source, task.id, task.status); setDraggedId(null); }}
      onClick={() => onSelectTask(task.id)}
    >
      <div className="tt-task-left">
        <button type="button" className={`tt-checkbox ${task.status === 'completed' ? 'checked' : ''}`} onClick={event => { event.stopPropagation(); onToggleTask(task.id); }} aria-label="Đổi trạng thái">
          {task.status === 'completed' && <Check size={12} strokeWidth={3} />}
        </button>
        <span className="tt-task-title">{task.title}</span>
      </div>
      <div className="tt-task-right">{task.time && <span className="tt-time-badge">{task.time}</span>}{task.priority !== 'none' && <span className={`priority-dot ${task.priority}`} />}</div>
    </div>
  );

  const renderGroup = (key: keyof typeof groups, label: string) => {
    const items = groups[key];
    if (!items.length) return null;
    return <div className="task-group" key={key}>
      <button type="button" className="task-group-header" onClick={() => setExpandedGroups(previous => ({ ...previous, [key]: !previous[key] }))}>
        <ChevronDown size={13} style={{ transform: expandedGroups[key] ? 'none' : 'rotate(-90deg)' }} /><span>{label}</span><span className="task-group-count">{items.length}</span>
      </button>
      {expandedGroups[key] && items.map(renderTask)}
    </div>;
  };

  const columns: Array<{ status: TaskStatus; title: string }> = [{ status: 'todo', title: 'Cần làm' }, { status: 'in_progress', title: 'Đang thực hiện' }, { status: 'completed', title: 'Hoàn thành' }];

  return (
    <section className="tt-main-pane">
      <div className="main-header">
        <div className="main-title-wrap"><button type="button" className="icon-btn-ghost" title="Toggle Sidebar" aria-label="Toggle Sidebar" onClick={onToggleSidebar}><Menu size={18} /></button><h1 className="main-title">{title}</h1></div>
        <div className="header-actions-right">
          <button type="button" className={`icon-btn-ghost ${viewMode === 'list' ? 'active' : ''}`} onClick={() => onViewModeChange('list')} title="Danh sách"><LayoutList size={17} /></button>
          <button type="button" className={`icon-btn-ghost ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => onViewModeChange('kanban')} title="Kanban"><Columns3 size={17} /></button>
          <button type="button" className={`icon-btn-ghost ${sortMode !== 'manual' ? 'active' : ''}`} onClick={() => setSortMode(value => value === 'manual' ? 'due' : value === 'due' ? 'priority' : 'manual')}><ArrowUpDown size={17} /></button>
          <button type="button" className="icon-btn-ghost" onClick={() => { const expand = Object.values(expandedGroups).some(value => !value); setExpandedGroups({ today: expand, tomorrow: expand, next7days: expand, other: expand }); }}><MoreHorizontal size={17} /></button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="quick-add-box">
        <Plus size={18} /><input ref={quickInputRef} className="quick-add-input" placeholder="+ Add task" value={quickTitle} onChange={event => setQuickTitle(event.target.value)} />
        {quickTitle && <><input className="quick-time-input" type="time" value={quickTime} onChange={event => setQuickTime(event.target.value)} /><button type="submit" className="quick-add-submit">Thêm</button></>}
      </form>

      <div className="task-filter-strip">
        <label><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm trong danh sách…" />{query && <button type="button" onClick={() => setQuery('')}><X size={13} /></button>}</label>
        <select value={priority} onChange={event => setPriority(event.target.value as 'all' | TaskPriority)}><option value="all">Mọi ưu tiên</option><option value="urgent">Khẩn cấp</option><option value="high">Cao</option><option value="medium">Vừa</option><option value="low">Thấp</option><option value="none">Không ưu tiên</option></select>
        <span>{filteredTasks.length} việc</span>
      </div>

      {viewMode === 'kanban' && activeList !== 'trash' ? (
        <div className="compact-kanban">
          {columns.map(column => {
            const items = filteredTasks.filter(task => task.status === column.status);
            return <section key={column.status} className={`kanban-lane lane-${column.status}`} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const source = event.dataTransfer.getData('text/plain') || draggedId; if (source) onMoveStatus(source, column.status); setDraggedId(null); }}>
              <header><span>{column.title}</span><strong>{items.length}</strong></header>
              <div>{items.map(renderTask)}{!items.length && <p>Kéo công việc vào đây</p>}</div>
            </section>;
          })}
        </div>
      ) : (
        <div className="task-scroll-area">
          {(activeList === 'inbox' || activeList === 'today') ? <>{renderGroup('today', 'Today')}{renderGroup('tomorrow', 'Tomorrow')}{renderGroup('next7days', 'Next 7 Days')}{renderGroup('other', 'Other')}</> : filteredTasks.map(renderTask)}
          {!filteredTasks.length && <div className="task-empty-state"><Search size={24} /><span>Không có công việc phù hợp</span></div>}
        </div>
      )}
    </section>
  );
};
