import { StudentFee, Payment, METHODS, statusOf, nextReceiptNo } from '../models/index.js';
import { HttpError, round2 } from '../utils.js';

// Records a payment safely without needing a replica-set transaction:
// 1) atomically add to paidAmount only if it will not exceed the net fee
// 2) create the payment; if that fails, undo step 1
export async function recordPayment({ studentFeeId, amount, method, referenceNo, paidOn, note, receivedBy }) {
  const amt = round2(amount);
  if (!(amt > 0)) throw new HttpError(400, 'Enter an amount greater than zero.');
  if (!METHODS.includes(method)) throw new HttpError(400, 'Choose a valid payment method.');
  const sf = await StudentFee.findById(studentFeeId);
  if (!sf) throw new HttpError(404, 'That fee was not found.');

  const updated = await StudentFee.findOneAndUpdate(
    { _id: sf._id, $expr: { $lte: [{ $add: ['$paidAmount', amt] }, { $add: [{ $subtract: ['$amountDue', '$discount'] }, 0.005] }] } },
    { $inc: { paidAmount: amt } },
    { new: true }
  );
  if (!updated) throw new HttpError(400, `The amount is more than the balance of ${sf.balance}.`);

  try {
    const payment = await Payment.create({
      studentFee: sf._id, student: sf.student, amount: amt, method, referenceNo, note,
      paidOn: paidOn ? new Date(paidOn) : new Date(), receivedBy,
      receiptNo: await nextReceiptNo(), balanceAfter: round2(updated.amountDue - updated.discount - updated.paidAmount),
    });
    updated.status = statusOf(updated);
    await updated.save();
    return payment;
  } catch (err) {
    await StudentFee.updateOne({ _id: sf._id }, { $inc: { paidAmount: -amt } });
    throw err;
  }
}
