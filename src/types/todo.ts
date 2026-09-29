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
  deletedAt?: string;
  reminderAt?: string;
  recurrenceRule?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  assigneeEmail?: string;
  recurrenceSeriesId?: string;
  recurrenceParentId?: string;
  version?: number;
  order: number;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  timezone: string;
  emailVerified: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: AuthUser;
}

export type SyncState = 'offline' | 'syncing' | 'synced' | 'error';

export type SyncOperationKind =
  | 'task.create'
  | 'task.update'
  | 'task.delete'
  | 'task.restore'
  | 'task.permanentDelete'
  | 'subtask.create'
  | 'subtask.toggle'
  | 'subtask.delete'
  | 'list.create'
  | 'list.delete';

export interface SyncOperation {
  id: string;
  kind: SyncOperationKind;
  entityId: string;
  parentId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

export type MainNavTab = 'tasks' | 'calendar' | 'habits' | 'matrix' | 'pomodoro' | 'achievements' | 'search';
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

export interface TaskNotification {
  id: string;
  taskId?: string;
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  durationSeconds: number;
  completedAt: string;
}

export interface AccountTokenResult {
  message: string;
  developmentToken?: string;
}
