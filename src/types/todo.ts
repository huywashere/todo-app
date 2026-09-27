export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskList {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  hasDot?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  listId: string; // 'inbox', 'september-plan', 'work-hard', etc.
  time?: string; // '07:00', '09:00', '13:00', etc.
  dueDate?: string; // 'YYYY-MM-DD'
  dateLabel?: string; // 'Today', 'Tomorrow', 'Mon', 'Wed', etc.
  tags: string[];
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  order: number;
}

export type MainNavTab = 'tasks' | 'calendar' | 'habits' | 'matrix' | 'pomodoro' | 'search';
export type SmartListId = 'today' | 'tomorrow' | 'next7days' | 'assigned' | 'inbox' | 'completed' | 'trash';
export type ActiveListType = SmartListId | string;

export type ViewMode = 'list' | 'kanban';
export type ThemeMode = 'light' | 'dark';

export interface FilterOptions {
  search: string;
  status: 'all' | TaskStatus;
  priority: 'all' | TaskPriority;
  tag: string | 'all';
  sortBy: 'order' | 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortDirection: 'asc' | 'desc';
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  completionRate: number;
  urgentCount: number;
  todayCount?: number;
  tomorrowCount?: number;
  next7DaysCount?: number;
  inboxCount?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}
