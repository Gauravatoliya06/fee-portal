import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { Student, Payment } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { recordPayment } from '../services/payments.js';
import { withStudent } from './studentFees.js';
import { asyncH, HttpError } from '../utils.js';

const router = Router();
router.use(requireAuth);

const dayEnd = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

router.get('/', asyncH(async (req, res) => {
  const q = {};
  if (req.query.method) q.method = req.query.method;
  if (req.query.from || req.query.to) {
    q.paidOn = {};
    if (req.query.from) q.paidOn.$gte = new Date(req.query.from);
    if (req.query.to) q.paidOn.$lte = dayEnd(req.query.to);
  }
  if (req.user.role === 'student') {
    const me = await Student.findOne({ user: req.user._id });
    if (!me) return res.json([]);
    q.student = me._id;
  } else if (req.query.student) {
    q.student = req.query.student;
  }
  res.json(await Payment.find(q).sort({ paidOn: -1, createdAt: -1 }).limit(300)
    .populate(withStudent).populate('studentFee', 'title').populate('receivedBy', 'name'));
}));

router.post('/', requireRole('admin'), asyncH(async (req, res) => {
  const payment = await recordPayment({ ...req.body, receivedBy: req.user._id });
  res.status(201).json(payment);
}));

router.get('/:id/receipt', asyncH(async (req, res) => {
  const p = await Payment.findById(req.params.id)
    .populate(withStudent).populate('studentFee', 'title').populate('receivedBy', 'name');
  if (!p) throw new HttpError(404, 'Receipt not found.');
  if (req.user.role === 'student') {
    const me = await Student.findOne({ user: req.user._id });
    if (!me || !p.student._id.equals(me._id)) throw new HttpError(403, 'You do not have access to this receipt.');
  }

  const doc = new PDFDocument({ size: 'A5', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${p.receiptNo}.pdf"`);
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(16).text(process.env.SCHOOL_NAME || 'Student Fee Portal', { align: 'center' });
  doc.moveDown(0.2).font('Helvetica').fontSize(10).fillColor('#555').text('Fee receipt', { align: 'center' });
  doc.moveDown(1).fillColor('#000');

  const rows = [
    ['Receipt no.', p.receiptNo],
    ['Date', new Date(p.paidOn).toLocaleDateString('en-GB')],
    ['Student', p.student.user.name],
    ['Roll no.', p.student.rollNo],
    ['Course', p.student.course],
    ['Fee', p.studentFee.title],
    ['Method', p.method.replace('_', ' ')],
    ['Reference', p.referenceNo || '-'],
  ];
  for (const [k, v] of rows) {
    const y = doc.y;
    doc.font('Helvetica').fontSize(10).fillColor('#666').text(k, 40, y, { width: 100 });
    doc.fillColor('#000').text(String(v), 145, y, { width: doc.page.width - 185 });
    doc.moveDown(0.35);
  }
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#bbb').stroke();
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(14).text(`Amount paid: Rs. ${p.amount.toFixed(2)}`, 40);
  doc.font('Helvetica').fontSize(10).fillColor('#444').text(`Balance after this payment: Rs. ${p.balanceAfter.toFixed(2)}`);
  doc.moveDown(2).fontSize(9).fillColor('#777').text(`Received by ${p.receivedBy?.name || 'accounts office'}. This is a computer-generated receipt.`);
  doc.end();
}));

export default router;
