import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { asyncH } from '../utils.js';

export const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

export const requireAuth = asyncH(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in.' });
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return res.status(401).json({ message: 'Your session has expired. Log in again.' }); }
  const user = await User.findById(payload.id);
  if (!user || !user.active) return res.status(401).json({ message: 'This account was not found or is disabled.' });
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have access to this.' });
