import React from 'react';
import { CheckCircle2, Clock, Flame, AlertTriangle } from 'lucide-react';
import type { TaskStats } from '../types/todo';

interface StatsOverviewProps {
  stats: TaskStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <div className="stats-grid">
      {/* Total Card */}
      <div className="stat-card glass-panel">
        <div className="stat-info">
          <span className="stat-label">Tổng công việc</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
          <Clock size={22} />
        </div>
      </div>

      {/* In Progress Card */}
      <div className="stat-card glass-panel">
        <div className="stat-info">
          <span className="stat-label">Đang tiến hành</span>
          <span className="stat-value" style={{ color: 'var(--status-in-progress)' }}>{stats.inProgress}</span>
        </div>
        <div className="stat-icon-wrapper" style={{ background: 'var(--status-in-progress-bg)', color: 'var(--status-in-progress)' }}>
          <Flame size={22} />
        </div>
      </div>

      {/* Completed Card */}
      <div className="stat-card glass-panel">
        <div className="stat-info" style={{ flex: 1, marginRight: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="stat-label">Đã hoàn thành</span>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--status-completed)' }}>
              {stats.completionRate}%
            </span>
          </div>
          <span className="stat-value" style={{ color: 'var(--status-completed)' }}>{stats.completed}</span>
          <div className="stat-progress-bg">
            <div
              className="stat-progress-fill"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
        <div className="stat-icon-wrapper" style={{ background: 'var(--status-completed-bg)', color: 'var(--status-completed)' }}>
          <CheckCircle2 size={22} />
        </div>
      </div>

      {/* Attention / Urgent / Overdue Card */}
      <div className="stat-card glass-panel">
        <div className="stat-info">
          <span className="stat-label">Cần ưu tiên</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span className="stat-value" style={{ color: stats.urgentCount > 0 ? 'var(--priority-urgent)' : 'var(--text-secondary)' }}>
              {stats.urgentCount} khẩn cấp
            </span>
          </div>
          {stats.overdue > 0 && (
            <span style={{ fontSize: '0.74rem', color: '#f43f5e', fontWeight: 600, marginTop: '0.2rem' }}>
              ⚠️ {stats.overdue} việc quá hạn
            </span>
          )}
        </div>
        <div className="stat-icon-wrapper" style={{ background: 'var(--priority-urgent-bg)', color: 'var(--priority-urgent)' }}>
          <AlertTriangle size={22} />
        </div>
      </div>
    </div>
  );
};
