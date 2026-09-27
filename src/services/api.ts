import type { Task, TaskList, TaskStatus, TaskPriority, TaskStats } from '../types/todo';

const API_BASE_URL = 'http://localhost:8085/api/v1';

export interface BackendApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export const apiService = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/stats`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getTasks(listId?: string, query?: string, status?: TaskStatus): Promise<Task[]> {
    const params = new URLSearchParams();
    if (listId) params.append('listId', listId);
    if (query) params.append('query', query);
    if (status) params.append('status', status);

    const url = `${API_BASE_URL}/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json: BackendApiResponse<Task[]> = await res.json();
    return json.data;
  },

  async createTask(task: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    listId?: string;
    time?: string;
    dueDate?: string;
    dateLabel?: string;
    tags?: string[];
  }): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json: BackendApiResponse<Task> = await res.json();
    return json.data;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json: BackendApiResponse<Task> = await res.json();
    return json.data;
  },

  async toggleTask(id: string): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}/toggle`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json: BackendApiResponse<Task> = await res.json();
    return json.data;
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  },

  async addSubTask(taskId: string, title: string): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json: BackendApiResponse<Task> = await res.json();
    return json.data;
  },

  async toggleSubTask(taskId: string, subTaskId: string): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks/${subTaskId}/toggle`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json: BackendApiResponse<Task> = await res.json();
    return json.data;
  },

  async deleteSubTask(taskId: string, subTaskId: string): Promise<Task> {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/subtasks/${subTaskId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json: BackendApiResponse<Task> = await res.json();
    return json.data;
  },

  async getLists(): Promise<TaskList[]> {
    const res = await fetch(`${API_BASE_URL}/lists`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json: BackendApiResponse<TaskList[]> = await res.json();
    return json.data;
  },

  async createList(list: { id?: string; name: string; emoji?: string; color?: string; hasDot?: boolean }): Promise<TaskList> {
    const res = await fetch(`${API_BASE_URL}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json: BackendApiResponse<TaskList> = await res.json();
    return json.data;
  },

  async deleteList(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/lists/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  },

  async getStats(): Promise<TaskStats> {
    const res = await fetch(`${API_BASE_URL}/tasks/stats`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json: BackendApiResponse<TaskStats> = await res.json();
    return json.data;
  }
};
