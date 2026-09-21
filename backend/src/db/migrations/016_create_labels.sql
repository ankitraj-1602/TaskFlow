-- ─── Labels table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_labels_project_id ON labels(project_id);

-- ─── Task-Labels join table ──────────────────────────────
CREATE TABLE IF NOT EXISTS task_labels (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  added_by_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id);

-- ─── Trigger to auto-update `updated_at` ─────────────────
CREATE OR REPLACE FUNCTION update_labels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_labels_updated_at ON labels;
CREATE TRIGGER trigger_update_labels_updated_at
  BEFORE UPDATE ON labels
  FOR EACH ROW
  EXECUTE FUNCTION update_labels_updated_at();