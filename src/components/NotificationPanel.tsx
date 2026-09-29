import { Bell, BellRing, CheckCheck, X } from 'lucide-react';
import type { TaskNotification } from '../types/todo';

interface NotificationPanelProps {
  notifications: TaskNotification[];
  isLoading: boolean;
  onClose: () => void;
  onSelect: (notification: TaskNotification) => void;
  onMarkAllRead: () => void;
  onEnableBrowserNotifications: () => void;
}

export function NotificationPanel({ notifications, isLoading, onClose, onSelect, onMarkAllRead, onEnableBrowserNotifications }: NotificationPanelProps) {
  return (
    <div className="workspace-overlay" onClick={onClose}>
      <aside className="workspace-drawer" onClick={event => event.stopPropagation()} aria-label="Thông báo">
        <header>
          <div><span className="pane-kicker"><BellRing size={14} /> Reminder center</span><h2>Thông báo</h2></div>
          <button className="icon-btn-ghost" type="button" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
        </header>
        <div className="drawer-toolbar">
          <button className="secondary-action" type="button" onClick={onEnableBrowserNotifications}><Bell size={15} /> Bật thông báo trình duyệt</button>
          <button className="secondary-action" type="button" onClick={onMarkAllRead}><CheckCheck size={15} /> Đánh dấu đã đọc</button>
        </div>
        <div className="notification-list">
          {isLoading && <p className="empty-copy">Đang tải thông báo…</p>}
          {!isLoading && !notifications.length && <div className="feature-empty"><Bell size={32} /><h3>Chưa có thông báo</h3><p>Reminder đến hạn sẽ xuất hiện tại đây.</p></div>}
          {notifications.map(item => (
            <button type="button" className={`notification-item ${item.readAt ? '' : 'unread'}`} key={item.id} onClick={() => onSelect(item)}>
              <span className="notification-dot" />
              <span><strong>{item.title}</strong><small>{item.message}</small><time>{new Date(item.createdAt.endsWith('Z') ? item.createdAt : `${item.createdAt}Z`).toLocaleString('vi-VN')}</time></span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
