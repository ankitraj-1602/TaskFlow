CREATE TYPE action_type AS ENUM (
    'CREATED', 'UPDATED', 'DELETED', 'ASSIGNED', 'REASSIGNED',
    'STATUS_CHANGED', 'PRIORITY_CHANGED', 'COMMENTED', 'MENTIONED',
    'ATTACHED', 'MOVED', 'COMPLETED', 'ARCHIVED', 'RESTORED'
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action action_type NOT NULL,
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_workspace_id ON activity_logs(workspace_id);
CREATE INDEX idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_task_id ON activity_logs(task_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);