const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJSON(file) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, '[]', 'utf-8');
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (err) {
    console.error(`[DB] Failed to parse ${file}, resetting to empty:`, err.message);
    fs.writeFileSync(p, '[]', 'utf-8');
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
