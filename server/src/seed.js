import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { User, Student, FeeStructure, StudentFee } from './models/index.js';
import { recordPayment } from './services/payments.js';

export async function runSeed({ demo = false } = {}) {
  const email = (process.env.ADMIN_EMAIL || 'admin@school.test').toLowerCase();
  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Accounts Office',
      email,
      role: 'admin',
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123', 10),
    });
    console.log(`✓ Admin created: ${email} (password: ${process.env.ADMIN_PASSWORD || 'ChangeMe123'})`);
  } else {
    console.log(`ℹ Admin already exists: ${email}`);
  }

  if (demo) {
    const demoStudents = [
      ['Aarav Sharma', 'aarav@example.test', 'S-1001', 'Class 10', '+91 98765 43210'],
      ['Diya Verma', 'diya@example.test', 'S-1002', 'Class 10', '+91 98765 43211'],
      ['Kabir Singh', 'kabir@example.test', 'S-1003', 'Class 9', '+91 98765 43212'],
      ['Ananya Iyer', 'ananya@example.test', 'S-1004', 'Class 11', '+91 98765 43213'],
      ['Rohan Mehta', 'rohan@example.test', 'S-1005', 'Class 12', '+91 98765 43214'],
    ];

    for (const [name, mail, rollNo, course, phone] of demoStudents) {
      if (await Student.exists({ rollNo })) continue;
      const u = await User.create({
        name,
        email: mail,
        role: 'student',
        passwordHash: await bcrypt.hash(rollNo, 10),
      });
      await Student.create({
        user: u._id,
        rollNo,
        course,
        phone,
        guardianName: 'Guardian of ' + name.split(' ')[0],
      });
    }

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${String(currentYear + 1).slice(2)}`;
    const dueIn30Days = new Date(Date.now() + 30 * 864e5);
    const overdue10Days = new Date(Date.now() - 10 * 864e5);

    const feeDefs = [
      { name: 'Tuition Fee - Term 1', course: 'Class 10', amount: 25000, dueDate: dueIn30Days },
      { name: 'Lab & Computer Facility', course: 'Class 10', amount: 4500, dueDate: dueIn30Days },
      { name: 'Tuition Fee - Term 1', course: 'Class 9', amount: 22000, dueDate: dueIn30Days },
      { name: 'Tuition Fee - Term 1', course: 'Class 11', amount: 30000, dueDate: overdue10Days },
      { name: 'Library & Sports Annual', course: 'Class 12', amount: 5000, dueDate: dueIn30Days },
    ];

    for (const def of feeDefs) {
      if (await FeeStructure.exists({ course: def.course, name: def.name, academicYear })) continue;
      const fs = await FeeStructure.create({
        name: def.name,
        amount: def.amount,
        course: def.course,
        academicYear,
        dueDate: def.dueDate,
      });

      const studentsInCourse = await Student.find({ course: def.course });
      for (const s of studentsInCourse) {
        if (!await StudentFee.exists({ student: s._id, feeStructure: fs._id })) {
          await StudentFee.create({
            student: s._id,
            feeStructure: fs._id,
            title: fs.name,
            amountDue: fs.amount,
            dueDate: fs.dueDate,
          });
        }
      }
    }

    // Add some sample payments
    const studentFees = await StudentFee.find({ paidAmount: 0 }).sort({ createdAt: 1 }).limit(3);
    if (studentFees[0]) {
      await recordPayment({
        studentFeeId: studentFees[0]._id,
        amount: 15000,
        method: 'upi',
        referenceNo: 'UPI-DEMO-9921',
        receivedBy: admin._id,
        note: 'Online partial payment via portal',
      });
    }
    if (studentFees[1]) {
      await recordPayment({
        studentFeeId: studentFees[1]._id,
        amount: studentFees[1].amountDue,
        method: 'card',
        referenceNo: 'TXN-CARD-4412',
        receivedBy: admin._id,
        note: 'Full settlement via debit card',
      });
    }

    console.log('✓ Demo data seeded successfully.');
    console.log('  Admin login: ' + email + ' / ' + (process.env.ADMIN_PASSWORD || 'ChangeMe123'));
    console.log('  Student logins: e.g. aarav@example.test (pwd: S-1001), diya@example.test (pwd: S-1002)');
  }

  return admin;
}

// Standalone CLI invocation
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  try {
    await connectDB();
    const demo = process.argv.includes('--demo') || true;
    await runSeed({ demo });
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}
