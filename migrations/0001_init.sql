-- Draft submissions from the /submit/ form. Every row starts as a draft for
-- manual review — nothing here is ever auto-published to the content collection.
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_name TEXT NOT NULL,
  town TEXT NOT NULL,
  county TEXT NOT NULL,
  website TEXT NOT NULL,
  age_range TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('co-ed', 'boys', 'girls')),
  boarding TEXT NOT NULL CHECK (boarding IN ('day', 'boarding', 'day-and-boarding')),
  description TEXT NOT NULL,
  submitter_name TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions (created_at);
