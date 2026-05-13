const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('/app/data/nexlab.db');

// Hash password
const hash = bcrypt.hashSync('admin123', 12);

// Insert admin user
const stmt = db.prepare(`
  INSERT INTO users (
    id, name, email, password, role, active, createdAt, updatedAt
  ) VALUES (
    lower(hex(randomblob(4))) || '-' || 
    lower(hex(randomblob(2))) || '-' || 
    lower(hex(randomblob(2))) || '-' || 
    lower(hex(randomblob(2))) || '-' || 
    lower(hex(randomblob(6))),
    ?, ?, ?, 'ADMIN', 1, datetime('now'), datetime('now')
  )
`);

stmt.run('Administrateur', 'admin@nexlab.local', hash);

// Confirm insertion
const users = db.prepare('SELECT email, role FROM users').all();
console.log('Users:', users);

db.close();   
