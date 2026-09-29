import React, { useRef } from 'react';
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
  Moon,
  LogOut,
  Download,
  Upload
} from 'lucide-react';
import type { MainNavTab, SyncState, ThemeMode } from '../types/todo';

interface TickTickRailProps {
  activeTab: MainNavTab;
  onTabChange: (tab: MainNavTab) => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  onSync: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onNotifications: () => void;
  unreadNotifications: number;
  isBackendConnected?: boolean;
  syncState: SyncState;
  pendingSyncCount: number;
  userName: string;
  onLogout: () => void;
  onAccount: () => void;
}

export const TickTickRail: React.FC<TickTickRailProps> = ({
  activeTab,
  onTabChange,
  theme,
  onThemeToggle,
  onSync,
  onExport,
  onImport,
  onNotifications,
  unreadNotifications,
  isBackendConnected,
  syncState,
  pendingSyncCount,
  userName,
  onLogout,
  onAccount
}) => {
  const importInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="tt-rail">
      <div className="tt-rail-top">
        {/* TickTick Logo Icon */}
        <button
          type="button"
          className="tt-logo-btn"
          onClick={() => onTabChange('tasks')}
          title="FocusFlow Home"
          aria-label="FocusFlow Home"
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
            className={`tt-rail-btn ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => onTabChange('achievements')}
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
          title={pendingSyncCount ? `Đồng bộ ${pendingSyncCount} thay đổi` : 'Đồng bộ ngay'}
        >
          <RefreshCw size={18} className={syncState === 'syncing' ? 'spin' : ''} />
        </button>

        <button type="button" className="tt-rail-btn" onClick={onExport} title="Xuất bản sao lưu JSON">
          <Download size={17} />
        </button>

        <button type="button" className="tt-rail-btn" onClick={() => importInputRef.current?.click()} title="Nhập bản sao lưu JSON">
          <Upload size={17} />
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImport(file);
            event.target.value = '';
          }}
        />

        {/* Backend Status Indicator */}
        <div
          className={`sync-indicator ${syncState}`}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isBackendConnected ? '#10B981' : '#9CA3AF',
            boxShadow: isBackendConnected ? '0 0 8px #10B981' : 'none',
            margin: '0.25rem 0'
          }}
          title={syncState === 'syncing' ? `Đang đồng bộ ${pendingSyncCount} thay đổi` : isBackendConnected ? 'Dữ liệu đã đồng bộ' : 'Chế độ ngoại tuyến — thay đổi sẽ được xếp hàng'}
        />

        <button
          type="button"
          className="tt-rail-btn notification-rail-btn"
          onClick={onNotifications}
          title="Thông báo"
        >
          <Bell size={18} />
          {unreadNotifications > 0 && <span className="rail-badge">{Math.min(unreadNotifications, 9)}</span>}
        </button>

        <button
          type="button"
          className="tt-rail-btn"
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button type="button" className="tt-user-avatar" onClick={onAccount} title={`${userName} — Tài khoản`} aria-label="Mở tài khoản">
          <span>{userName.slice(0, 1).toUpperCase()}</span>
        </button>
        <button type="button" className="tt-rail-btn" onClick={onLogout} title="Đăng xuất" aria-label="Đăng xuất"><LogOut size={16} /></button>
      </div>
    </aside>
  );
};
