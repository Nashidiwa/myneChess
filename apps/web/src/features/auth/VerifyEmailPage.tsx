import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { reconnectSocketWithAuth } from '../../services/socket';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PieceSvg } from '../game/AIGamePage';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { user, setAuth, updateUser } = useAuthStore();

  const [email, setEmail] = useState(searchParams.get('email') || user?.email || '');
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(user?.isEmailVerified || false);

  // Auto-verify if both email and code exist in URL query params
  useEffect(() => {
    const queryEmail = searchParams.get('email');
    const queryCode = searchParams.get('code');
    if (queryEmail && queryCode && !isVerified) {
      handleVerify(queryEmail, queryCode);
    }
  }, []);

  // Timer countdown for resending code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (targetEmail: string, targetCode: string) => {
    if (!targetEmail || !targetCode) {
      setErrorMessage('Vui lòng điền đầy đủ email và mã xác minh');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.post('/auth/verify-email', {
        email: targetEmail.trim(),
        code: targetCode.trim(),
      });
      if (res.data.success) {
        setIsVerified(true);
        setSuccessMessage('Xác minh địa chỉ email thành công! Tài khoản của bạn đã được kích hoạt.');
        if (res.data.data?.accessToken && res.data.data?.user) {
          setAuth(res.data.data.user, res.data.data.accessToken);
          reconnectSocketWithAuth();
        } else if (res.data.data?.user) {
          updateUser(res.data.data.user);
        } else {
          updateUser({ isEmailVerified: true });
        }
        // Fire confetti celebration
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Mã xác minh không chính xác hoặc đã hết hiệu lực.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(email, code);
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMessage('Vui lòng nhập địa chỉ email để nhận lại mã.');
      return;
    }
    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.post('/auth/resend-verification', { email: email.trim() });
      if (res.data.success) {
        setSuccessMessage('Đã gửi mã xác minh mới vào hộp thư của bạn. Vui lòng kiểm tra!');
        setCountdown(60);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Không thể gửi lại mã xác minh lúc này. Vui lòng thử lại sau.'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-card relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-sky-600 to-blue-700 rounded-xl mx-auto flex items-center justify-center text-white shadow-sm shadow-sky-500/20 mb-3.5">
            <PieceSvg type="k" color="w" className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Xác Minh Email
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bảo vệ tài khoản và mở khóa tính năng thi đấu xếp hạng ELO
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="alert"
            className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in duration-150"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isVerified ? (
          <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Email Đã Được Xác Minh</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể tham gia mọi phòng đấu trực tuyến.
            </p>
            <div className="pt-4 flex flex-col gap-2.5">
              <Link
                to="/lobby"
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] font-bold text-white rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 text-sm"
              >
                <span>Vào Sảnh Chờ Thi Đấu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/profile"
                className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 active:scale-[0.98] font-semibold text-slate-700 rounded-xl transition-all duration-150 text-xs sm:text-sm text-center"
              >
                Xem Hồ Sơ Kỳ Thủ
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tenban@domain.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white text-base sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Mã xác minh (OTP 6 số)
                </label>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || isResending}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold disabled:text-slate-400 disabled:pointer-events-none flex items-center gap-1"
                >
                  {isResending && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>
                    {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
                  </span>
                </button>
              </div>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Ví dụ: 123456"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/90 rounded-xl text-center text-slate-900 font-mono text-xl sm:text-2xl font-bold tracking-widest placeholder-slate-300 focus:outline-none focus:border-sky-500 focus:bg-white tabular-nums transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                Mã xác minh gồm 6 số đã được gửi tới hòm thư của bạn và có hiệu lực 15 phút.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length < 4}
              className="w-full mt-2 py-3 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none font-bold text-white rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác Nhận Kích Hoạt</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100 text-center flex items-center justify-between text-xs text-slate-500">
          <Link to="/lobby" className="hover:text-slate-800 transition-colors">
            &larr; Về Sảnh Chờ
          </Link>
          <Link to="/login" className="hover:text-sky-600 font-semibold transition-colors">
            Đăng nhập tài khoản khác
          </Link>
        </div>
      </div>
    </div>
  );
}
