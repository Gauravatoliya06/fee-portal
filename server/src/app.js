import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import feeStructureRoutes from './routes/feeStructures.js';
import studentFeeRoutes from './routes/studentFees.js';
import paymentRoutes from './routes/payments.js';
import reportRoutes from './routes/reports.js';

import { getDbInfo } from './db.js';

export const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({
  ok: true,
  name: 'Student Fee Portal API',
  school: process.env.SCHOOL_NAME || 'Fee Portal',
  db: getDbInfo(),
  timestamp: new Date().toISOString(),
}));
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/student-fees', studentFeeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(' ') });
  if (err.code === 11000) return res.status(409).json({ message: `That ${Object.keys(err.keyPattern || {})[0] || 'value'} is already in use.` });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id or value.' });
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});
