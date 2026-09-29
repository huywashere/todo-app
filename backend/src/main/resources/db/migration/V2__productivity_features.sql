ALTER TABLE app_users ADD COLUMN timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh';
ALTER TABLE app_users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE tasks ADD COLUMN assignee_email VARCHAR(190);
ALTER TABLE tasks ADD COLUMN reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN recurrence_series_id VARCHAR(64);
ALTER TABLE tasks ADD COLUMN recurrence_parent_id VARCHAR(64);
ALTER TABLE tasks ADD COLUMN next_occurrence_generated BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE tasks
SET assignee_email = (
    SELECT email FROM app_users WHERE app_users.id = tasks.owner_id
)
WHERE assignee_email IS NULL;

CREATE INDEX idx_tasks_assignee_email ON tasks(assignee_email, deleted_at);
CREATE UNIQUE INDEX uk_tasks_recurrence_parent ON tasks(recurrence_parent_id)
    WHERE recurrence_parent_id IS NOT NULL;
CREATE INDEX idx_tasks_due_reminders ON tasks(reminder_sent, reminder_at)
    WHERE reminder_at IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE task_notifications (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    task_id VARCHAR(64) REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(500) NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_notifications_owner_created ON task_notifications(owner_id, created_at DESC);

CREATE TABLE focus_sessions (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    task_id VARCHAR(64) REFERENCES tasks(id) ON DELETE SET NULL,
    duration_seconds INTEGER NOT NULL,
    completed_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_focus_sessions_owner_completed ON focus_sessions(owner_id, completed_at DESC);

CREATE TABLE account_tokens (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    token_type VARCHAR(32) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_account_tokens_user_type ON account_tokens(user_id, token_type);
