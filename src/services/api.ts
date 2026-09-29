import type {
  AuthSession,
  AuthUser,
  SyncOperation,
  Task,
  TaskList,
  TaskPriority,
  TaskStats,
  TaskStatus,
  TaskNotification,
  FocusSession,
  AccountTokenResult,
} from '../types/todo';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/api/v1'
).replace(/\/$/, '');
const SESSION_KEY = 'todo_auth_session_v1';

export interface BackendApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function loadSession(): AuthSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) as AuthSession : null;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as BackendApiResponse<T> | null;
  if (!response.ok) {
    throw new ApiError(response.status, body?.message || `Request failed (${response.status})`);
  }
  return body?.data as T;
}

async function refreshSession(): Promise<AuthSession | null> {
  const current = loadSession();
  if (!current?.refreshToken) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
    const session = await parseResponse<AuthSession>(response);
    saveSession(session);
    return session;
  } catch {
    saveSession(null);
    return null;
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const session = loadSession();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry && session?.refreshToken) {
    const refreshed = await refreshSession();
    if (refreshed) return request<T>(path, init, false);
  }
  return parseResponse<T>(response);
}

export const authService = {
  getSession: loadSession,
  async login(email: string, password: string): Promise<AuthSession> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const session = await parseResponse<AuthSession>(response);
    saveSession(session);
    return session;
  },
  async register(displayName: string, email: string, password: string): Promise<AuthSession> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, email, password }),
    });
    const session = await parseResponse<AuthSession>(response);
    saveSession(session);
    return session;
  },
  async me(): Promise<AuthUser> {
    return request<AuthUser>('/auth/me');
  },
  async updateProfile(displayName: string, timezone: string): Promise<AuthUser> {
    const user = await request<AuthUser>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ displayName, timezone }),
    });
    const current = loadSession();
    if (current) saveSession({ ...current, user });
    return user;
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return request<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  async requestEmailVerification(): Promise<AccountTokenResult> {
    return request<AccountTokenResult>('/auth/email-verification/request', { method: 'POST' });
  },
  async verifyEmail(token: string): Promise<AuthUser> {
    const user = await request<AuthUser>('/auth/email-verification/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    const current = loadSession();
    if (current) saveSession({ ...current, user });
    return user;
  },
  async forgotPassword(email: string): Promise<AccountTokenResult> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return parseResponse<AccountTokenResult>(response);
  },
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return parseResponse<void>(response);
  },
  async deleteAccount(password: string): Promise<void> {
    await request<void>('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
    saveSession(null);
  },
  async logout(): Promise<void> {
    const session = loadSession();
    if (session?.refreshToken) {
      await request<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      }).catch(() => undefined);
    }
    saveSession(null);
  },
  clear: () => saveSession(null),
};

export const apiService = {
  async checkHealth(): Promise<boolean> {
    try {
      await request<TaskStats>('/tasks/stats');
      return true;
    } catch {
      return false;
    }
  },

  async getTasks(listId?: string, query?: string, status?: TaskStatus): Promise<Task[]> {
    const params = new URLSearchParams();
    if (listId) params.set('listId', listId);
    if (query) params.set('query', query);
    if (status) params.set('status', status.toUpperCase());
    return request<Task[]>(`/tasks${params.size ? `?${params}` : ''}`);
  },

  async createTask(task: Partial<Task> & { title: string; clientId?: string }): Promise<Task> {
    return request<Task>('/tasks', { method: 'POST', body: JSON.stringify(task) });
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },

  async toggleTask(id: string): Promise<Task> {
    return request<Task>(`/tasks/${id}/toggle`, { method: 'PATCH' });
  },

  async deleteTask(id: string): Promise<void> {
    return request<void>(`/tasks/${id}`, { method: 'DELETE' });
  },

  async restoreTask(id: string): Promise<Task> {
    return request<Task>(`/tasks/${id}/restore`, { method: 'PATCH' });
  },

  async permanentlyDeleteTask(id: string): Promise<void> {
    return request<void>(`/tasks/${id}/permanent`, { method: 'DELETE' });
  },

  async addSubTask(taskId: string, title: string, clientId?: string): Promise<Task> {
    return request<Task>(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title, clientId }),
    });
  },

  async toggleSubTask(taskId: string, subTaskId: string): Promise<Task> {
    return request<Task>(`/tasks/${taskId}/subtasks/${subTaskId}/toggle`, { method: 'PATCH' });
  },

  async deleteSubTask(taskId: string, subTaskId: string): Promise<Task> {
    return request<Task>(`/tasks/${taskId}/subtasks/${subTaskId}`, { method: 'DELETE' });
  },

  async getLists(): Promise<TaskList[]> {
    return request<TaskList[]>('/lists');
  },

  async createList(list: Partial<TaskList>): Promise<TaskList> {
    return request<TaskList>('/lists', { method: 'POST', body: JSON.stringify(list) });
  },

  async deleteList(id: string): Promise<void> {
    return request<void>(`/lists/${id}`, { method: 'DELETE' });
  },

  async getStats(): Promise<TaskStats> {
    return request<TaskStats>('/tasks/stats');
  },

  async getNotifications(): Promise<TaskNotification[]> {
    return request<TaskNotification[]>('/notifications');
  },

  async markNotificationRead(id: string): Promise<TaskNotification> {
    return request<TaskNotification>(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsRead(): Promise<void> {
    return request<void>('/notifications/read-all', { method: 'PATCH' });
  },

  async getFocusSessions(): Promise<FocusSession[]> {
    return request<FocusSession[]>('/focus-sessions');
  },

  async createFocusSession(durationSeconds: number, taskId?: string): Promise<FocusSession> {
    return request<FocusSession>('/focus-sessions', {
      method: 'POST',
      body: JSON.stringify({ durationSeconds, taskId: taskId || null }),
    });
  },

  async executeSyncOperation(operation: SyncOperation): Promise<unknown> {
    const payload = operation.payload || {};
    switch (operation.kind) {
      case 'task.create':
        return this.createTask(payload as Partial<Task> & { title: string });
      case 'task.update':
        return this.updateTask(operation.entityId, payload as Partial<Task>);
      case 'task.delete':
        return this.deleteTask(operation.entityId);
      case 'task.restore':
        return this.restoreTask(operation.entityId);
      case 'task.permanentDelete':
        return this.permanentlyDeleteTask(operation.entityId);
      case 'subtask.create':
        return this.addSubTask(operation.parentId!, String(payload.title), String(payload.clientId));
      case 'subtask.toggle':
        return this.toggleSubTask(operation.parentId!, operation.entityId);
      case 'subtask.delete':
        return this.deleteSubTask(operation.parentId!, operation.entityId);
      case 'list.create':
        return this.createList(payload as Partial<TaskList>);
      case 'list.delete':
        return this.deleteList(operation.entityId);
      default:
        throw new Error(`Unsupported sync operation: ${operation.kind satisfies never}`);
    }
  },
};

export type { TaskPriority };
