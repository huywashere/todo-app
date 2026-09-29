CREATE TABLE app_users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(32) NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE refresh_tokens (
    id VARCHAR(64) PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id VARCHAR(64) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

CREATE TABLE task_lists (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    emoji VARCHAR(16),
    color VARCHAR(32),
    has_dot BOOLEAN,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_task_lists_owner_id ON task_lists(owner_id);

CREATE TABLE tasks (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    client_request_id VARCHAR(120),
    version BIGINT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL,
    priority VARCHAR(32) NOT NULL,
    list_id VARCHAR(64),
    time VARCHAR(32),
    due_date VARCHAR(32),
    date_label VARCHAR(64),
    recurrence_rule VARCHAR(32),
    reminder_at TIMESTAMP,
    sort_order INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT uk_tasks_owner_client_request UNIQUE (owner_id, client_request_id)
);

CREATE INDEX idx_tasks_owner_active ON tasks(owner_id, deleted_at, sort_order);
CREATE INDEX idx_tasks_owner_list ON tasks(owner_id, list_id);
CREATE INDEX idx_tasks_owner_status ON tasks(owner_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(owner_id, due_date);

CREATE TABLE task_tags (
    task_id VARCHAR(64) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag VARCHAR(64)
);

CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);

CREATE TABLE sub_tasks (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN NOT NULL,
    task_id VARCHAR(64) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_sub_tasks_task_id ON sub_tasks(task_id);
