-- Add tsvector columns and GIN indexes for full-text search

-- ─── TASKS ────────────────────────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing rows
UPDATE tasks 
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
WHERE search_vector IS NULL;

-- Create GIN index for fast search
CREATE INDEX IF NOT EXISTS idx_tasks_search_vector 
  ON tasks USING GIN (search_vector);

-- Trigger to keep search_vector in sync on insert/update
CREATE OR REPLACE FUNCTION tasks_search_vector_update() 
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_search_vector_trigger ON tasks;
CREATE TRIGGER tasks_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION tasks_search_vector_update();

-- ─── PROJECTS ──────────────────────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE projects 
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_search_vector 
  ON projects USING GIN (search_vector);

CREATE OR REPLACE FUNCTION projects_search_vector_update() 
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_search_vector_trigger ON projects;
CREATE TRIGGER projects_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, description ON projects
  FOR EACH ROW
  EXECUTE FUNCTION projects_search_vector_update();

-- ─── COMMENTS ──────────────────────────────────────
ALTER TABLE comments ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE comments 
SET search_vector = to_tsvector('english', COALESCE(content, ''))
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_comments_search_vector 
  ON comments USING GIN (search_vector);

CREATE OR REPLACE FUNCTION comments_search_vector_update() 
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_search_vector_trigger ON comments;
CREATE TRIGGER comments_search_vector_trigger
  BEFORE INSERT OR UPDATE OF content ON comments
  FOR EACH ROW
  EXECUTE FUNCTION comments_search_vector_update();