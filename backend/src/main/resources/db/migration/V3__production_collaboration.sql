ALTER TABLE app_users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE app_users ADD COLUMN locked_until TIMESTAMP;

ALTER TABLE refresh_tokens ADD COLUMN device_name VARCHAR(120);
ALTER TABLE refresh_tokens ADD COLUMN user_agent VARCHAR(500);
ALTER TABLE refresh_tokens ADD COLUMN ip_address VARCHAR(64);
ALTER TABLE refresh_tokens ADD COLUMN last_used_at TIMESTAMP;

CREATE TABLE workspaces (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    owner_id VARCHAR(64) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE workspace_members (
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    joined_at TIMESTAMP NOT NULL,
    PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

INSERT INTO workspaces (id, name, owner_id, created_at)
SELECT 'personal-' || id, display_name || '''s Workspace', id, created_at FROM app_users;

INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
SELECT 'personal-' || id, id, 'OWNER', created_at FROM app_users;

ALTER TABLE task_lists ADD COLUMN workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE;

UPDATE task_lists SET workspace_id = 'personal-' || owner_id WHERE workspace_id IS NULL;
UPDATE tasks SET workspace_id = 'personal-' || owner_id WHERE workspace_id IS NULL;

CREATE INDEX idx_lists_workspace ON task_lists(workspace_id);
CREATE INDEX idx_tasks_workspace_active ON tasks(workspace_id, deleted_at, sort_order);

ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tasks ADD COLUMN recurrence_end_date VARCHAR(32);

CREATE TABLE task_comments (
    id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id VARCHAR(64) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    body VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_comments_task_created ON task_comments(task_id, created_at);

CREATE TABLE task_activities (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    task_id VARCHAR(64) REFERENCES tasks(id) ON DELETE CASCADE,
    actor_id VARCHAR(64) REFERENCES app_users(id) ON DELETE SET NULL,
    action VARCHAR(80) NOT NULL,
    details VARCHAR(1000),
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_activity_workspace_created ON task_activities(workspace_id, created_at DESC);
CREATE INDEX idx_activity_task_created ON task_activities(task_id, created_at DESC);

CREATE TABLE task_attachments (
    id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    uploader_id VARCHAR(64) REFERENCES app_users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(160),
    size_bytes BIGINT NOT NULL,
    storage_key VARCHAR(500) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_attachments_task ON task_attachments(task_id, created_at);
