CREATE TABLE IF NOT EXISTS user_profiles (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_roman TEXT,
  company TEXT NOT NULL,
  title TEXT,
  phone TEXT,
  self_email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS business_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  name TEXT,
  name_kana TEXT,
  company TEXT,
  department TEXT,
  title TEXT,
  phone TEXT,
  phone_mobile TEXT,
  fax TEXT,
  email TEXT,
  website TEXT,
  postal_code TEXT,
  address TEXT,
  note TEXT,
  raw_ocr_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cards_user ON business_cards(user_email);
