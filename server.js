import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { db, migrate } from './db.js';
import { createToken, authMiddleware, requireRole, Users } from './auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

migrate();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ ok: true }));

// Auth
app.post('/auth/register', (req, res) => {
  const { fullName, email, password } = req.body || {};
  if (!fullName || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (Users.findByEmail(email)) return res.status(409).json({ error: 'Email exists' });
  const user = Users.create({ fullName, email, password, status: 'pending' });
  res.json({ user: { id: user.id, fullName: user.full_name, email: user.email, status: user.status } });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = Users.findByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  import('bcryptjs').then(({ default: bcrypt }) => {
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = createToken({ id: user.id, email: user.email });
    res.json({ token });
  });
});

// Admin approves user and assigns role
app.post('/admin/approve', authMiddleware(true), requireRole('Admin'), (req, res) => {
  const { userId, roleName } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run('active', userId);
  const role = db.prepare('SELECT * FROM roles WHERE name = ?').get(roleName);
  if (!role) return res.status(400).json({ error: 'Invalid role' });
  db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, role.id);
  res.json({ ok: true });
});

// Events (Secretary/Admin can create)
app.post('/events', authMiddleware(true), requireRole(['Secretary','Admin']), (req, res) => {
  const { title, startsAt, location } = req.body || {};
  const info = db.prepare('INSERT INTO events (title, starts_at, location, created_by) VALUES (?,?,?,?)')
    .run(title, startsAt, location, req.user.id);
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid);
  res.json(event);
});

app.get('/events', (req, res) => {
  const rows = db.prepare('SELECT * FROM events ORDER BY starts_at DESC').all();
  res.json(rows);
});

// Sermons (Pastor/Admin add)
app.post('/sermons', authMiddleware(true), requireRole(['Pastor','Admin']), (req, res) => {
  const { title, speaker, videoUrl, audioUrl } = req.body || {};
  const info = db.prepare('INSERT INTO sermons (title, speaker, video_url, audio_url, created_by) VALUES (?,?,?,?,?)')
    .run(title, speaker, videoUrl, audioUrl, req.user.id);
  const sermon = db.prepare('SELECT * FROM sermons WHERE id = ?').get(info.lastInsertRowid);
  res.json(sermon);
});

app.get('/sermons', (req, res) => {
  const rows = db.prepare('SELECT * FROM sermons ORDER BY created_at DESC').all();
  res.json(rows);
});

// Donations (public record)
app.post('/donations', (req, res) => {
  const { userId, amount, type, method } = req.body || {};
  const info = db.prepare('INSERT INTO donations (user_id, amount, type, method) VALUES (?,?,?,?)')
    .run(userId || null, amount, type, method);
  const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(info.lastInsertRowid);
  res.json(donation);
});

app.get('/donations', authMiddleware(true), requireRole(['Admin','Pastor']), (req, res) => {
  const rows = db.prepare('SELECT * FROM donations ORDER BY created_at DESC').all();
  res.json(rows);
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));


