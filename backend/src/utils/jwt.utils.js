const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const generateAccessToken = (payload) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not defined');
  
  return jwt.sign(
    { ...payload, jti: uuidv4() },
    secret,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');
  
  return jwt.sign(
    { ...payload, jti: uuidv4() },
    secret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

const verifyAccessToken = (token) => {
  try {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error('JWT_ACCESS_SECRET is not defined');
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded?.exp) return null;
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getTokenExpiry,
};