import { useCallback, useEffect, useRef, useState } from 'react';
import { AccountPanel } from './components/AccountPanel';
import { AuthScreen } from './components/AuthScreen';
import { CommandPalette } from './components/CommandPalette';
import { NotificationPanel } from './components/NotificationPanel';
import { TickTickCalendarView } from './components/TickTickCalendarView';
import { TickTickDetailPane } from './components/TickTickDetailPane';
import { TickTickMainPane } from './components/TickTickMainPane';
import { TickTickRail } from './components/TickTickRail';
import { TickTickSidebar } from './components/TickTickSidebar';
import { ToastContainer } from './components/ToastContainer';
import { ProductivityPane } from './components/ProductivityPane';
import { useTasks } from './hooks/useTasks';
import { apiService, authService } from './services/api';
import { storageService } from './services/storage';
import type { AuthSession, AuthUser, TaskNotification, ViewMode, Workspace } from './types/todo';
import './App.css';

interface WorkspaceProps {
  session: AuthSession | null;
  onExit: () => void;
  onUserUpdated: (user: AuthUser) => void;
}

function TaskWorkspace({ session, onExit, onUserUpdated }: WorkspaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [quickAddNonce, setQuickAddNonce] = useState(0);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(session ? `personal-${session.user.id}` : undefined);
  const shownNotificationIds = useRef(new Set<string>());
  const syncIdentity = session?.user.id || 'offline';
  storageService.setScope(syncIdentity);

  const {
    tasks, lists, activeTab, activeList, selectedTaskId, selectedTask, theme, toasts,
    listCounts, currentListTasks, isBackendConnected, syncState, pendingSyncCount,
    setActiveTab, setActiveList, setSelectedTaskId, setTheme, addTask, updateTask,
    toggleTaskStatus, deleteTask, restoreTask, toggleSubTask, addSubTask, deleteSubTask, addList,
    deleteList, removeToast, showToast, exportBackup, importBackup, syncNow,
    permanentlyDeleteTask, reorderTasks, moveTaskToStatus, clearCompleted,
  } = useTasks(syncIdentity, session?.user.email, activeWorkspaceId);

  useEffect(() => {
    if (!session) return;
    void apiService.getWorkspaces().then(items => {
      setWorkspaces(items);
      setActiveWorkspaceId(current => current && items.some(item => item.id === current) ? current : items[0]?.id);
    }).catch(() => undefined);
  }, [session]);

  const loadNotifications = useCallback(async (announce = false) => {
    if (!session) return;
    setNotificationsLoading(true);
    try {
      const items = await apiService.getNotifications();
      setNotifications(items);
      if (announce && 'Notification' in window && window.Notification.permission === 'granted') {
        items.filter(item => !item.readAt && !shownNotificationIds.current.has(item.id)).forEach(item => {
          shownNotificationIds.current.add(item.id);
          new window.Notification(item.title, { body: item.message, tag: item.id });
        });
      } else {
        items.forEach(item => shownNotificationIds.current.add(item.id));
      }
    } catch {
      // Offline queue remains available even when notifications cannot refresh.
    } finally {
      setNotificationsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const initialTimer = window.setTimeout(() => void loadNotifications(false), 0);
    const timer = window.setInterval(() => void loadNotifications(true), 15_000);
    return () => { window.clearTimeout(initialTimer); window.clearInterval(timer); };
  }, [loadNotifications, session]);

  useEffect(() => {
    if (!session) return;
    return apiService.subscribeToEvents((event) => {
      if (event === 'workspace.activity' || event === 'notification.created') {
        void syncNow();
        void loadNotifications(true);
      }
    });
  }, [loadNotifications, session, syncNow]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setCommandOpen(value => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="ticktick-app">
      <div className="ticktick-window">
        <TickTickRail
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'tasks') setSelectedTaskId(null);
          }}
          theme={theme}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onSync={() => void syncNow()}
          onExport={exportBackup}
          onImport={(file) => void file.text().then(importBackup)}
          onNotifications={() => { setNotificationsOpen(true); void loadNotifications(false); }}
          unreadNotifications={notifications.filter(item => !item.readAt).length}
          isBackendConnected={isBackendConnected}
          syncState={syncState}
          pendingSyncCount={pendingSyncCount}
          userName={session?.user.displayName || 'Offline'}
          onLogout={onExit}
          onAccount={() => session ? setAccountOpen(true) : showToast('Đăng nhập để quản lý tài khoản.', 'info')}
        />

        {sidebarOpen && <button type="button" className="sidebar-backdrop" aria-label="Đóng thanh danh sách" onClick={() => setSidebarOpen(false)} />}
        <TickTickSidebar
          isOpen={sidebarOpen}
          activeList={activeList}
          onSelectList={(listId) => {
            setActiveList(listId);
            setSidebarOpen(false);
            if (activeTab !== 'tasks') setActiveTab('tasks');
          }}
          lists={lists}
          counts={listCounts}
          onAddList={addList}
          onDeleteList={deleteList}
        />

        {activeTab === 'calendar' ? (
          <TickTickCalendarView
            tasks={tasks.filter(task => !task.deletedAt)}
            onSelectTask={(taskId) => {
              setSelectedTaskId(taskId);
              setActiveTab('tasks');
            }}
          />
        ) : activeTab !== 'tasks' ? (
          <ProductivityPane
            mode={activeTab}
            tasks={tasks}
            onSelectTask={(taskId) => {
              setSelectedTaskId(taskId);
              setActiveTab('tasks');
            }}
            onToggleTask={toggleTaskStatus}
          />
        ) : (
          <TickTickMainPane
            activeList={activeList}
            lists={lists}
            tasks={currentListTasks}
            selectedTaskId={selectedTaskId}
            viewMode={viewMode}
            quickAddNonce={quickAddNonce}
            onViewModeChange={setViewMode}
            onSelectTask={setSelectedTaskId}
            onToggleTask={toggleTaskStatus}
            onAddTask={(title, listId, time) => addTask(title, listId, time)}
            onToggleSidebar={() => setSidebarOpen(value => !value)}
            onReorderTasks={reorderTasks}
            onMoveStatus={moveTaskToStatus}
          />
        )}

        {selectedTask && <TickTickDetailPane
          task={selectedTask}
          lists={lists}
          onUpdateTask={updateTask}
          onToggleTask={toggleTaskStatus}
          onDeleteTask={deleteTask}
          onRestoreTask={restoreTask}
          onPermanentlyDeleteTask={permanentlyDeleteTask}
          onToggleSubtask={toggleSubTask}
          onAddSubtask={addSubTask}
          onDeleteSubtask={deleteSubTask}
          onClose={() => setSelectedTaskId(null)}
        />}
      </div>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        tasks={tasks.filter(task => !task.deletedAt)}
        onSelectTask={(task) => { setSelectedTaskId(task.id); setActiveTab('tasks'); }}
        onSetViewMode={setViewMode}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onQuickAdd={() => { setActiveTab('tasks'); setQuickAddNonce(value => value + 1); }}
        onClearCompleted={clearCompleted}
        theme={theme}
      />
      {notificationsOpen && <NotificationPanel
        notifications={notifications}
        isLoading={notificationsLoading}
        onClose={() => setNotificationsOpen(false)}
        onEnableBrowserNotifications={() => {
          if (!('Notification' in window)) return showToast('Trình duyệt không hỗ trợ thông báo.', 'warning');
          void window.Notification.requestPermission().then(permission => showToast(permission === 'granted' ? 'Đã bật thông báo trình duyệt.' : 'Quyền thông báo chưa được cấp.', permission === 'granted' ? 'success' : 'warning'));
        }}
        onMarkAllRead={() => void apiService.markAllNotificationsRead().then(() => setNotifications(items => items.map(item => ({ ...item, readAt: item.readAt || new Date().toISOString() }))))}
        onSelect={(item) => {
          if (item.taskId) { setSelectedTaskId(item.taskId); setActiveTab('tasks'); }
          void apiService.markNotificationRead(item.id).then(updated => setNotifications(values => values.map(value => value.id === updated.id ? updated : value)));
          setNotificationsOpen(false);
        }}
      />}
      {accountOpen && session && <AccountPanel
        session={session}
        onClose={() => setAccountOpen(false)}
        onUserUpdated={onUserUpdated}
        onLogout={onExit}
        onAccountDeleted={onExit}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onWorkspaceChange={(workspaceId) => { setActiveWorkspaceId(workspaceId); setSelectedTaskId(null); setActiveList('inbox'); }}
        onWorkspacesChange={setWorkspaces}
      />}
    </div>
  );
}

export function App() {
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession());
  const [sessionRestoring, setSessionRestoring] = useState(() => !authService.getSession());
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    if (session) { setSessionRestoring(false); return; }
    let active = true;
    void authService.restore().then(restored => {
      if (active && restored) setSession(restored);
    }).finally(() => { if (active) setSessionRestoring(false); });
    return () => { active = false; };
  }, [session]);

  if (sessionRestoring && !offlineMode) {
    return <div className="auth-loading" role="status">Đang khôi phục phiên đăng nhập…</div>;
  }

  if (!session && !offlineMode) {
    return <AuthScreen onAuthenticated={setSession} onOffline={() => setOfflineMode(true)} />;
  }

  const exitWorkspace = async () => {
    if (session) await authService.logout();
    setSession(null);
    setOfflineMode(false);
  };

  return (
    <TaskWorkspace
      key={session?.user.id || 'offline'}
      session={session}
      onExit={() => void exitWorkspace()}
      onUserUpdated={(user) => setSession(current => current ? { ...current, user } : current)}
    />
  );
}

export default App;
