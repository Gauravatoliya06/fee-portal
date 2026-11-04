import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, Student, StudentFee } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncH, HttpError } from '../utils.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', asyncH(async (req, res) => {
  const q = req.query.course ? { course: req.query.course } : {};
  const list = await Student.find(q).sort({ rollNo: 1 }).populate('user', 'name email active');
  res.json(list);
}));

router.post('/', asyncH(async (req, res) => {
  const { name, email, password, rollNo, course, guardianName, phone } = req.body;
  if (!rollNo) throw new HttpError(400, 'Roll number is required.');
  const pw = password || String(rollNo);
  if (pw.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
  const user = await User.create({ name, email, role: 'student', passwordHash: await bcrypt.hash(pw, 10) });
  try {
    const student = await Student.create({ user: user._id, rollNo, course, guardianName, phone });
    res.status(201).json(await student.populate('user', 'name email active'));
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }
}));

router.put('/:id', asyncH(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new HttpError(404, 'Student not found.');
  const { name, email, rollNo, course, guardianName, phone } = req.body;
  Object.assign(student, { rollNo, course, guardianName, phone });
  await student.save();
  await User.findByIdAndUpdate(student.user, { name, email }, { runValidators: true });
  res.json(await student.populate('user', 'name email active'));
}));

router.delete('/:id', asyncH(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new HttpError(404, 'Student not found.');
  if (await StudentFee.exists({ student: student._id })) {
    throw new HttpError(400, 'This student has fees on record, so they cannot be deleted.');
  }
  await User.deleteOne({ _id: student.user });
  await student.deleteOne();
  res.json({ message: 'Student deleted.' });
}));

export default router;
