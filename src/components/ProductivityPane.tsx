import { useEffect, useMemo, useState } from 'react';
import { Award, Check, CheckCircle2, Clock3, Flame, Pause, Play, RotateCcw, Search, Target, Trophy } from 'lucide-react';
import type { MainNavTab, Task } from '../types/todo';
import type { FocusSession } from '../types/todo';
import { apiService } from '../services/api';

interface ProductivityPaneProps {
  mode: Exclude<MainNavTab, 'tasks' | 'calendar'>;
  tasks: Task[];
  onSelectTask: (id: string) => void;
  onToggleTask: (id: string) => void;
}

function habitStreak(tasks: Task[], rule?: Task['recurrenceRule']) {
  const dates = [...new Set(tasks.map(task => task.dueDate || task.completedAt?.slice(0, 10)).filter(Boolean) as string[])].sort().reverse();
  if (!dates.length) return 0;
  let streak = 1;
  let cursor = new Date(`${dates[0]}T12:00:00`);
  for (let index = 1; index < dates.length; index += 1) {
    const expected = new Date(cursor);
    if (rule === 'MONTHLY') expected.setMonth(expected.getMonth() - 1);
    else expected.setDate(expected.getDate() - (rule === 'WEEKLY' ? 7 : 1));
    if (expected.toLocaleDateString('en-CA') !== dates[index]) break;
    streak += 1;
    cursor = expected;
  }
  return streak;
}

function TaskLine({ task, onSelectTask, onToggleTask }: { task: Task; onSelectTask: (id: string) => void; onToggleTask: (id: string) => void }) {
  return (
    <button className="productivity-task" type="button" onClick={() => onSelectTask(task.id)}>
      <span className={`tt-checkbox ${task.status === 'completed' ? 'checked' : ''}`} onClick={event => { event.stopPropagation(); onToggleTask(task.id); }}>
        {task.status === 'completed' && <Check size={11} />}
      </span>
      <span>{task.title}</span>
      {task.dueDate && <time>{task.dueDate}</time>}
    </button>
  );
}

export function ProductivityPane({ mode, tasks, onSelectTask, onToggleTask }: ProductivityPaneProps) {
  const [query, setQuery] = useState('');
  const [seconds, setSeconds] = useState(25 * 60);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [running, setRunning] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState('');
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const activeTasks = tasks.filter(task => !task.deletedAt);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSeconds(value => {
        if (value <= 1) {
          setRunning(false);
          if (hasStarted) {
            const optimistic: FocusSession = { id: crypto.randomUUID(), taskId: focusTaskId || undefined, durationSeconds: focusMinutes * 60, completedAt: new Date().toISOString() };
            setHasStarted(false);
            setFocusSessions(previous => {
              const next = [optimistic, ...previous];
              localStorage.setItem('focusflow_focus_sessions_v1', JSON.stringify(next));
              return next;
            });
            void apiService.createFocusSession(focusMinutes * 60, focusTaskId || undefined).then(saved => {
              setFocusSessions(previous => previous.map(item => item.id === optimistic.id ? saved : item));
            }).catch(() => undefined);
          }
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [focusMinutes, focusTaskId, hasStarted, running]);

  useEffect(() => {
    if (mode !== 'pomodoro') return;
    void apiService.getFocusSessions().then(setFocusSessions).catch(() => {
      try { setFocusSessions(JSON.parse(localStorage.getItem('focusflow_focus_sessions_v1') || '[]') as FocusSession[]); } catch { setFocusSessions([]); }
    });
  }, [mode]);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return activeTasks;
    return activeTasks.filter(task => [task.title, task.description, ...task.tags].some(value => value?.toLowerCase().includes(normalized)));
  }, [activeTasks, query]);

  if (mode === 'pomodoro') {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const remainingSeconds = String(seconds % 60).padStart(2, '0');
    return (
      <section className="productivity-pane pomodoro-pane">
        <span className="pane-kicker"><Clock3 size={15} /> Focus session</span>
        <h1>{minutes}:{remainingSeconds}</h1>
        <p>Chọn một công việc, tắt thông báo và tập trung trong một phiên 25 phút.</p>
        <div className="focus-options">
          <label>Công việc<select value={focusTaskId} onChange={event => setFocusTaskId(event.target.value)}><option value="">Không gắn công việc</option>{activeTasks.filter(task => task.status !== 'completed').map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
          <label>Thời lượng<select value={focusMinutes} disabled={running} onChange={event => { const value = Number(event.target.value); setFocusMinutes(value); setSeconds(value * 60); }}><option value={15}>15 phút</option><option value={25}>25 phút</option><option value={45}>45 phút</option><option value={60}>60 phút</option></select></label>
        </div>
        <div className="pomodoro-actions">
          <button type="button" className="primary-action" onClick={() => { setHasStarted(true); setRunning(value => !value); }}>
            {running ? <Pause size={17} /> : <Play size={17} />} {running ? 'Pause' : 'Start focus'}
          </button>
          <button type="button" className="secondary-action" onClick={() => { setRunning(false); setHasStarted(false); setSeconds(focusMinutes * 60); }}><RotateCcw size={16} /> Reset</button>
        </div>
        <div className="focus-stats"><span><strong>{focusSessions.length}</strong> phiên đã hoàn thành</span><span><strong>{Math.round(focusSessions.reduce((total, item) => total + item.durationSeconds, 0) / 60)}</strong> phút tập trung</span></div>
      </section>
    );
  }

  if (mode === 'matrix') {
    const today = new Date().toLocaleDateString('en-CA');
    const quadrants = [
      ['Do first', activeTasks.filter(task => ['urgent', 'high'].includes(task.priority) && task.dueDate && task.dueDate <= today)],
      ['Schedule', activeTasks.filter(task => ['urgent', 'high'].includes(task.priority) && (!task.dueDate || task.dueDate > today))],
      ['Delegate', activeTasks.filter(task => ['medium'].includes(task.priority) && task.dueDate && task.dueDate <= today)],
      ['Later', activeTasks.filter(task => ['none', 'low', 'medium'].includes(task.priority) && (!task.dueDate || task.dueDate > today))],
    ] as const;
    return (
      <section className="productivity-pane">
        <div className="pane-header"><div><span className="pane-kicker">Priority planning</span><h1>Eisenhower Matrix</h1></div></div>
        <div className="matrix-grid">
          {quadrants.map(([title, quadrantTasks], index) => (
            <article className={`matrix-card q${index + 1}`} key={title}>
              <header><h2>{title}</h2><span>{quadrantTasks.length}</span></header>
              {quadrantTasks.slice(0, 6).map(task => <TaskLine key={task.id} task={task} onSelectTask={onSelectTask} onToggleTask={onToggleTask} />)}
              {!quadrantTasks.length && <p className="empty-copy">No tasks in this quadrant</p>}
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (mode === 'habits') {
    const recurringTasks = activeTasks.filter(task => task.recurrenceRule && task.recurrenceRule !== 'NONE' && task.status !== 'completed');
    return (
      <section className="productivity-pane">
        <div className="pane-header"><div><span className="pane-kicker"><Target size={14} /> Consistency</span><h1>Recurring habits</h1></div></div>
        <div className="habit-list">
          {recurringTasks.map(task => {
            const seriesId = task.recurrenceSeriesId || task.id;
            const history = activeTasks.filter(item => (item.recurrenceSeriesId || item.id) === seriesId && item.status === 'completed');
            const streak = habitStreak(history, task.recurrenceRule);
            return (
            <article className="habit-card" key={task.id} onClick={() => onSelectTask(task.id)}>
              <div><strong>{task.title}</strong><span>{task.recurrenceRule?.toLowerCase()} · chuỗi {streak} · {history.length} lần hoàn thành</span></div>
              <button type="button" onClick={event => { event.stopPropagation(); onToggleTask(task.id); }}><Check size={16} /> Done today</button>
            </article>
          );})}
          {!recurringTasks.length && <div className="feature-empty"><Target size={34} /><h2>No recurring habits yet</h2><p>Open a task and choose Daily, Weekly or Monthly in the Repeat field.</p></div>}
        </div>
      </section>
    );
  }

  if (mode === 'achievements') {
    const completedTasks = activeTasks.filter(task => task.status === 'completed');
    const completionRate = activeTasks.length ? Math.round((completedTasks.length / activeTasks.length) * 100) : 0;
    const completedDays = new Set(completedTasks.map(task => task.completedAt?.slice(0, 10)).filter(Boolean));
    let streak = 0;
    const cursor = new Date();
    while (completedDays.has(cursor.toLocaleDateString('en-CA'))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return (
      <section className="productivity-pane">
        <div className="pane-header"><div><span className="pane-kicker"><Trophy size={14} /> Progress</span><h1>Achievements</h1></div></div>
        <div className="achievement-grid">
          <article><CheckCircle2 size={22} /><span>Completed</span><strong>{completedTasks.length}</strong><small>tasks finished</small></article>
          <article><Award size={22} /><span>Completion rate</span><strong>{completionRate}%</strong><small>of active tasks</small></article>
          <article><Flame size={22} /><span>Current streak</span><strong>{streak}</strong><small>consecutive days</small></article>
        </div>
        <div className="achievement-recent">
          <h2>Recently completed</h2>
          {completedTasks.slice(0, 8).map(task => <TaskLine key={task.id} task={task} onSelectTask={onSelectTask} onToggleTask={onToggleTask} />)}
          {!completedTasks.length && <p className="empty-copy">Complete your first task to unlock progress.</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="productivity-pane">
      <div className="pane-header"><div><span className="pane-kicker">Workspace search</span><h1>Find anything</h1></div></div>
      <label className="workspace-search"><Search size={19} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search titles, descriptions and tags…" /></label>
      <div className="search-results">
        <span>{searchResults.length} result{searchResults.length === 1 ? '' : 's'}</span>
        {searchResults.map(task => <TaskLine key={task.id} task={task} onSelectTask={onSelectTask} onToggleTask={onToggleTask} />)}
      </div>
    </section>
  );
}
