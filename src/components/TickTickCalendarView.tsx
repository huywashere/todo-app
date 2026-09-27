import { Fragment } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../types/todo';

interface TickTickCalendarViewProps {
  onSelectTask: (taskId: string) => void;
  tasks?: Task[];
}

export const TickTickCalendarView: React.FC<TickTickCalendarViewProps> = ({
  onSelectTask
}) => {
  const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  const days = [
    { label: 'T', day: '6', isCurrent: true, title: 'Tuesday' },
    { label: 'W', day: '7', isCurrent: false, title: 'Wednesday' },
    { label: 'T', day: '8', isCurrent: false, title: 'Thursday' },
  ];

  return (
    <div className="calendar-view-container animate-fade">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CalendarIcon size={20} style={{ color: '#4772FA' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>September 2026</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.5rem' }}>
            <button type="button" className="icon-btn-ghost"><ChevronLeft size={16} /></button>
            <button type="button" className="icon-btn-ghost"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--tt-text-muted)' }}>Week View (Timeline)</span>
        </div>
      </div>

      {/* Days Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(3, 1fr)', gap: '1px', backgroundColor: 'var(--tt-border)', borderTop: '1px solid var(--tt-border)', borderLeft: '1px solid var(--tt-border)', borderRight: '1px solid var(--tt-border)', borderRadius: '8px 8px 0 0' }}>
        <div style={{ background: 'var(--tt-bg-main)', padding: '0.5rem' }} />
        {days.map(d => (
          <div key={d.day} style={{ background: 'var(--tt-bg-main)', padding: '0.65rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--tt-text-muted)', fontWeight: 600 }}>{d.label}</div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: d.isCurrent ? '#4772FA' : 'transparent',
              color: d.isCurrent ? '#FFF' : 'var(--tt-text-primary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              marginTop: '0.15rem'
            }}>
              {d.day}
            </div>
          </div>
        ))}
      </div>

      {/* Grid Timeline matching screenshot */}
      <div className="calendar-grid-timeline">
        {hours.map(hour => (
          <Fragment key={hour}>
            <div className="timeline-hour">{hour}</div>

            {/* Day 6 column */}
            <div className="timeline-slot">
              {hour === '07:00' && (
                <div className="calendar-event-card event-pink" onClick={() => onSelectTask('task-1')}>
                  <div>Morning Run</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>07:00 - 08:00</div>
                </div>
              )}
              {hour === '09:00' && (
                <div className="calendar-event-card event-blue" onClick={() => onSelectTask('task-2')}>
                  <div>Go Grocery Shopping</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>09:00 - 11:00</div>
                </div>
              )}
              {hour === '12:00' && (
                <div className="calendar-event-card event-blue" onClick={() => onSelectTask('task-3')}>
                  <div>Reply to Emails</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>12:00 - 13:00</div>
                </div>
              )}
              {hour === '13:00' && (
                <div className="calendar-event-card event-cyan" onClick={() => onSelectTask('task-4')}>
                  <div>Discuss Plan with Client</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>13:00 - 17:00</div>
                </div>
              )}
            </div>

            {/* Day 7 column */}
            <div className="timeline-slot">
              {hour === '08:00' && (
                <div className="calendar-event-card event-pink" onClick={() => onSelectTask('task-5')}>
                  <div>Shoot Video</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>08:00 - 12:00</div>
                </div>
              )}
              {hour === '13:00' && (
                <div className="calendar-event-card event-green" onClick={() => onSelectTask('task-6')}>
                  <div>Host Project Meeting</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>13:00 - 14:00</div>
                </div>
              )}
              {hour === '14:00' && (
                <div className="calendar-event-card event-green" onClick={() => onSelectTask('task-7')}>
                  <div>Finalize Promo Video</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>14:30 - 18:00</div>
                </div>
              )}
            </div>

            {/* Day 8 column */}
            <div className="timeline-slot">
              {hour === '08:00' && (
                <div className="calendar-event-card event-green" onClick={() => onSelectTask('task-8')}>
                  <div>Pick Up Package</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>08:00 - 09:00</div>
                </div>
              )}
              {hour === '09:00' && (
                <div className="calendar-event-card event-cyan" onClick={() => onSelectTask('task-9')}>
                  <div>Organize Project Meeting</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>09:00 - 12:00</div>
                </div>
              )}
              {hour === '13:00' && (
                <div className="calendar-event-card event-blue" onClick={() => onSelectTask('task-10')}>
                  <div>Complete Client Proposal</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>13:30 - 16:30</div>
                </div>
              )}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
};
