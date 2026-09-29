import type { Task, TaskList, ThemeMode, ActiveListType } from '../types/todo';

let storageScope = 'guest';
const scopedKey = (name: string) => `focusflow_${storageScope}_${name}_v3`;
const THEME_STORAGE_KEY = 'focusflow_theme_v3';

export const INITIAL_LISTS: TaskList[] = [
  { id: 'september-plan', name: 'September Plan', emoji: '🚀', color: '#3B82F6', hasDot: true },
  { id: 'work-hard', name: 'Work Hard', emoji: '💼', color: '#F59E0B' },
  { id: 'life-memo', name: 'Life Memo', emoji: '🏡', color: '#10B981', hasDot: true },
  { id: 'life', name: 'Life', emoji: '💖', color: '#EC4899' },
  { id: 'workout-plan', name: 'Workout Plan', emoji: '🏃', color: '#8B5CF6' },
  { id: 'wishlist', name: 'Wishlist', emoji: '✨', color: '#F97316' },
];

export const INITIAL_TASKS: Task[] = [
  // Today's tasks in Inbox (exact match to screenshot)
  {
    id: 'task-1',
    title: 'Morning Run',
    description: 'Jog 5km around the park and stretch afterwards',
    status: 'todo',
    priority: 'low',
    listId: 'inbox',
    time: '07:00',
    dateLabel: 'Today',
    dueDate: new Date().toISOString().split('T')[0],
    tags: ['Fitness'],
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-1', title: 'Warm-up 5 mins', completed: true },
      { id: 'st-2', title: '5km running', completed: false }
    ]
  },
  {
    id: 'task-2',
    title: 'Go Grocery Shopping',
    description: 'Prepare Shopping Bags in Advance',
    status: 'todo',
    priority: 'high',
    listId: 'inbox',
    time: '09:00',
    dateLabel: 'Today, Sep 6, 09:00 - 10:00 AM',
    dueDate: new Date().toISOString().split('T')[0],
    tags: ['Home', 'Personal'],
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-3', title: 'Eggs', completed: false },
      { id: 'st-4', title: 'Milk', completed: false },
      { id: 'st-5', title: 'Bread', completed: false },
      { id: 'st-6', title: 'Paper Towels', completed: false },
      { id: 'st-7', title: 'Body Wash', completed: false }
    ]
  },
  {
    id: 'task-3',
    title: 'Reply to Emails',
    description: 'Clear inbox zero for customer support and marketing team',
    status: 'todo',
    priority: 'medium',
    listId: 'inbox',
    time: '12:00',
    dateLabel: 'Today',
    dueDate: new Date().toISOString().split('T')[0],
    tags: ['Work'],
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  },
  {
    id: 'task-4',
    title: 'Discuss Plan with Client',
    description: 'Go through Q4 roadmap and design deliverables over Zoom call',
    status: 'todo',
    priority: 'high',
    listId: 'inbox',
    time: '13:00',
    dateLabel: 'Today',
    dueDate: new Date().toISOString().split('T')[0],
    tags: ['Meeting', 'Client'],
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [
      { id: 'st-8', title: 'Review slide deck', completed: true },
      { id: 'st-9', title: 'Prepare budget estimates', completed: false }
    ]
  },

  // Tomorrow tasks (exact match to screenshot)
  {
    id: 'task-5',
    title: 'Shoot Video',
    description: 'Record YouTube tutorial on clean architecture',
    status: 'todo',
    priority: 'medium',
    listId: 'inbox',
    time: '08:00',
    dateLabel: 'Tomorrow',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    tags: ['Content'],
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  },
  {
    id: 'task-6',
    title: 'Host Project Meeting',
    description: 'Bi-weekly sprint review with engineering leads',
    status: 'todo',
    priority: 'high',
    listId: 'inbox',
    time: '14:00',
    dateLabel: 'Tomorrow',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    tags: ['Meeting'],
    order: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  },
  {
    id: 'task-7',
    title: 'Finalize Promo Video',
    description: 'Color grading and export in 4K ProRes',
    status: 'todo',
    priority: 'medium',
    listId: 'inbox',
    time: '17:30',
    dateLabel: 'Tomorrow',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    tags: ['Content'],
    order: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  },

  // Next 7 Days (exact match to screenshot)
  {
    id: 'task-8',
    title: 'Pick Up Package',
    description: 'Parcel at central post office box 42',
    status: 'todo',
    priority: 'low',
    listId: 'inbox',
    time: 'Mon',
    dateLabel: 'Next 7 Days',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    tags: ['Errands'],
    order: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  },
  {
    id: 'task-9',
    title: 'Organize Project Meeting',
    description: 'Sync with product owners on user feedback',
    status: 'todo',
    priority: 'medium',
    listId: 'inbox',
    time: 'Mon',
    dateLabel: 'Next 7 Days',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    tags: ['Meeting'],
    order: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  },
  {
    id: 'task-10',
    title: 'Complete Client Proposal',
    description: 'Send contract draft and pricing breakdown',
    status: 'todo',
    priority: 'high',
    listId: 'inbox',
    time: 'Mon',
    dateLabel: 'Next 7 Days',
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    tags: ['Work'],
    order: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  },

  // Tasks in other custom lists to match sidebar counts
  {
    id: 'task-11',
    title: 'Product Launch Announcement 2.0',
    description: 'Post release notes on blog and Twitter',
    status: 'todo',
    priority: 'high',
    listId: 'september-plan',
    time: '10:00',
    dateLabel: 'Sep 28',
    dueDate: new Date().toISOString().split('T')[0],
    tags: ['Launch'],
    order: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  },
  {
    id: 'task-12',
    title: 'Bench Press & Core Routine',
    description: '5 sets x 8 reps at 85kg',
    status: 'todo',
    priority: 'medium',
    listId: 'workout-plan',
    time: '18:00',
    dateLabel: 'Today',
    dueDate: new Date().toISOString().split('T')[0],
    tags: ['Fitness'],
    order: 11,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  },
  {
    id: 'task-13',
    title: 'Completed Initial Environment Setup',
    description: 'Vite React TypeScript setup completed',
    status: 'completed',
    priority: 'low',
    listId: 'inbox',
    time: '08:30',
    dateLabel: 'Completed',
    dueDate: new Date().toISOString().split('T')[0],
    completedAt: new Date().toISOString(),
    tags: ['Dev'],
    order: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  }
];

export const storageService = {
  setScope(scope: string): void {
    storageScope = scope.replace(/[^a-zA-Z0-9_-]/g, '_') || 'guest';
  },

  loadTasks(): Task[] {
    try {
      const key = scopedKey('tasks');
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(INITIAL_TASKS));
        return INITIAL_TASKS;
      }
      return JSON.parse(data) as Task[];
    } catch {
      return INITIAL_TASKS;
    }
  },

  saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(scopedKey('tasks'), JSON.stringify(tasks));
    } catch (e) {
      console.error('Lỗi khi ghi tasks:', e);
    }
  },

  loadLists(): TaskList[] {
    try {
      const key = scopedKey('lists');
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(INITIAL_LISTS));
        return INITIAL_LISTS;
      }
      return JSON.parse(data) as TaskList[];
    } catch {
      return INITIAL_LISTS;
    }
  },

  saveLists(lists: TaskList[]): void {
    try {
      localStorage.setItem(scopedKey('lists'), JSON.stringify(lists));
    } catch (e) {
      console.error('Lỗi khi ghi lists:', e);
    }
  },

  loadActiveList(): ActiveListType {
    try {
      const val = localStorage.getItem(scopedKey('active_list'));
      return val || 'inbox';
    } catch {
      return 'inbox';
    }
  },

  saveActiveList(activeList: ActiveListType): void {
    try {
      localStorage.setItem(scopedKey('active_list'), activeList);
    } catch (e) {
      console.error('Lỗi khi lưu active list:', e);
    }
  },

  loadTheme(): ThemeMode {
    try {
      const theme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
      return theme === 'dark' ? 'dark' : 'light'; // Default light like screenshot!
    } catch {
      return 'light';
    }
  },

  saveTheme(theme: ThemeMode): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error('Lỗi khi lưu theme:', e);
    }
  },

  exportBackup(tasks: Task[], lists: TaskList[]): void {
    const backup = { schemaVersion: 3, tasks, lists, exportedAt: new Date().toISOString() };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  importBackup(jsonString: string): { tasks: Task[]; lists: TaskList[] } {
    const parsed = JSON.parse(jsonString) as { tasks?: unknown; lists?: unknown } | unknown[];
    if (Array.isArray(parsed)) {
      return { tasks: parsed as Task[], lists: INITIAL_LISTS };
    }
    if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.lists)) {
      throw new Error('Tệp sao lưu không đúng định dạng FocusFlow');
    }
    return {
      tasks: parsed.tasks as Task[],
      lists: parsed.lists as TaskList[]
    };
  }
};
