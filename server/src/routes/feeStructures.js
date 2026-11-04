import { Router } from 'express';
import { FeeStructure, StudentFee } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncH, HttpError } from '../utils.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

const pick = ({ name, amount, course, academicYear, dueDate }) => ({ name, amount, course, academicYear, dueDate });

router.get('/', asyncH(async (req, res) => res.json(await FeeStructure.find().sort({ dueDate: -1 }))));

router.post('/', asyncH(async (req, res) => res.status(201).json(await FeeStructure.create(pick(req.body)))));

router.put('/:id', asyncH(async (req, res) => {
  const fs = await FeeStructure.findById(req.params.id);
  if (!fs) throw new HttpError(404, 'Fee not found.');
  Object.assign(fs, pick(req.body));
  res.json(await fs.save());
}));

router.delete('/:id', asyncH(async (req, res) => {
  if (await StudentFee.exists({ feeStructure: req.params.id })) {
    throw new HttpError(400, 'This fee is already assigned to students, so it cannot be deleted.');
  }
  await FeeStructure.deleteOne({ _id: req.params.id });
  res.json({ message: 'Fee deleted.' });
}));

export default router;
