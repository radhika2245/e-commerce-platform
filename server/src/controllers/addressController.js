const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../config/db');

const USERS_FILE = 'users.json';

function getAddresses(req, res) {
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.addresses || []);
}

function addAddress(req, res) {
  const { label, name, phone, street, city, state, pincode, isDefault } = req.body;
  if (!name || !phone || !street || !city || !state || !pincode) {
    return res.status(400).json({ error: 'All address fields are required' });
  }
  const users = readJSON(USERS_FILE);
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (!users[idx].addresses) users[idx].addresses = [];
  const address = {
    id: uuidv4(),
    label: String(label || 'Home').slice(0, 20),
    name: String(name).trim().slice(0, 100),
    phone: String(phone).trim().slice(0, 15),
    street: String(street).trim().slice(0, 200),
    city: String(city).trim().slice(0, 100),
    state: String(state).trim().slice(0, 100),
    pincode: String(pincode).trim().slice(0, 10),
    isDefault: !!isDefault,
  };
  if (address.isDefault) {
    users[idx].addresses.forEach(a => a.isDefault = false);
  }
  users[idx].addresses.push(address);
  writeJSON(USERS_FILE, users);
  res.status(201).json(address);
}

function updateAddress(req, res) {
  const { label, name, phone, street, city, state, pincode, isDefault } = req.body;
  const users = readJSON(USERS_FILE);
  const uIdx = users.findIndex(u => u.id === req.user.id);
  if (uIdx === -1) return res.status(404).json({ error: 'User not found' });
  const aIdx = (users[uIdx].addresses || []).findIndex(a => a.id === req.params.id);
  if (aIdx === -1) return res.status(404).json({ error: 'Address not found' });
  const addr = users[uIdx].addresses[aIdx];
  if (label !== undefined) addr.label = String(label).slice(0, 20);
  if (name !== undefined) addr.name = String(name).trim().slice(0, 100);
  if (phone !== undefined) addr.phone = String(phone).trim().slice(0, 15);
  if (street !== undefined) addr.street = String(street).trim().slice(0, 200);
  if (city !== undefined) addr.city = String(city).trim().slice(0, 100);
  if (state !== undefined) addr.state = String(state).trim().slice(0, 100);
  if (pincode !== undefined) addr.pincode = String(pincode).trim().slice(0, 10);
  if (isDefault) {
    users[uIdx].addresses.forEach(a => a.isDefault = false);
    addr.isDefault = true;
  }
  writeJSON(USERS_FILE, users);
  res.json(addr);
}

function deleteAddress(req, res) {
  const users = readJSON(USERS_FILE);
  const uIdx = users.findIndex(u => u.id === req.user.id);
  if (uIdx === -1) return res.status(404).json({ error: 'User not found' });
  users[uIdx].addresses = (users[uIdx].addresses || []).filter(a => a.id !== req.params.id);
  writeJSON(USERS_FILE, users);
  res.json({ message: 'Address deleted' });
}

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };
