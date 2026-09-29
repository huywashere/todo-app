import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { Task, TaskList, MainNavTab, ActiveListType, ThemeMode, ToastMessage, TaskPriority, SyncState, SyncOperationKind } from '../types/todo';
import { storageService } from '../services/storage';
import { apiService } from '../services/api';
import { sound } from '../services/audio';
import { syncQueue } from '../services/syncQueue';
import { addDays, localDateKey } from '../utils/date';

function toApiTaskPayload(task: Partial<Task>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...task,
    status: task.status?.toUpperCase(),
    priority: task.priority?.toUpperCase(),
    subtasks: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    completedAt: undefined,
    deletedAt: undefined,
  };
  if (Object.prototype.hasOwnProperty.call(task, 'reminderAt') && !task.reminderAt) {
    payload.clearReminder = true;
    payload.reminderAt = undefined;
  }
  return payload;
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    status: String(task.status).toLowerCase() as Task['status'],
    priority: String(task.priority).toLowerCase() as Task['priority'],
  };
}

export function useTasks(syncIdentity: string, currentUserEmail?: string, workspaceId?: string) {
  const scopedIdentity = `${syncIdentity}:${workspaceId || 'personal'}`;
  storageService.setScope(scopedIdentity);
  syncQueue.setScope(scopedIdentity);
  const [tasks, setTasks] = useState<Task[]>(() => storageService.loadTasks());
  const [lists, setLists] = useState<TaskList[]>(() => storageService.loadLists());
  const [activeTab, setActiveTab] = useState<MainNavTab>('tasks');
  const [activeList, setActiveList] = useState<ActiveListType>(() => storageService.loadActiveList());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [theme, setThemeState] = useState<ThemeMode>(() => storageService.loadTheme());
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [syncState, setSyncState] = useState<SyncState>(syncIdentity === 'offline' ? 'offline' : 'syncing');
  const [pendingSyncCount, setPendingSyncCount] = useState(() => syncQueue.count());
  const syncTimerRef = useRef<number | null>(null);
  const [todayKey, setTodayKey] = useState(() => localDateKey());

  const flushPending = useCallback(async () => {
    if (syncIdentity === 'offline' || !navigator.onLine) {
      setSyncState('offline');
      setIsBackendConnected(false);
      setPendingSyncCount(syncQueue.count());
      return false;
    }
    setSyncState('syncing');
    const result = await syncQueue.flush(setPendingSyncCount);
    setPendingSyncCount(result.remaining);
    setIsBackendConnected(!result.error);
    setSyncState(result.error ? 'error' : 'synced');
    if (!result.error) {
      try {
        const [active, trash, remoteLists] = await Promise.all([
          apiService.getTasks(undefined, undefined, undefined, workspaceId),
          apiService.getTasks('trash', undefined, undefined, workspaceId),
          apiService.getLists(workspaceId),
        ]);
        const remoteTasks = [...active, ...trash].map(normalizeTask);
        setTasks(remoteTasks);
        setLists(remoteLists);
        storageService.saveTasks(remoteTasks);
        storageService.saveLists(remoteLists);
      } catch {
        // The mutation is already durable; the next sync will refresh the snapshot.
      }
    }
    return !result.error;
  }, [syncIdentity, workspaceId]);

  const scheduleSync = useCallback((delay = 150) => {
    setPendingSyncCount(syncQueue.count());
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => void flushPending(), delay);
  }, [flushPending]);

  const queueMutation = useCallback((kind: SyncOperationKind, entityId: string, payload?: Record<string, unknown>, parentId?: string, delay?: number) => {
    syncQueue.enqueue(kind, entityId, payload, parentId);
    scheduleSync(delay);
  }, [scheduleSync]);

  // Sync with Spring Boot backend on mount
  useEffect(() => {
    let isMounted = true;

    async function syncWithBackend() {
      if (syncIdentity === 'offline') {
        setSyncState('offline');
        return;
      }
      try {
        await flushPending();
        const [backendTasks, trashedTasks, backendLists] = await Promise.all([
          apiService.getTasks(undefined, undefined, undefined, workspaceId),
          apiService.getTasks('trash', undefined, undefined, workspaceId),
          apiService.getLists(workspaceId)
        ]);

        if (isMounted) {
          // Normalize enum lowercase/uppercase for UI compatibility
          const normalizedTasks: Task[] = [...backendTasks, ...trashedTasks].map(normalizeTask);

          setTasks(normalizedTasks);
          setLists(backendLists);
          setIsBackendConnected(true);
          setSyncState('synced');
          storageService.saveTasks(normalizedTasks);
          storageService.saveLists(backendLists);
        }
      } catch {
        if (isMounted) {
          setIsBackendConnected(false);
          setSyncState(navigator.onLine ? 'error' : 'offline');
        }
      }
    }

    syncWithBackend();

    return () => {
      isMounted = false;
    };
  }, [flushPending, syncIdentity, workspaceId]);

  useEffect(() => {
    const handleOnline = () => void flushPending();
    const handleOffline = () => {
      setSyncState('offline');
      setIsBackendConnected(false);
    };
    const handleQueue = (event: Event) => setPendingSyncCount((event as CustomEvent<number>).detail);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('todo-sync-queue', handleQueue);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('todo-sync-queue', handleQueue);
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, [flushPending]);

  useEffect(() => {
    const timer = window.setInterval(() => setTodayKey(localDateKey()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    storageService.saveTheme(theme);
  }, [theme]);

  // Persist tasks and lists
  useEffect(() => {
    storageService.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    storageService.saveLists(lists);
  }, [lists]);

  useEffect(() => {
    storageService.saveActiveList(activeList);
  }, [activeList]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info', actionLabel?: string, onAction?: () => void) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type, actionLabel, onAction }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    sound.playClick();
  }, []);

  // Task counts calculation for sidebar badges
  const listCounts = useMemo(() => {
    const counts: Record<string, number> = {
      today: 0,
      tomorrow: 0,
      next7days: 0,
      assigned: 0,
      inbox: 0,
      completed: 0,
      trash: 0,
    };

    lists.forEach(l => {
      counts[l.id] = 0;
    });

    const todayStr = todayKey;
    const tomorrowStr = addDays(todayKey, 1);
    const next7Str = addDays(todayKey, 7);

    tasks.forEach(t => {
      if (t.deletedAt) return;
      if (currentUserEmail && t.assigneeEmail?.toLowerCase() === currentUserEmail.toLowerCase()) {
        counts.assigned = (counts.assigned || 0) + 1;
      }
      if (t.status === 'completed') {
        counts.completed = (counts.completed || 0) + 1;
        return;
      }

      if (t.dueDate === todayStr || t.dateLabel?.toLowerCase().includes('today')) {
        counts.today = (counts.today || 0) + 1;
      }
      if (t.dueDate === tomorrowStr || t.dateLabel?.toLowerCase().includes('tomorrow')) {
        counts.tomorrow = (counts.tomorrow || 0) + 1;
      }
      if ((t.dueDate && t.dueDate <= next7Str) || t.dateLabel?.toLowerCase().includes('next 7')) {
        counts.next7days = (counts.next7days || 0) + 1;
      }

      if (t.listId === 'inbox' || !t.listId) {
        counts.inbox = (counts.inbox || 0) + 1;
      } else if (counts[t.listId] !== undefined) {
        counts[t.listId] = (counts[t.listId] || 0) + 1;
      }
    });

    return counts;
  }, [tasks, lists, todayKey, currentUserEmail]);

  // Filter tasks based on current activeList and searchQuery
  const currentListTasks = useMemo(() => {
    const todayStr = todayKey;
    const tomorrowStr = addDays(todayKey, 1);
    const next7Str = addDays(todayKey, 7);

    return tasks.filter(task => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = task.title.toLowerCase().includes(q) ||
                        task.description?.toLowerCase().includes(q) ||
                        task.tags.some(tag => tag.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (activeList === 'trash') {
        return Boolean(task.deletedAt);
      }

      if (task.deletedAt) return false;

      if (activeList === 'completed') {
        return task.status === 'completed';
      }

      if (task.status === 'completed') {
        return false;
      }

      if (activeList === 'inbox') {
        return task.listId === 'inbox' || !task.listId;
      }

      if (activeList === 'today') {
        return task.dueDate === todayStr || task.dateLabel?.toLowerCase().includes('today');
      }

      if (activeList === 'tomorrow') {
        return task.dueDate === tomorrowStr || task.dateLabel?.toLowerCase().includes('tomorrow');
      }

      if (activeList === 'next7days') {
        return (task.dueDate && task.dueDate <= next7Str) || task.dateLabel?.toLowerCase().includes('next 7');
      }

      if (activeList === 'assigned') {
        return Boolean(currentUserEmail && task.assigneeEmail?.toLowerCase() === currentUserEmail.toLowerCase());
      }

      return task.listId === activeList;
    });
  }, [tasks, activeList, searchQuery, todayKey, currentUserEmail]);

  const selectedTask = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // Add Task with Backend Async Sync
  const addTask = useCallback((
    title: string,
    targetListId: string = activeList === 'today' || activeList === 'tomorrow' || activeList === 'next7days' ? 'inbox' : activeList,
    time?: string,
    priority: TaskPriority = 'none'
  ): Task => {
    const todayStr = localDateKey();
    let dateLabel = 'Today';
    let dueDate = todayStr;

    if (activeList === 'tomorrow') {
      dateLabel = 'Tomorrow';
      dueDate = addDays(todayStr, 1);
    } else if (activeList === 'next7days') {
      dateLabel = 'Next 7 Days';
      dueDate = addDays(todayStr, 3);
    }

    const localId = 'task-' + crypto.randomUUID();
    const newTask: Task = {
      id: localId,
      title: title.trim(),
      description: '',
      status: 'todo',
      priority,
      listId: targetListId === 'completed' || targetListId === 'trash' ? 'inbox' : targetListId,
      time: time || undefined,
      dueDate,
      dateLabel,
      tags: [],
      subtasks: [],
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
      ,assigneeEmail: currentUserEmail
    };

    setTasks(prev => [newTask, ...prev.map(t => ({ ...t, order: t.order + 1 }))]);
    setSelectedTaskId(localId);
    sound.playDrop();

    queueMutation('task.create', localId, {
      clientId: localId,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority.toUpperCase(),
      listId: newTask.listId,
      time: newTask.time,
      dueDate: newTask.dueDate,
      dateLabel: newTask.dateLabel,
      tags: newTask.tags,
      recurrenceRule: 'NONE',
      assigneeEmail: currentUserEmail,
      workspaceId,
    });

    return newTask;
  }, [activeList, queueMutation, currentUserEmail, workspaceId]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...updates,
          updatedAt: new Date().toISOString(),
          completedAt: updates.status === 'completed' ? new Date().toISOString() : t.completedAt
        };
      }
      return t;
    }));

    queueMutation('task.update', id, toApiTaskPayload(updates), undefined, 600);
  }, [queueMutation]);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;

      const isBecomingComplete = task.status !== 'completed';
      if (isBecomingComplete) {
        sound.playComplete();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#4772FA', '#10B981', '#F59E0B', '#EC4899']
        });
      } else {
        sound.playClick();
      }

      return prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: isBecomingComplete ? 'completed' : 'todo',
            completedAt: isBecomingComplete ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
    });

    const task = tasks.find(item => item.id === id);
    if (task) {
      queueMutation('task.update', id, {
        status: task.status === 'completed' ? 'TODO' : 'COMPLETED',
      });
    }
  }, [queueMutation, tasks]);

  const deleteTask = useCallback((id: string) => {
    const deletedTask = tasks.find(t => t.id === id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t));
    sound.playClick();
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    }

    queueMutation('task.delete', id);

    if (deletedTask) {
      addToast('Deleted task', 'info', 'Undo', () => {
        if (deletedTask) {
          setTasks(prev => prev.map(t => t.id === id ? { ...deletedTask!, deletedAt: undefined } : t));
          setSelectedTaskId(deletedTask.id);
          queueMutation('task.restore', id);
        }
      });
    }
  }, [selectedTaskId, addToast, queueMutation, tasks]);

  const restoreTask = useCallback((id: string) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, deletedAt: undefined } : task));
    queueMutation('task.restore', id);
    addToast('Task restored to its list', 'success');
  }, [addToast, queueMutation]);

  const permanentlyDeleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    if (selectedTaskId === id) setSelectedTaskId(null);
    queueMutation('task.permanentDelete', id);
    addToast('Task permanently deleted', 'success');
  }, [addToast, queueMutation, selectedTaskId]);

  const duplicateTask = useCallback((id: string) => {
    const source = tasks.find(task => task.id === id);
    if (!source) return;
    const duplicate = addTask(`${source.title} (copy)`, source.listId, source.time, source.priority);
    updateTask(duplicate.id, {
      description: source.description,
      dueDate: source.dueDate,
      dateLabel: source.dateLabel,
      tags: [...source.tags],
      recurrenceRule: source.recurrenceRule,
      reminderAt: source.reminderAt,
      assigneeEmail: source.assigneeEmail,
    });
  }, [addTask, tasks, updateTask]);

  const reorderTasks = useCallback((draggedId: string, targetId: string, newStatus?: Task['status']) => {
    setTasks(prev => {
      const ordered = [...prev];
      const sourceIndex = ordered.findIndex(task => task.id === draggedId);
      const targetIndex = ordered.findIndex(task => task.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return prev;
      const [moved] = ordered.splice(sourceIndex, 1);
      const nextMoved = newStatus ? { ...moved, status: newStatus } : moved;
      ordered.splice(targetIndex, 0, nextMoved);
      const changed = ordered.map((task, index) => ({ ...task, order: index }));
      changed.forEach(task => {
        const original = prev.find(item => item.id === task.id);
        if (original && (original.order !== task.order || original.status !== task.status)) {
          queueMutation('task.update', task.id, {
            order: task.order,
            ...(original.status !== task.status ? { status: task.status.toUpperCase() } : {}),
          });
        }
      });
      return changed;
    });
  }, [queueMutation]);

  const moveTaskToStatus = useCallback((id: string, status: Task['status']) => {
    updateTask(id, { status, completedAt: status === 'completed' ? new Date().toISOString() : undefined });
  }, [updateTask]);

  const clearCompleted = useCallback(() => {
    const ids = tasks.filter(task => !task.deletedAt && task.status === 'completed').map(task => task.id);
    setTasks(prev => prev.map(task => ids.includes(task.id) ? { ...task, deletedAt: new Date().toISOString() } : task));
    ids.forEach(id => queueMutation('task.delete', id));
    addToast(`${ids.length} completed task${ids.length === 1 ? '' : 's'} moved to trash`, 'success');
  }, [addToast, queueMutation, tasks]);

  // Subtasks
  const toggleSubTask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updated = task.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        return { ...task, subtasks: updated, updatedAt: new Date().toISOString() };
      }
      return task;
    }));
    sound.playClick();

    queueMutation('subtask.toggle', subtaskId, undefined, taskId);
  }, [queueMutation]);

  const addSubTask = useCallback((taskId: string, title: string) => {
    if (!title.trim()) return;
    const tempId = 'st-' + crypto.randomUUID();
    const newSubtask = {
      id: tempId,
      title: title.trim(),
      completed: false
    };

    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, subtasks: [...task.subtasks, newSubtask], updatedAt: new Date().toISOString() };
      }
      return task;
    }));
    sound.playClick();

    queueMutation('subtask.create', tempId, { title: title.trim(), clientId: tempId }, taskId);
  }, [queueMutation]);

  const deleteSubTask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks.filter(s => s.id !== subtaskId),
          updatedAt: new Date().toISOString()
        };
      }
      return task;
    }));

    queueMutation('subtask.delete', subtaskId, undefined, taskId);
  }, [queueMutation]);

  // Lists management
  const addList = useCallback((name: string, emoji: string = '📁', color: string = '#4772FA') => {
    if (!name.trim()) return;
    const newList: TaskList = {
      id: 'list-' + crypto.randomUUID(),
      name: name.trim(),
      emoji,
      color,
      hasDot: true
    };
    setLists(prev => [...prev, newList]);
    setActiveList(newList.id);
    sound.playDrop();
    addToast(`Added list "${newList.name}"`, 'success');

    queueMutation('list.create', newList.id, { ...newList, workspaceId } as unknown as Record<string, unknown>);
  }, [addToast, queueMutation, workspaceId]);

  const deleteList = useCallback((id: string) => {
    setLists(prev => prev.filter(l => l.id !== id));
    if (activeList === id) {
      setActiveList('inbox');
    }
    sound.playClick();
    queueMutation('list.delete', id);
  }, [activeList, queueMutation]);

  return {
    tasks,
    lists,
    activeTab,
    activeList,
    selectedTaskId,
    selectedTask,
    theme,
    searchQuery,
    toasts,
    listCounts,
    currentListTasks,
    isBackendConnected,
    syncState,
    pendingSyncCount,
    syncNow: flushPending,
    setActiveTab,
    setActiveList,
    setSelectedTaskId,
    setTheme,
    setSearchQuery,
    addTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    duplicateTask,
    reorderTasks,
    moveTaskToStatus,
    clearCompleted,
    toggleSubTask,
    addSubTask,
    deleteSubTask,
    addList,
    deleteList,
    removeToast,
    showToast: addToast,
    exportBackup: () => storageService.exportBackup(tasks, lists),
    importBackup: (json: string) => {
      try {
        const { tasks: t, lists: l } = storageService.importBackup(json);
        setTasks(t);
        setLists(l);
        addToast('Imported backup successfully!', 'success');
      } catch (err: unknown) {
        addToast((err as Error).message || 'Failed to import backup', 'error');
      }
    }
  };
}
