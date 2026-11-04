import nodemailer from 'nodemailer';

/**
 * Sends a password reset OTP to the student's or user's registered college email.
 * If SMTP is configured in .env (SMTP_HOST, SMTP_USER, SMTP_PASS), it delivers via real email.
 * Otherwise, it logs the OTP in the server console for testing/development.
 */
export async function sendPasswordResetOtp({ to, name, otp, schoolName = 'Apex Horizon Academy' }) {
  const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  if (hasSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || `"${schoolName}" <no-reply@${process.env.SMTP_HOST}>`,
        to,
        subject: `Password Reset Verification Code - ${schoolName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Password Reset Request</h2>
            <p>Hello <b>${name || 'Student'}</b>,</p>
            <p>We received a request to reset the password for your registered college portal account (<b>${to}</b>).</p>
            <div style="margin: 24px 0; padding: 16px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; text-align: center;">
              <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase; font-weight: 600;">Your 6-Digit Verification Code</span>
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #64748b;">This OTP code is valid for the next <b>15 minutes</b>. If you did not make this request, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">${schoolName} Fee & Financial Portal</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL DISPATCHED] Password reset OTP sent to real email: ${to}`);
      return { sent: true, mode: 'smtp' };
    } catch (err) {
      console.error('[EMAIL DISPATCH ERROR]', err.message);
      // Fallback to console if SMTP fails
    }
  }

  // Development / Demo fallback: log cleanly to console
  console.log(`\n=================================================`);
  console.log(`[PASSWORD RESET OTP FOR COLLEGE EMAIL]`);
  console.log(`To: ${to} (${name})`);
  console.log(`OTP Code: ${otp}`);
  console.log(`Valid For: 15 minutes`);
  console.log(`=================================================\n`);

  return { sent: true, mode: 'simulated', otp };
}
