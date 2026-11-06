import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@online-chess/shared';
import { api } from '../../services/api';
import { Lock, User, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { PieceSvg } from '../game/AIGamePage';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post('/auth/register', data);
      if (res.data.success) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Đăng ký không thành công, vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-card relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl mx-auto flex items-center justify-center text-white shadow-sm mb-3.5">
            <PieceSvg type="k" color="w" className="w-7 h-7 drop-shadow-sm" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Đăng ký tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gia nhập cộng đồng kỳ thủ và bắt đầu thi đấu tính điểm Elo
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google One-Click Login */}
        <div className="mb-5">
          <GoogleLoginButton text="Đăng ký nhanh bằng Google" />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] font-semibold text-slate-400">
              <span className="bg-white px-3">Hoặc điền biểu mẫu dưới đây</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tên kỳ thủ (Tên đăng nhập)
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                placeholder="Ví dụ: grandmaster_vn"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white text-base sm:text-sm transition-colors"
              />
            </div>
            {errors.username && (
              <p className="text-xs text-rose-600 mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Địa chỉ email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="tenban@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white text-base sm:text-sm transition-colors"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white text-base sm:text-sm transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none font-bold text-white rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 text-sm focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Tạo tài khoản</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs sm:text-sm text-slate-500">
          <span>Đã có tài khoản? </span>
          <Link
            to="/login"
            className="font-bold text-slate-900 hover:text-sky-700 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
