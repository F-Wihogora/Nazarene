import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return required ? res.status(401).json({ error: 'Unauthorized' }) : next();
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

export function requireRole(roleNames) {
  const names = Array.isArray(roleNames) ? roleNames : [roleNames];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const q = db.prepare(`
      SELECT r.name FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `);
    const rows = q.all(req.user.id);
    const userRoles = rows.map(r => r.name);
    const ok = names.some(n => userRoles.includes(n));
    if (!ok) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export const Users = {
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },
  create({ fullName, email, password, status = 'pending' }) {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (full_name, email, password_hash, status) VALUES (?, ?, ?, ?)');
    const info = stmt.run(fullName, email, hash, status);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  }
};


