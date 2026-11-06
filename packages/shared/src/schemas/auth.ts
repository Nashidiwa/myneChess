import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(20, 'Tên đăng nhập không được vượt quá 20 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới'),
  email: z.string().email('Email không đúng định dạng'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu quá dài'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Vui lòng nhập tên đăng nhập hoặc email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().max(50, 'Tên hiển thị tối đa 50 ký tự').optional().nullable(),
  bio: z.string().max(300, 'Tiểu sử tối đa 300 ký tự').optional().nullable(),
  avatarUrl: z.string().max(1000000, 'Dung lượng ảnh đại diện quá lớn').optional().nullable(),
  email: z.string().email('Email không đúng định dạng').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const googleAuthSchema = z
  .object({
    credential: z.string().optional(),
    accessToken: z.string().optional(),
    profile: z
      .object({
        email: z.string().email(),
        name: z.string().optional(),
        picture: z.string().optional(),
        sub: z.string().optional(),
      })
      .optional(),
  })
  .refine((data) => !!(data.credential || data.accessToken || data.profile), {
    message: 'Yêu cầu cung cấp dữ liệu xác thực từ Google OAuth',
  });

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  code: z.string().min(4, 'Mã xác minh phải có ít nhất 4 ký tự').max(10, 'Mã xác minh quá dài'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
