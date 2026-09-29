import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TickTickCalendarView } from './TickTickCalendarView';
import type { Task } from '../types/todo';

describe('TickTickCalendarView', () => {
  it('renders real tasks and selects their real id', () => {
    const dueDate = new Date().toLocaleDateString('en-CA');
    const task: Task = {
      id: 'task-live-calendar',
      title: 'Review production calendar',
      status: 'todo',
      priority: 'high',
      listId: 'inbox',
      dueDate,
      time: '09:30',
      tags: ['release'],
      subtasks: [],
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const onSelect = vi.fn();

    render(<TickTickCalendarView tasks={[task]} onSelectTask={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Review production calendar/i }));
    expect(onSelect).toHaveBeenCalledWith('task-live-calendar');
    expect(screen.queryByText('Morning Run')).not.toBeInTheDocument();
  });
});
