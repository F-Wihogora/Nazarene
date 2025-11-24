import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbFile = process.env.DB_FILE || path.resolve('backend/data/app.db');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

export const db = new Database(dbFile);

db.pragma('journal_mode = WAL');

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_email_verified INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      starts_at DATETIME NOT NULL,
      location TEXT,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sermons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      speaker TEXT,
      video_url TEXT,
      audio_url TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount REAL NOT NULL,
      type TEXT,
      method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed roles
  const roleNames = [
    'Admin','Pastor','Secretary','Choir Leader','Choir Member','Media Team','Advisor','Member'
  ];
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name) VALUES (?)');
  roleNames.forEach((r) => insertRole.run(r));
}


