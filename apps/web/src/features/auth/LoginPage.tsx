import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@online-chess/shared';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { reconnectSocketWithAuth } from '../../services/socket';
import { Lock, User, Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import { PieceSvg } from '../game/AIGamePage';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMessage('');
    setUnverifiedEmail('');
    try {
      const res = await api.post('/auth/login', data);
      if (res.data.success && res.data.data) {
        setAuth(res.data.data.user, res.data.data.accessToken);
        reconnectSocketWithAuth();
        navigate('/lobby');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập không thành công, vui lòng kiểm tra lại thông tin.';
      setErrorMessage(msg);

      // Check if blocked due to unverified email
      if (err.response?.status === 403 || msg.includes('chưa được xác minh')) {
        const emailFromDetails = err.response?.data?.details?.email;
        const emailGuess = emailFromDetails || (data.usernameOrEmail.includes('@') ? data.usernameOrEmail : '');
        setUnverifiedEmail(emailGuess);
      }
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
            Đăng nhập đấu trường
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chào mừng bạn quay trở lại với cộng đồng cờ vua trực tuyến
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex flex-col gap-2 animate-in fade-in duration-150"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {Boolean(unverifiedEmail) && (
              <Link
                to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="inline-flex items-center gap-1.5 font-bold text-sky-700 hover:text-sky-800 underline pl-6 text-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Nhấn vào đây để nhập mã xác minh email</span>
              </Link>
            )}
          </div>
        )}

        {/* Google One-Click Login */}
        <div className="mb-5">
          <GoogleLoginButton text="Đăng nhập bằng tài khoản Google" />
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] font-semibold text-slate-400">
              <span className="bg-white px-3">Hoặc tiếp tục với tài khoản riêng</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tên đăng nhập hoặc email
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                {...register('usernameOrEmail')}
                type="text"
                autoComplete="username"
                placeholder="Nhập tên tài khoản hoặc email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white text-base sm:text-sm transition-colors"
              />
            </div>
            {errors.usernameOrEmail && (
              <p className="text-xs text-rose-600 mt-1">{errors.usernameOrEmail.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
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
              <span>Đăng nhập</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
          <Link
            to="/verify-email"
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            Chưa nhận mã xác minh?
          </Link>
          <Link
            to="/register"
            className="font-bold text-slate-900 hover:text-sky-700 transition-colors"
          >
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
}
