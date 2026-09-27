import { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { Task, TaskList, MainNavTab, ActiveListType, ThemeMode, ToastMessage, TaskPriority } from '../types/todo';
import { storageService } from '../services/storage';
import { apiService } from '../services/api';
import { sound } from '../services/audio';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => storageService.loadTasks());
  const [lists, setLists] = useState<TaskList[]>(() => storageService.loadLists());
  const [activeTab, setActiveTab] = useState<MainNavTab>('tasks');
  const [activeList, setActiveList] = useState<ActiveListType>(() => storageService.loadActiveList());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>('task-2');
  const [theme, setThemeState] = useState<ThemeMode>(() => storageService.loadTheme());
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Sync with Spring Boot backend on mount
  useEffect(() => {
    let isMounted = true;

    async function syncWithBackend() {
      try {
        const [backendTasks, backendLists] = await Promise.all([
          apiService.getTasks(),
          apiService.getLists()
        ]);

        if (isMounted && backendTasks.length > 0) {
          // Normalize enum lowercase/uppercase for UI compatibility
          const normalizedTasks: Task[] = backendTasks.map(t => ({
            ...t,
            status: String(t.status).toLowerCase() as Task['status'],
            priority: String(t.priority).toLowerCase() as Task['priority']
          }));

          setTasks(normalizedTasks);
          setLists(backendLists);
          setIsBackendConnected(true);
          storageService.saveTasks(normalizedTasks);
          storageService.saveLists(backendLists);
        }
      } catch {
        if (isMounted) {
          setIsBackendConnected(false);
        }
      }
    }

    syncWithBackend();

    return () => {
      isMounted = false;
    };
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

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const next7Str = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];

    tasks.forEach(t => {
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
  }, [tasks, lists]);

  // Filter tasks based on current activeList and searchQuery
  const currentListTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const next7Str = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];

    return tasks.filter(task => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = task.title.toLowerCase().includes(q) ||
                        task.description?.toLowerCase().includes(q) ||
                        task.tags.some(tag => tag.toLowerCase().includes(q));
        if (!matches) return false;
      }

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
        return true;
      }

      return task.listId === activeList;
    });
  }, [tasks, activeList, searchQuery]);

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
    const todayStr = new Date().toISOString().split('T')[0];
    let dateLabel = 'Today';
    let dueDate = todayStr;

    if (activeList === 'tomorrow') {
      dateLabel = 'Tomorrow';
      dueDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    } else if (activeList === 'next7days') {
      dateLabel = 'Next 7 Days';
      dueDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    }

    const localId = 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
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
    };

    setTasks(prev => [newTask, ...prev.map(t => ({ ...t, order: t.order + 1 }))]);
    setSelectedTaskId(localId);
    sound.playDrop();

    // Async sync to Spring Boot
    apiService.createTask({
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority.toUpperCase() as TaskPriority,
      listId: newTask.listId,
      time: newTask.time,
      dueDate: newTask.dueDate,
      dateLabel: newTask.dateLabel
    }).then(created => {
      setIsBackendConnected(true);
      if (created.id !== localId) {
        setTasks(prev => prev.map(t => t.id === localId ? { ...t, id: created.id } : t));
        setSelectedTaskId(created.id);
      }
    }).catch(() => {
      // Local fallback silently preserved
    });

    return newTask;
  }, [activeList]);

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

    apiService.updateTask(id, {
      ...updates,
      status: updates.status ? updates.status.toUpperCase() as Task['status'] : undefined,
      priority: updates.priority ? updates.priority.toUpperCase() as Task['priority'] : undefined,
    }).catch(() => {});
  }, []);

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

    apiService.toggleTask(id).catch(() => {});
  }, []);

  const deleteTask = useCallback((id: string) => {
    let deletedTask: Task | undefined;
    setTasks(prev => {
      deletedTask = prev.find(t => t.id === id);
      return prev.filter(t => t.id !== id);
    });
    sound.playClick();
    if (selectedTaskId === id) {
      setSelectedTaskId(null);
    }

    apiService.deleteTask(id).catch(() => {});

    if (deletedTask) {
      addToast('Deleted task', 'info', 'Undo', () => {
        if (deletedTask) {
          setTasks(prev => [deletedTask!, ...prev]);
          setSelectedTaskId(deletedTask.id);
          apiService.createTask(deletedTask).catch(() => {});
        }
      });
    }
  }, [selectedTaskId, addToast]);

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

    apiService.toggleSubTask(taskId, subtaskId).catch(() => {});
  }, []);

  const addSubTask = useCallback((taskId: string, title: string) => {
    if (!title.trim()) return;
    const tempId = 'st-' + Date.now();
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

    apiService.addSubTask(taskId, title.trim()).then(updated => {
      setTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        subtasks: updated.subtasks
      } : t));
    }).catch(() => {});
  }, []);

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

    apiService.deleteSubTask(taskId, subtaskId).catch(() => {});
  }, []);

  // Lists management
  const addList = useCallback((name: string, emoji: string = '📁', color: string = '#4772FA') => {
    if (!name.trim()) return;
    const newList: TaskList = {
      id: 'list-' + Date.now(),
      name: name.trim(),
      emoji,
      color,
      hasDot: true
    };
    setLists(prev => [...prev, newList]);
    setActiveList(newList.id);
    sound.playDrop();
    addToast(`Added list "${newList.name}"`, 'success');

    apiService.createList(newList).catch(() => {});
  }, [addToast]);

  const deleteList = useCallback((id: string) => {
    setLists(prev => prev.filter(l => l.id !== id));
    if (activeList === id) {
      setActiveList('inbox');
    }
    sound.playClick();
    apiService.deleteList(id).catch(() => {});
  }, [activeList]);

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
    setActiveTab,
    setActiveList,
    setSelectedTaskId,
    setTheme,
    setSearchQuery,
    addTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    toggleSubTask,
    addSubTask,
    deleteSubTask,
    addList,
    deleteList,
    removeToast,
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
