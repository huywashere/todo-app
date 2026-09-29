import type { SyncOperation, SyncOperationKind } from '../types/todo';
import { ApiError, apiService } from './api';

let queueScope = 'guest';
const queueKey = () => `focusflow_${queueScope}_sync_queue_v1`;

function read(): SyncOperation[] {
  try {
    return JSON.parse(localStorage.getItem(queueKey()) || '[]') as SyncOperation[];
  } catch {
    return [];
  }
}

function write(queue: SyncOperation[]) {
  localStorage.setItem(queueKey(), JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('todo-sync-queue', { detail: queue.length }));
}

export const syncQueue = {
  setScope(scope: string) {
    queueScope = scope.replace(/[^a-zA-Z0-9_-]/g, '_') || 'guest';
  },
  list: read,
  count: () => read().length,
  clear() {
    write([]);
  },
  enqueue(
    kind: SyncOperationKind,
    entityId: string,
    payload?: Record<string, unknown>,
    parentId?: string,
  ): SyncOperation {
    let queue = read();

    if (kind === 'task.update') {
      const createIndex = queue.findIndex(item => item.kind === 'task.create' && item.entityId === entityId);
      if (createIndex >= 0) {
        queue[createIndex] = {
          ...queue[createIndex],
          payload: { ...queue[createIndex].payload, ...payload },
        };
        write(queue);
        return queue[createIndex];
      }
      const updateIndex = queue.findIndex(item => item.kind === kind && item.entityId === entityId);
      if (updateIndex >= 0) {
        queue[updateIndex] = {
          ...queue[updateIndex],
          payload: { ...queue[updateIndex].payload, ...payload },
          createdAt: new Date().toISOString(),
        };
        write(queue);
        return queue[updateIndex];
      }
    }

    if (kind === 'task.delete') {
      const wasOnlyLocal = queue.some(item => item.kind === 'task.create' && item.entityId === entityId);
      queue = queue.filter(item => item.entityId !== entityId && item.parentId !== entityId);
      if (wasOnlyLocal) {
        write(queue);
        return {
          id: crypto.randomUUID(), kind, entityId, payload, parentId,
          createdAt: new Date().toISOString(), attempts: 0,
        };
      }
    }

    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      kind,
      entityId,
      parentId,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    queue.push(operation);
    write(queue);
    return operation;
  },
  async flush(onProgress?: (remaining: number) => void): Promise<{ remaining: number; error?: string }> {
    let queue = read();
    while (queue.length > 0) {
      const operation = queue[0];
      try {
        await apiService.executeSyncOperation(operation);
        queue.shift();
        write(queue);
        onProgress?.(queue.length);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          queue.shift();
          write(queue);
          continue;
        }
        operation.attempts += 1;
        operation.lastError = error instanceof Error ? error.message : 'Không thể đồng bộ';
        queue[0] = operation;
        write(queue);
        return { remaining: queue.length, error: operation.lastError };
      }
    }
    return { remaining: 0 };
  },
};
