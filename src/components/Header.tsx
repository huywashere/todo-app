import React, { useRef } from 'react';
import { CheckCircle2, Moon, Sun, Volume2, VolumeX, Download, Upload, Command, LayoutList, Kanban } from 'lucide-react';
import type { ViewMode, ThemeMode } from '../types/todo';
import { sound } from '../services/audio';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme: ThemeMode;
  onThemeToggle: () => void;
  onOpenCommandPalette: () => void;
  onExportBackup: () => void;
  onImportBackup: (json: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  theme,
  onThemeToggle,
  onOpenCommandPalette,
  onExportBackup,
  onImportBackup
}) => {
  const [isMuted, setIsMuted] = React.useState(() => sound.getMuted());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportBackup(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="app-header glass-panel">
      <div className="brand-section">
        <div className="brand-logo-icon">
          <CheckCircle2 size={26} strokeWidth={2.4} />
        </div>
        <div>
          <div className="brand-title">
            TaskFlow <span className="brand-badge">Pro</span>
          </div>
          <div className="brand-subtitle">
            Hệ thống quản lý công việc hiện đại & chuẩn kiến trúc
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* View Switcher: List vs Kanban */}
        <div className="view-switcher" role="group" aria-label="Chế độ xem">
          <button
            type="button"
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="Chế độ Danh sách"
          >
            <LayoutList size={16} />
            <span>Danh sách</span>
          </button>
          <button
            type="button"
            className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => onViewModeChange('kanban')}
            title="Chế độ Kanban Board"
          >
            <Kanban size={16} />
            <span>Kanban</span>
          </button>
        </div>

        {/* Command Palette Button */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenCommandPalette}
          title="Mở Command Palette (Ctrl + K)"
        >
          <Command size={15} />
          <span style={{ fontSize: '0.82rem' }}>Ctrl+K</span>
        </button>

        {/* Backup export/import */}
        <button
          type="button"
          className="btn-icon"
          onClick={onExportBackup}
          title="Sao lưu dữ liệu (Export JSON)"
        >
          <Download size={18} />
        </button>
        <button
          type="button"
          className="btn-icon"
          onClick={() => fileInputRef.current?.click()}
          title="Khôi phục dữ liệu (Import JSON)"
        >
          <Upload size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Sound toggle */}
        <button
          type="button"
          className="btn-icon"
          onClick={toggleSound}
          title={isMuted ? 'Bật âm thanh hiệu ứng' : 'Tắt âm thanh hiệu ứng'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          className="btn-icon"
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};
