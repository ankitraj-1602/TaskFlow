CREATE TABLE IF NOT EXISTS mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_mentions_comment_id ON mentions(comment_id);
CREATE INDEX idx_mentions_user_id ON mentions(user_id);