import { useTasks } from './hooks/useTasks';
import { TickTickRail } from './components/TickTickRail';
import { TickTickSidebar } from './components/TickTickSidebar';
import { TickTickMainPane } from './components/TickTickMainPane';
import { TickTickDetailPane } from './components/TickTickDetailPane';
import { TickTickCalendarView } from './components/TickTickCalendarView';
import { ToastContainer } from './components/ToastContainer';
import './App.css';

export function App() {
  const {
    tasks,
    lists,
    activeTab,
    activeList,
    selectedTaskId,
    selectedTask,
    theme,
    toasts,
    listCounts,
    currentListTasks,
    isBackendConnected,
    setActiveTab,
    setActiveList,
    setSelectedTaskId,
    setTheme,
    addTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    toggleSubTask,
    addSubTask,
    deleteSubTask,
    addList,
    removeToast,
    exportBackup
  } = useTasks();

  return (
    <div className="ticktick-app">
      <div className="ticktick-window">
        {/* 1. Left Icon Navigation Rail */}
        <TickTickRail
          activeTab={activeTab}
          onTabChange={setActiveTab}
          theme={theme}
          onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onSync={exportBackup}
          isBackendConnected={isBackendConnected}
        />

        {/* 2. Lists & Navigation Sidebar */}
        <TickTickSidebar
          activeList={activeList}
          onSelectList={(listId) => {
            setActiveList(listId);
            if (activeTab !== 'tasks') {
              setActiveTab('tasks');
            }
          }}
          lists={lists}
          counts={listCounts}
          onAddList={addList}
        />

        {/* 3. Center Main View: Tasks or Calendar */}
        {activeTab === 'calendar' ? (
          <TickTickCalendarView
            tasks={tasks}
            onSelectTask={(taskId) => {
              setSelectedTaskId(taskId);
              setActiveTab('tasks');
            }}
          />
        ) : (
          <TickTickMainPane
            activeList={activeList}
            lists={lists}
            tasks={currentListTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(taskId) => setSelectedTaskId(taskId)}
            onToggleTask={toggleTaskStatus}
            onAddTask={(title, listId, time) => {
              addTask(title, listId, time);
            }}
          />
        )}

        {/* 4. Right Task Detail Pane */}
        <TickTickDetailPane
          task={selectedTask}
          lists={lists}
          onUpdateTask={updateTask}
          onToggleTask={toggleTaskStatus}
          onDeleteTask={deleteTask}
          onToggleSubtask={toggleSubTask}
          onAddSubtask={addSubTask}
          onDeleteSubtask={deleteSubTask}
          onClose={() => setSelectedTaskId(null)}
        />
      </div>

      {/* Floating Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
