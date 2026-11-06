import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const verifyUrl = `${env.CLIENT_APP_URL}/verify-email?email=${encodeURIComponent(email)}&code=${code}`;

  // If SMTP is not configured, simulate by logging the code
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    logger.info(`=======================================================`);
    logger.info(`📧 [EMAIL VERIFICATION SIMULATION]`);
    logger.info(`   To: ${email}`);
    logger.info(`   Code: ${code}`);
    logger.info(`   Verification Link: ${verifyUrl}`);
    logger.info(`=======================================================`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0284c7; margin: 0; font-size: 24px;">Online Chess</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Đấu trường cờ vua trực tuyến</p>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <h3 style="margin-top: 0; color: #1e293b;">Mã Xác Minh Tài Khoản</h3>
          <p style="color: #475569; font-size: 14px; margin-bottom: 16px;">Vui lòng sử dụng mã bên dưới để hoàn tất việc xác minh email:</p>
          <div style="display: inline-block; padding: 12px 24px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; background: #e0f2fe; border-radius: 8px; font-family: monospace;">
            ${code}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 12px;">Mã này có hiệu lực trong vòng 15 phút.</p>
        </div>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
            Nhấn Vào Đây Để Xác Minh Nhanh
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Nếu bạn không tạo tài khoản trên Online Chess, vui lòng bỏ qua email này.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: `[Online Chess] Mã xác minh tài khoản của bạn: ${code}`,
      html,
    });

    logger.info(`Verification email sent successfully to ${email}`);
    return true;
  } catch (error) {
    logger.error(error, `Failed to send verification email to ${email}`);
    return false;
  }
}
