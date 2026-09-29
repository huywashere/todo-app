import { beforeEach, describe, expect, it } from 'vitest';
import { storageService } from './storage';
import type { Task } from '../types/todo';

const sampleTask: Task = {
  id: 'task-test-12345678', title: 'Private task', status: 'todo', priority: 'low',
  listId: 'inbox', tags: [], subtasks: [], order: 0,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

describe('storageService', () => {
  beforeEach(() => localStorage.clear());

  it('isolates cached tasks between users', () => {
    storageService.setScope('user-a');
    storageService.saveTasks([sampleTask]);

    storageService.setScope('user-b');
    expect(storageService.loadTasks().some(task => task.title === 'Private task')).toBe(false);

    storageService.setScope('user-a');
    expect(storageService.loadTasks()).toEqual([sampleTask]);
  });

  it('rejects malformed backup files', () => {
    expect(() => storageService.importBackup('{"hello":"world"}')).toThrow(/không đúng định dạng/i);
  });
});
