const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(file) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) {
    try {
      fs.writeFileSync(p, '[]', 'utf-8');
    } catch (err) {
      console.error(`[DB] Failed to create ${file}:`, err.message);
    }
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`[DB] Failed to parse ${file}, resetting to empty array:`, err.message);
    try {
      fs.writeFileSync(p, '[]', 'utf-8');
    } catch (writeErr) {
      console.error(`[DB] Failed to reset ${file}:`, writeErr.message);
    }
    return [];
  }
}

function writeJSON(file, data) {
  const p = path.join(DATA_DIR, file);
  const tmp = p + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, p);
  } catch (err) {
    console.error(`[DB] Failed to write ${file}:`, err.message);
    throw err;
  }
}

module.exports = { readJSON, writeJSON };
