// Script to generate a bcrypt hash for a password
const bcrypt = require('bcryptjs');

async function generateHash(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log(`Password: ${password}`);
  console.log(`Bcrypt Hash: ${hash}`);
  return hash;
}

// Generate hash for 'Admin@123'
generateHash('Admin@123');
