const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { ValidationError, UnauthorizedError, ConflictError } = require('../utils/errors');
const { createUser, findUserByEmail } = require('../repositories/userRepository');

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

async function registerUser(input) {
  if (!input.email || !input.password || !input.name) {
    throw new ValidationError('Name, email, and password are required');
  }

  const email = normalizeEmail(input.email);
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new ConflictError('User with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await createUser({
    name: input.name.trim(),
    email,
    passwordHash,
    role: input.role || 'HR'
  });

  const token = jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, jwtSecret, { expiresIn: '1h' });
  return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token };
}

async function loginUser(input) {
  const email = normalizeEmail(input.email);
  const user = await findUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, jwtSecret, { expiresIn: '1h' });
  return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token };
}

module.exports = { registerUser, loginUser };
