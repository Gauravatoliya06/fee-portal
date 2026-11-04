import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const ref = (name, extra = {}) => ({ type: Schema.Types.ObjectId, ref: name, ...extra });

export const METHODS = ['cash', 'upi', 'cheque', 'bank_transfer', 'card'];

export const User = model('User', new Schema({
  name: { type: String, required: [true, 'Name is required.'], trim: true },
  email: { type: String, required: [true, 'Email is required.'], unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  active: { type: Boolean, default: true },
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true }));

export const Student = model('Student', new Schema({
  user: ref('User', { required: true, unique: true }),
  rollNo: { type: String, required: [true, 'Roll number is required.'], unique: true, trim: true },
  course: { type: String, required: [true, 'Course or class is required.'], trim: true },
  guardianName: { type: String, trim: true },
  phone: { type: String, trim: true },
}, { timestamps: true }));

export const FeeStructure = model('FeeStructure', new Schema({
  name: { type: String, required: [true, 'Fee name is required.'], trim: true },
  amount: { type: Number, required: [true, 'Amount is required.'], min: [0, 'Amount cannot be negative.'] },
  course: { type: String, required: [true, 'Course or class is required.'], trim: true },
  academicYear: { type: String, required: [true, 'Academic year is required.'], trim: true },
  dueDate: { type: Date, required: [true, 'Due date is required.'] },
}, { timestamps: true }));

const studentFeeSchema = new Schema({
  student: ref('Student', { required: true, index: true }),
  feeStructure: ref('FeeStructure', { required: true }),
  title: { type: String, required: true },     // snapshot of the fee name
  amountDue: { type: Number, required: true }, // snapshot of the amount at assignment time
  discount: { type: Number, default: 0, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
}, { timestamps: true, toJSON: { virtuals: true } });
studentFeeSchema.index({ student: 1, feeStructure: 1 }, { unique: true });
studentFeeSchema.virtual('net').get(function () { return Math.round((this.amountDue - this.discount) * 100) / 100; });
studentFeeSchema.virtual('balance').get(function () { return Math.round((this.amountDue - this.discount - this.paidAmount) * 100) / 100; });
studentFeeSchema.virtual('overdue').get(function () { return this.status !== 'paid' && this.dueDate < new Date(); });
export const StudentFee = model('StudentFee', studentFeeSchema);

export const statusOf = (sf) => {
  const balance = sf.amountDue - sf.discount - sf.paidAmount;
  if (balance < 0.005) return 'paid';
  return sf.paidAmount > 0 ? 'partial' : 'pending';
};

export const Payment = model('Payment', new Schema({
  studentFee: ref('StudentFee', { required: true, index: true }),
  student: ref('Student', { required: true, index: true }),
  amount: { type: Number, required: true, min: 0.01 },
  method: { type: String, enum: METHODS, required: true },
  referenceNo: { type: String, trim: true },
  paidOn: { type: Date, default: Date.now, index: true },
  receivedBy: ref('User'),
  receiptNo: { type: String, required: true, unique: true },
  balanceAfter: { type: Number, required: true },
  note: { type: String, trim: true },
}, { timestamps: true }));

const Counter = model('Counter', new Schema({ _id: String, seq: { type: Number, default: 0 } }));
export async function nextReceiptNo() {
  const c = await Counter.findOneAndUpdate({ _id: 'receipt' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `RCPT-${String(c.seq).padStart(6, '0')}`;
}
