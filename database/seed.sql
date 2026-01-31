-- Responsibility: Example seed SQL to create `users` table and insert test rows
BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- sample data
INSERT INTO users (name, email) VALUES
('Alice Example','alice@example.test') ON CONFLICT DO NOTHING,
('Bob Example','bob@example.test') ON CONFLICT DO NOTHING;

COMMIT;

-- Teardown (use to clear table in tests if desired):
-- TRUNCATE TABLE users RESTART IDENTITY CASCADE;
