import { Router } from 'express';
import { StudentFee, Payment } from '../models/index.js';
import { withStudent } from './studentFees.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncH } from '../utils.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

const net = { $subtract: ['$amountDue', '$discount'] };
const sumPayments = async (match) => (await Payment.aggregate([{ $match: match }, { $group: { _id: null, t: { $sum: '$amount' } } }]))[0]?.t || 0;

router.get('/dashboard', asyncH(async (req, res) => {
  const [totals] = await StudentFee.aggregate([{ $group: { _id: null, billed: { $sum: net }, collected: { $sum: '$paidAmount' } } }]);
  const byStatus = await StudentFee.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  const counts = { pending: 0, partial: 0, paid: 0 };
  byStatus.forEach((s) => { counts[s._id] = s.n; });
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const billed = totals?.billed || 0;
  const collected = totals?.collected || 0;
  res.json({
    billed, collected, outstanding: Math.round((billed - collected) * 100) / 100, counts,
    overdueCount: await StudentFee.countDocuments({ status: { $ne: 'paid' }, dueDate: { $lt: now } }),
    today: await sumPayments({ paidOn: { $gte: startOfDay } }),
    thisMonth: await sumPayments({ paidOn: { $gte: startOfMonth } }),
    recent: await Payment.find().sort({ paidOn: -1, createdAt: -1 }).limit(6).populate(withStudent).populate('studentFee', 'title'),
  });
}));

router.get('/dues', asyncH(async (req, res) => {
  const rows = await StudentFee.aggregate([
    { $match: { status: { $ne: 'paid' } } },
    { $group: { _id: '$student', balance: { $sum: { $subtract: [net, '$paidAmount'] } }, items: { $sum: 1 }, oldestDue: { $min: '$dueDate' } } },
    { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 's' } }, { $unwind: '$s' },
    { $lookup: { from: 'users', localField: 's.user', foreignField: '_id', as: 'u' } }, { $unwind: '$u' },
    ...(req.query.course ? [{ $match: { 's.course': req.query.course } }] : []),
    { $project: { _id: 0, studentId: '$_id', name: '$u.name', rollNo: '$s.rollNo', course: '$s.course', phone: '$s.phone', balance: 1, items: 1, oldestDue: 1 } },
    { $sort: { balance: -1 } },
  ]);
  res.json(rows);
}));

router.get('/collection', asyncH(async (req, res) => {
  const { from, to, groupBy = 'day' } = req.query;
  const match = {};
  if (from || to) {
    match.paidOn = {};
    if (from) match.paidOn.$gte = new Date(from);
    if (to) { const e = new Date(to); e.setHours(23, 59, 59, 999); match.paidOn.$lte = e; }
  }
  const format = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
  const rows = await Payment.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format, date: '$paidOn' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $project: { _id: 0, period: '$_id', total: 1, count: 1 } }, { $sort: { period: 1 } },
  ]);
  const byMethod = await Payment.aggregate([
    { $match: match },
    { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $project: { _id: 0, method: '$_id', total: 1, count: 1 } }, { $sort: { total: -1 } },
  ]);
  res.json({ rows, byMethod, total: rows.reduce((a, r) => a + r.total, 0) });
}));

export default router;
