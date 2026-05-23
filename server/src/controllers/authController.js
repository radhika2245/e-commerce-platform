const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../config/db');
const { generateToken } = require('../middleware/auth');

const USERS_FILE = 'users.json';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return null;
}

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim().slice(0, 200);
}

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input types' });
  }
  if (name.length > 100 || email.length > 200 || password.length > 128) {
    return res.status(400).json({ error: 'Input exceeds maximum length' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  const users = readJSON(USERS_FILE);
  if (users.find(u => u.email === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = {
    id: uuidv4(),
    name: sanitize(name),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeJSON(USERS_FILE, users);

  const token = generateToken(user);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || '' },
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input types' });
  }

  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.email === email.toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || '' },
  });
}

function getProfile(req, res) {
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || '' });
}

async function updateProfile(req, res) {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const users = readJSON(USERS_FILE);
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users[idx].name = name.trim();
  writeJSON(USERS_FILE, users);
  res.json({ id: users[idx].id, name: users[idx].name, email: users[idx].email, role: users[idx].role, avatar: users[idx].avatar || '' });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const users = readJSON(USERS_FILE);
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const valid = await bcrypt.compare(currentPassword, users[idx].password);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  users[idx].password = await bcrypt.hash(newPassword, 12);
  writeJSON(USERS_FILE, users);
  res.json({ message: 'Password updated successfully' });
}

module.exports = { register, login, getProfile, updateProfile, changePassword };
