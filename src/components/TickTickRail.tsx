import React from 'react';
import {
  CheckSquare,
  Calendar,
  Target,
  LayoutGrid,
  Clock,
  Star,
  Search,
  RefreshCw,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import type { MainNavTab, ThemeMode } from '../types/todo';

interface TickTickRailProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  onSync: () => void;
  isBackendConnected?: boolean;
}

export const TickTickRail: React.FC<TickTickRailProps> = ({
  activeTab,
  onTabChange,
  theme,
  onThemeToggle,
  onSync,
  isBackendConnected
}) => {
  return (
    <aside className="tt-rail">
      <div className="tt-rail-top">
        {/* TickTick Logo Icon */}
        <button
          type="button"
          className="tt-logo-btn"
          onClick={() => onTabChange('tasks')}
          title="TickTick Home"
          aria-label="TickTick Home"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#FAAD14" strokeWidth="2.5" />
            <path
              d="M7.5 12L10.5 15L16.5 9"
              stroke="#4772FA"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Navigation Rail Buttons */}
        <nav className="tt-rail-nav">
          <button
            type="button"
            className={`tt-rail-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => onTabChange('tasks')}
            title="Tasks (Danh sách công việc)"
          >
            <CheckSquare size={20} />
          </button>

          <button
            type="button"
            className={`tt-rail-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => onTabChange('calendar')}
            title="Calendar (Lịch biểu & Timeline)"
          >
            <Calendar size={20} />
          </button>

          <button
            type="button"
            className={`tt-rail-btn ${activeTab === 'habits' ? 'active' : ''}`}
            onClick={() => onTabChange('habits')}
            title="Habit Tracker (Thói quen & Mục tiêu)"
          >
            <Target size={20} />
          </button>

          <button
            type="button"
            className={`tt-rail-btn ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => onTabChange('matrix')}
            title="Eisenhower Matrix (Ma trận ưu tiên)"
          >
            <LayoutGrid size={20} />
          </button>

          <button
            type="button"
            className={`tt-rail-btn ${activeTab === 'pomodoro' ? 'active' : ''}`}
            onClick={() => onTabChange('pomodoro')}
            title="Pomodoro Timer (Đồng hồ tập trung)"
          >
            <Clock size={20} />
          </button>

          <button
            type="button"
            className="tt-rail-btn"
            onClick={() => onTabChange('tasks')}
            title="Achievements (Thống kê & Thành tựu)"
          >
            <Star size={20} />
          </button>

          <button
            type="button"
            className={`tt-rail-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => onTabChange('search')}
            title="Search (Tìm kiếm)"
          >
            <Search size={20} />
          </button>
        </nav>
      </div>

      <div className="tt-rail-bottom">
        <button
          type="button"
          className="tt-rail-btn"
          onClick={onSync}
          title="Đồng bộ đám mây (Sync)"
        >
          <RefreshCw size={18} />
        </button>

        {/* Backend Status Indicator */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isBackendConnected ? '#10B981' : '#9CA3AF',
            boxShadow: isBackendConnected ? '0 0 8px #10B981' : 'none',
            margin: '0.25rem 0'
          }}
          title={isBackendConnected ? 'Đã kết nối Spring Boot Backend (Port 8085)' : 'Chế độ ngoại tuyến (Local Storage)'}
        />

        <button
          type="button"
          className="tt-rail-btn"
          title="Thông báo"
        >
          <Bell size={18} />
        </button>

        <button
          type="button"
          className="tt-rail-btn"
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </aside>
  );
};
