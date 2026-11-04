# Student Fee Portal

React + Node/Express + MongoDB (Mongoose). Admin/accounts office manages students, fees, payments and receipts; students log in to see their own dues and download receipts.

## What's included
- Login with JWT, two roles: `admin` and `student`; students can change their password
- Admin: students (add/edit/delete), fee list, assign fees to a class or selected students, per-student discounts, record payments (cash, UPI, cheque, bank transfer, card), partial payments, PDF receipts with sequential numbers, dashboard, pending-dues and collection reports with CSV export
- Student: own fees with status (pending, partly paid, paid, overdue), payment history, receipt downloads

## Setup
Requirements: Node 18+ and a MongoDB instance (local, or a free MongoDB Atlas cluster).

```bash
# 1. Server
cd server
cp .env.example .env        # then edit MONGO_URI, JWT_SECRET, SCHOOL_NAME, admin email/password
npm install
npm run seed                # creates the admin account
npm run seed:demo           # optional: adds sample students, fees and one payment
npm run dev                 # API on http://localhost:5000

# 2. Client (new terminal)
cd client
npm install
npm run dev                 # app on http://localhost:5173
```

Log in with the admin email/password from your `.env`. Demo students log in with their email and their roll number as the password (for example `aarav@example.test` / `S-1001`).

## Project layout
```
server/src
  models/index.js        all Mongoose models + receipt counter
  middleware/auth.js     JWT auth and role guard
  services/payments.js   safe payment recording (no overpayment, no transaction needed)
  routes/                auth, students, feeStructures, studentFees, payments, reports
  seed.js                admin + optional demo data
client/src
  App.jsx, Layout.jsx, auth.jsx, api.js, ui.jsx, styles.css
  pages/                 Login, Dashboard, Students, Fees, Payments, Reports, MyFees, Account
```

## API summary
| Method | Path | Who |
|---|---|---|
| POST | /api/auth/login, /api/auth/forgot-password, /api/auth/verify-otp, /api/auth/reset-password, /api/auth/change-password | all |
| GET | /api/auth/me | all |
| CRUD | /api/students, /api/fee-structures | admin |
| GET | /api/student-fees | admin (all) / student (own) |
| POST | /api/student-fees/assign | admin |
| PATCH | /api/student-fees/:id/discount | admin |
| GET | /api/payments, /api/payments/:id/receipt | admin / student (own) |
| POST | /api/payments | admin |
| GET | /api/reports/dashboard, /dues, /collection | admin |

## Notes
- Currency is INR; change it in `client/src/api.js` (`money`). PDF receipts print "Rs." because the built-in PDF font has no rupee glyph.
- When you assign a fee, its amount and due date are copied to the student's record, so later edits to the fee list do not change what students already owe.
- Before going live: use a long random `JWT_SECRET`, serve over HTTPS, set `CLIENT_ORIGIN` to your real site, and build the client with `npm run build` (serve `client/dist` with your web server or from Express).

## Ideas for next steps
Online payments through a gateway, email/SMS reminders for overdue fees, late fees, multiple children per guardian login, audit log, backups.
