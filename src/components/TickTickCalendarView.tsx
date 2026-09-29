import { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../types/todo';
import { localDateKey } from '../utils/date';

interface TickTickCalendarViewProps {
  onSelectTask: (taskId: string) => void;
  tasks: Task[];
}

function startOfWeek(value: Date) {
  const date = new Date(value);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setHours(12, 0, 0, 0);
  return date;
}

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const TickTickCalendarView: React.FC<TickTickCalendarViewProps> = ({ tasks, onSelectTask }) => {
  const [anchor, setAnchor] = useState(() => new Date());
  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  }), [weekStart]);
  const today = localDateKey();

  const tasksByDate = useMemo(() => {
    const result = new Map<string, Task[]>();
    tasks.filter(task => task.dueDate && !task.deletedAt).forEach(task => {
      const list = result.get(task.dueDate!) || [];
      list.push(task);
      result.set(task.dueDate!, list);
    });
    result.forEach(list => list.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59')));
    return result;
  }, [tasks]);

  const monthTitle = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(anchor);

  return (
    <section className="calendar-view-container animate-fade">
      <header className="calendar-header real-calendar-header">
        <div className="calendar-heading">
          <CalendarIcon size={20} />
          <div><span>Lịch công việc</span><h2>{monthTitle}</h2></div>
        </div>
        <div className="calendar-controls">
          <button type="button" className="secondary-action" onClick={() => setAnchor(new Date())}>Hôm nay</button>
          <button type="button" className="icon-btn-ghost" aria-label="Tuần trước" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - 7))}><ChevronLeft size={17} /></button>
          <button type="button" className="icon-btn-ghost" aria-label="Tuần sau" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 7))}><ChevronRight size={17} /></button>
        </div>
      </header>

      <div className="real-calendar-week" role="grid" aria-label={`Tuần của ${dateKey(weekStart)}`}>
        {days.map(day => {
          const key = dateKey(day);
          const dayTasks = tasksByDate.get(key) || [];
          const isToday = key === today;
          return (
            <article className={`calendar-day-column ${isToday ? 'today' : ''}`} key={key} role="gridcell">
              <header>
                <span>{new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(day)}</span>
                <strong>{day.getDate()}</strong>
              </header>
              <div className="calendar-day-events">
                {dayTasks.map(task => (
                  <button
                    type="button"
                    className={`calendar-real-event priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}`}
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                  >
                    <time>{task.time || 'Cả ngày'}</time>
                    <span>{task.title}</span>
                    {task.tags[0] && <small>#{task.tags[0]}</small>}
                  </button>
                ))}
                {!dayTasks.length && <span className="calendar-empty-day">Không có việc</span>}
              </div>
            </article>
          );
        })}
      </div>
      <footer className="calendar-summary">
        <span>{tasks.filter(task => task.dueDate && !task.deletedAt).length} công việc đã lên lịch</span>
        <span>Tuần {dateKey(weekStart)} — {dateKey(days[6])}</span>
      </footer>
    </section>
  );
};
