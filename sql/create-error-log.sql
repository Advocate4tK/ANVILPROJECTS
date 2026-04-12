-- Error log table for referee tool
-- Run in Supabase SQL Editor
-- Replaces console.error() with persistent queryable log

CREATE TABLE IF NOT EXISTS error_log (
    id          serial PRIMARY KEY,
    created_at  timestamptz DEFAULT now(),
    page        text,
    function    text,
    error_msg   text,
    context     text,
    user_name   text,
    severity    text DEFAULT 'error'
);

-- Query to review errors:
-- SELECT * FROM error_log ORDER BY created_at DESC LIMIT 50;
