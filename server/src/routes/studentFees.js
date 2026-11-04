import { Router } from 'express';
import { Student, FeeStructure, StudentFee, statusOf } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncH, HttpError } from '../utils.js';
import { recordPayment } from '../services/payments.js';

const router = Router();
router.use(requireAuth);

export const withStudent = { path: 'student', select: 'rollNo course user', populate: { path: 'user', select: 'name email' } };

router.get('/', asyncH(async (req, res) => {
  const q = {};
  if (req.query.status) q.status = req.query.status;
  if (req.query.open) q.status = { $ne: 'paid' };
  if (req.user.role === 'student') {
    const me = await Student.findOne({ user: req.user._id });
    if (!me) return res.json([]);
    q.student = me._id;
  } else if (req.query.student) {
    q.student = req.query.student;
  }
  res.json(await StudentFee.find(q).sort({ dueDate: 1 }).populate(withStudent));
}));

router.post('/assign', requireRole('admin'), asyncH(async (req, res) => {
  const { feeStructureId, studentIds, discount = 0 } = req.body;
  const structure = await FeeStructure.findById(feeStructureId);
  if (!structure) throw new HttpError(404, 'Fee not found.');
  const disc = Number(discount) || 0;
  if (disc < 0 || disc > structure.amount) throw new HttpError(400, 'The discount must be between 0 and the fee amount.');

  const targets = studentIds?.length
    ? await Student.find({ _id: { $in: studentIds } })
    : await Student.find({ course: structure.course });
  if (!targets.length) throw new HttpError(400, 'No students to assign this fee to.');

  const existing = await StudentFee.find({ feeStructure: structure._id, student: { $in: targets.map((s) => s._id) } }).distinct('student');
  const have = new Set(existing.map(String));
  const docs = targets.filter((s) => !have.has(String(s._id))).map((s) => ({
    student: s._id, feeStructure: structure._id, title: structure.name,
    amountDue: structure.amount, discount: disc, dueDate: structure.dueDate,
    status: structure.amount - disc < 0.005 ? 'paid' : 'pending',
  }));
  if (docs.length) await StudentFee.insertMany(docs);
  res.status(201).json({ assigned: docs.length, skipped: targets.length - docs.length });
}));

router.patch('/:id/discount', requireRole('admin'), asyncH(async (req, res) => {
  const sf = await StudentFee.findById(req.params.id);
  if (!sf) throw new HttpError(404, 'Fee not found.');
  const disc = Number(req.body.discount);
  if (!(disc >= 0)) throw new HttpError(400, 'Enter a discount of zero or more.');
  if (sf.amountDue - disc < sf.paidAmount) throw new HttpError(400, 'The discount is too large: the student has already paid more than the new total.');
  sf.discount = disc;
  sf.status = statusOf(sf);
  res.json(await sf.save());
}));

// Student online payment simulation (UPI / Card / NetBanking)
router.post('/:id/pay-online', asyncH(async (req, res) => {
  const sf = await StudentFee.findById(req.params.id);
  if (!sf) throw new HttpError(404, 'Student fee record not found.');

  if (req.user.role === 'student') {
    const me = await Student.findOne({ user: req.user._id });
    if (!me || String(sf.student) !== String(me._id)) {
      throw new HttpError(403, 'You are not authorized to pay this fee.');
    }
  }

  const { amount, method = 'upi', referenceNo } = req.body;
  const payAmount = Number(amount);
  if (!(payAmount > 0)) throw new HttpError(400, 'Enter a valid payment amount.');
  if (payAmount > sf.balance + 0.005) {
    throw new HttpError(400, `Amount cannot exceed the current balance of ₹${sf.balance}.`);
  }

  const generatedRef = referenceNo || `ONLINE-${method.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const payment = await recordPayment({
    studentFeeId: sf._id,
    amount: payAmount,
    method,
    referenceNo: generatedRef,
    paidOn: new Date(),
    note: `Online payment via student portal (${method.toUpperCase()})`,
    receivedBy: req.user._id,
  });

  const updatedSf = await StudentFee.findById(sf._id).populate(withStudent);
  res.status(201).json({ payment, studentFee: updatedSf, message: 'Payment processed successfully!' });
}));

export default router;
