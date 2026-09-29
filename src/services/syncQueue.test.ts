import { beforeEach, describe, expect, it } from 'vitest';
import { syncQueue } from './syncQueue';

describe('syncQueue', () => {
  beforeEach(() => {
    localStorage.clear();
    syncQueue.setScope('test-user');
  });

  it('coalesces repeated updates for the same task', () => {
    syncQueue.enqueue('task.update', 'task-12345678', { title: 'First' });
    syncQueue.enqueue('task.update', 'task-12345678', { description: 'Second' });
    expect(syncQueue.list()).toHaveLength(1);
    expect(syncQueue.list()[0].payload).toEqual({ title: 'First', description: 'Second' });
  });

  it('removes an unsynced create when the task is deleted locally', () => {
    syncQueue.enqueue('task.create', 'task-12345678', { title: 'Draft' });
    syncQueue.enqueue('task.delete', 'task-12345678');
    expect(syncQueue.count()).toBe(0);
  });
});
