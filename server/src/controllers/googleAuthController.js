const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../config/db');
const { generateToken } = require('../middleware/auth');

const USERS_FILE = 'users.json';

async function googleLogin(req, res) {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Google authentication not configured' });
  }

  let payload;
  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Invalid Google credential' });
  }

  if (!payload || !payload.email) {
    return res.status(400).json({ error: 'Could not retrieve email from Google' });
  }

  const users = readJSON(USERS_FILE);
  let user = users.find(u => u.email === payload.email.toLowerCase());

  if (user) {
    const idx = users.findIndex(u => u.id === user.id);
    let updated = false;
    if (!user.googleId) {
      users[idx].googleId = payload.sub;
      updated = true;
    }
    if (payload.picture && user.avatar !== payload.picture) {
      users[idx].avatar = payload.picture;
      updated = true;
    }
    if (updated) {
      user = users[idx];
      writeJSON(USERS_FILE, users);
    }
  } else {
    user = {
      id: uuidv4(),
      name: payload.name || payload.given_name || 'Google User',
      email: payload.email.toLowerCase(),
      password: await bcrypt.hash(uuidv4() + Date.now(), 12),
      googleId: payload.sub,
      role: 'customer',
      avatar: payload.picture || '',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    writeJSON(USERS_FILE, users);
  }

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
}

module.exports = { googleLogin };
