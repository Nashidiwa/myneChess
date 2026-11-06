import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Chess } from 'chess.js';
import {
  Trophy,
  Swords,
  Bot,
  User,
  LogIn,
  LogOut,
  ShieldAlert,
  History,
  Menu,
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Cpu,
  Radio,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { PieceSvg } from '../features/game/AIGamePage';

import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import VerifyEmailPage from '../features/auth/VerifyEmailPage';
import LobbyPage from '../features/lobby/LobbyPage';
import GamePage from '../features/game/GamePage';
import AIGamePage from '../features/game/AIGamePage';
import ProfilePage from '../features/profile/ProfilePage';
import GameReplayPage from '../features/game/GameReplayPage';
import LeaderboardPage from '../features/leaderboard/LeaderboardPage';
import AdminPage from '../features/admin/AdminPage';

export default function App() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* Header / Navigation Bar */}
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl py-1 px-1.5"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white shadow-sm group-hover:scale-105 active:scale-95 transition-transform duration-150">
              <PieceSvg type="k" color="w" className="w-6 h-6 drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                  Online Chess
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                  Đấu trường cờ vua
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
            <Link
              to="/lobby"
              className={`px-3.5 py-2 rounded-xl transition-all duration-150 flex items-center gap-2 ${
                isActive('/lobby')
                  ? 'bg-sky-50 text-sky-700 font-semibold shadow-subtle'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Swords className="w-4 h-4 text-sky-600" />
              Sảnh chờ
            </Link>
            <Link
              to="/ai"
              className={`px-3.5 py-2 rounded-xl transition-all duration-150 flex items-center gap-2 ${
                isActive('/ai')
                  ? 'bg-sky-50 text-sky-700 font-semibold shadow-subtle'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Bot className="w-4 h-4 text-sky-600" />
              Đấu với Máy
            </Link>
            <Link
              to="/leaderboard"
              className={`px-3.5 py-2 rounded-xl transition-all duration-150 flex items-center gap-2 ${
                isActive('/leaderboard')
                  ? 'bg-sky-50 text-sky-700 font-semibold shadow-subtle'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Bảng xếp hạng
            </Link>
            {isAuthenticated && (
              <Link
                to="/history"
                className={`px-3.5 py-2 rounded-xl transition-all duration-150 flex items-center gap-2 ${
                  isActive('/history')
                    ? 'bg-sky-50 text-sky-700 font-semibold shadow-subtle'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <History className="w-4 h-4 text-sky-600" />
                Lịch sử đấu
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`px-3.5 py-2 rounded-xl transition-all duration-150 flex items-center gap-2 ${
                  isActive('/admin')
                    ? 'bg-amber-50 text-amber-900 font-semibold shadow-subtle'
                    : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50/70'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Quản trị
              </Link>
            )}
          </nav>

          {/* Desktop User Account Area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-sm transition-all duration-150 shadow-subtle hover:border-slate-300"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-bold text-white shadow-sm overflow-hidden flex-shrink-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName || user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (user.displayName || user.username).slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <span className="font-semibold text-slate-800 max-w-[120px] truncate">
                    {user.displayName || user.username}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-mono font-bold border border-sky-100 tabular-nums">
                    {user.eloRating} ELO
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  aria-label="Đăng xuất tài khoản"
                  title="Đăng xuất"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors duration-150 flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-xl shadow-sm transition-all duration-150 flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/90 bg-white px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <Link
              to="/lobby"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/lobby')
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Swords className="w-4 h-4 text-sky-600" />
              Sảnh chờ
            </Link>
            <Link
              to="/ai"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/ai')
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-4 h-4 text-sky-600" />
              Đấu với Máy
            </Link>
            <Link
              to="/leaderboard"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/leaderboard')
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Bảng xếp hạng
            </Link>
            {isAuthenticated && (
              <Link
                to="/history"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/history')
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4 text-sky-600" />
                Lịch sử đấu
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'bg-amber-50 text-amber-800 font-semibold'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Quản trị
              </Link>
            )}

            <div className="pt-3 border-t border-slate-100">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.displayName || user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (user.displayName || user.username).slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <span className="font-semibold text-sm text-slate-900 truncate max-w-[150px]">
                        {user.displayName || user.username}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold tabular-nums">
                      {user.eloRating} ELO
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="py-2.5 text-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="py-2.5 text-center text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Email Verification Alert Banner */}
      {isAuthenticated && user && !user.isEmailVerified && (
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-center gap-2 text-center animate-in fade-in duration-150">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Địa chỉ email của bạn chưa được xác minh.</span>
          <Link
            to={`/verify-email?email=${encodeURIComponent(user.email)}`}
            className="font-bold underline hover:text-amber-900 ml-1"
          >
            Nhập mã xác minh ngay
          </Link>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/game/:id" element={<GamePage />} />
          <Route path="/ai" element={<AIGamePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<GameReplayPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <PieceSvg type="k" color="w" className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">Online Chess Platform</span>
              <p className="text-[11px] text-slate-400">Đấu trường cờ vua trực tuyến thời gian thực & AI Minimax</p>
            </div>
          </div>

          <div className="text-center md:text-left text-slate-500">
            Đồ án cơ sở 4 - Kiến trúc Client-Server WebSocket & Công nghệ Trí tuệ Nhân tạo
          </div>

          <div className="flex items-center gap-5 font-medium text-slate-600">
            <Link to="/lobby" className="hover:text-slate-900 transition-colors">Sảnh thi đấu</Link>
            <Link to="/ai" className="hover:text-slate-900 transition-colors">Máy tập luyện</Link>
            <Link to="/leaderboard" className="hover:text-slate-900 transition-colors">Bảng xếp hạng</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Famous opening moves (Sicilian Defense - Najdorf Variation)
const DEMO_MOVES = [
  { san: 'e4', from: 'e2', to: 'e4', evalScore: 0.2 },
  { san: 'c5', from: 'c7', to: 'c5', evalScore: 0.3 },
  { san: 'Nf3', from: 'g1', to: 'f3', evalScore: 0.4 },
  { san: 'd6', from: 'd7', to: 'd6', evalScore: 0.3 },
  { san: 'd4', from: 'd2', to: 'd4', evalScore: 0.5 },
  { san: 'cxd4', from: 'c5', to: 'd4', evalScore: 0.4 },
  { san: 'Nxd4', from: 'f3', to: 'd4', evalScore: 0.6 },
  { san: 'Nf6', from: 'g8', to: 'f6', evalScore: 0.5 },
  { san: 'Nc3', from: 'b1', to: 'c3', evalScore: 0.7 },
  { san: 'a6', from: 'a7', to: 'a6', evalScore: 0.6 },
];

function LandingPage() {
  const [currentStep, setCurrentStep] = useState(6);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<any>(null);

  // Compute chess board state at current step
  const chess = new Chess();
  for (let i = 0; i < currentStep; i++) {
    try {
      chess.move(DEMO_MOVES[i].san);
    } catch {
      break;
    }
  }
  const board = chess.board();
  const lastMove = currentStep > 0 ? DEMO_MOVES[currentStep - 1] : null;
  const currentEval = currentStep > 0 ? DEMO_MOVES[currentStep - 1].evalScore : 0.2;

  // Auto-play stepper
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= DEMO_MOVES.length) {
            return 1;
          }
          return prev + 1;
        });
      }, 1600);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16 flex flex-col items-center">
      {/* Editorial Hero Announcement */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/90 text-xs font-semibold text-slate-800 mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Hệ thống thi đấu cờ vua trực tuyến chuẩn Elo quốc tế</span>
      </div>

      {/* Main Title - Pure intentional typography without artificial gradient fills */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight text-center max-w-4xl leading-[1.12] mb-6">
        Đấu Trường Cờ Vua Đỉnh Cao. <br />
        Chuẩn Xác Từng Giây.
      </h1>

      {/* Subtitle */}
      <p className="max-w-2xl text-slate-600 text-base sm:text-lg text-center mb-8 leading-relaxed font-normal">
        Trải nghiệm thi đấu cờ vua thời gian thực với đồng hồ chuẩn xác FIDE, ghép cặp đối thủ
        tự động theo Elo và phân tích thế trận chuyên sâu cùng thuật toán Minimax AI.
      </p>

      {/* Hero Primary Actions (One primary filled action per view) */}
      <div className="flex flex-wrap gap-3.5 justify-center mb-10">
        <Link
          to="/lobby"
          className="px-6 py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all duration-150 flex items-center gap-2 text-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <Swords className="w-4 h-4 text-sky-400" />
          <span>Vào phòng thi đấu</span>
        </Link>
        <Link
          to="/ai"
          className="px-6 py-3.5 rounded-xl font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-subtle transition-all duration-150 flex items-center gap-2 text-sm hover:border-slate-400 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <Bot className="w-4 h-4 text-slate-700" />
          <span>Luyện tập với máy AI</span>
        </Link>
      </div>

      {/* Time Control Launchpad (Tactical Fast Access) */}
      <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-14">
        {[
          { icon: '⚡', time: '1 + 0', label: 'Bullet', desc: 'Siêu tốc 1 phút', param: 'BULLET_1' },
          { icon: '⏱️', time: '3 + 0', label: 'Blitz', desc: 'Chớp 3 phút', param: 'BLITZ_3' },
          { icon: '🔥', time: '5 + 3', label: 'Blitz', desc: 'Chớp 5p + 3s', param: 'BLITZ_5' },
          { icon: '🛡️', time: '10 + 0', label: 'Rapid', desc: 'Cờ nhanh 10 phút', param: 'RAPID_10' },
        ].map((tc) => (
          <Link
            key={tc.time}
            to={`/lobby?time=${tc.param}`}
            className="group p-3 rounded-xl bg-white border border-slate-200/90 hover:border-slate-400 hover:shadow-subtle transition-all duration-150 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">{tc.icon}</span>
              <span className="text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {tc.time}
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                {tc.label}
              </div>
              <div className="text-[11px] text-slate-500">{tc.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Hero Interactive Chess Tournament Stage */}
      <div className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-7 shadow-card mb-16 relative">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Left: The Chess Arena */}
          <div className="w-full max-w-[380px] sm:max-w-[420px] flex flex-col gap-2">
            {/* Black Player Bar */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 text-white text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                  B
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Minimax Engine v4</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      BOT
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums">2450 ELO</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-mono tabular-nums text-sm font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-amber-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>04:48</span>
              </div>
            </div>

            {/* 8x8 Board with Evaluation Bar */}
            <div className="flex gap-2 items-stretch">
              {/* Evaluation Bar */}
              <div
                className="w-4 rounded-md overflow-hidden bg-slate-900 flex flex-col justify-end border border-slate-300 text-[9px] font-mono font-bold text-center select-none"
                title={`Đánh giá thế trận: +${currentEval}`}
              >
                <div
                  className="bg-white transition-all duration-300 w-full"
                  style={{
                    height: `${Math.min(95, Math.max(5, 50 + currentEval * 20))}%`,
                  }}
                />
              </div>

              {/* 8x8 Chess Squares */}
              <div className="flex-1 aspect-square rounded-xl overflow-hidden border border-slate-400/80 shadow-inner grid grid-cols-8 grid-rows-8 bg-slate-200">
                {board.map((row, rIdx) =>
                  row.map((piece, cIdx) => {
                    const isDark = (rIdx + cIdx) % 2 === 1;
                    const file = String.fromCharCode(97 + cIdx);
                    const rank = 8 - rIdx;
                    const squareName = `${file}${rank}`;
                    const isLastMoveFrom = lastMove?.from === squareName;
                    const isLastMoveTo = lastMove?.to === squareName;

                    let bgClass = isDark ? 'bg-[#5c8bb0]' : 'bg-[#eef3f8]';
                    if (isLastMoveFrom || isLastMoveTo) {
                      bgClass = isDark ? 'bg-[#89bdd3]' : 'bg-[#cfe8fc]';
                    }

                    return (
                      <div
                        key={squareName}
                        className={`relative flex items-center justify-center ${bgClass} select-none transition-colors duration-150`}
                      >
                        {/* Ranks coordinate */}
                        {cIdx === 0 && (
                          <span
                            className={`absolute top-0.5 left-1 text-[9px] font-bold font-mono pointer-events-none leading-none ${
                              isDark ? 'text-slate-200' : 'text-slate-500'
                            }`}
                          >
                            {rank}
                          </span>
                        )}
                        {/* Files coordinate */}
                        {rIdx === 7 && (
                          <span
                            className={`absolute bottom-0.5 right-1 text-[9px] font-bold font-mono pointer-events-none leading-none ${
                              isDark ? 'text-slate-200' : 'text-slate-500'
                            }`}
                          >
                            {file}
                          </span>
                        )}

                        {piece && (
                          <PieceSvg
                            type={piece.type}
                            color={piece.color}
                            className="w-4/5 h-4/5 drop-shadow pointer-events-none"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* White Player Bar */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 text-white text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-xs text-white">
                  W
                </div>
                <div>
                  <div className="font-bold text-white">Bạn (Đại kiện tướng)</div>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums">1850 ELO</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 font-mono tabular-nums text-sm font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-emerald-400">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>05:00</span>
              </div>
            </div>

            {/* Interactive Playback Controls */}
            <div className="flex items-center justify-between pt-1 text-slate-600 text-xs">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(0);
                }}
                disabled={currentStep === 0}
                aria-label="Về thế cờ ban đầu"
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep((p) => Math.max(0, p - 1));
                  }}
                  disabled={currentStep === 0}
                  aria-label="Nước cờ trước"
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label={isPlaying ? 'Tạm dừng tự động phát' : 'Tự động phát nước đi'}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Phát tự động</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep((p) => Math.min(DEMO_MOVES.length, p + 1));
                  }}
                  disabled={currentStep >= DEMO_MOVES.length}
                  aria-label="Nước cờ kế tiếp"
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <span className="font-mono tabular-nums text-[11px] text-slate-500 font-medium">
                {currentStep} / {DEMO_MOVES.length} nước
              </span>
            </div>
          </div>

          {/* Right: Opening Notation & Match Chronicle */}
          <div className="flex-1 w-full space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-100">
                Khai cuộc Sicilian Najdorf
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                Trực quan hóa thế trận và phân tích nước cờ
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Nhấp vào từng nước cờ bên dưới để theo dõi chuyển biến thế trận trên bàn cờ tương tác.
              </p>
            </div>

            {/* Notation Move Grid */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/90 text-xs font-mono">
              <div className="grid grid-cols-2 gap-1.5">
                {Array.from({ length: Math.ceil(DEMO_MOVES.length / 2) }).map((_, pairIdx) => {
                  const whiteMove = DEMO_MOVES[pairIdx * 2];
                  const blackMove = DEMO_MOVES[pairIdx * 2 + 1];
                  const isWhiteActive = currentStep === pairIdx * 2 + 1;
                  const isBlackActive = currentStep === pairIdx * 2 + 2;

                  return (
                    <div key={pairIdx} className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-white transition-colors">
                      <span className="text-slate-400 w-5 tabular-nums">{pairIdx + 1}.</span>
                      {whiteMove && (
                        <button
                          onClick={() => {
                            setIsPlaying(false);
                            setCurrentStep(pairIdx * 2 + 1);
                          }}
                          className={`px-2 py-0.5 rounded transition-colors text-left flex-1 ${
                            isWhiteActive
                              ? 'bg-slate-900 text-white font-bold'
                              : 'text-slate-800 hover:bg-slate-200'
                          }`}
                        >
                          {whiteMove.san}
                        </button>
                      )}
                      {blackMove && (
                        <button
                          onClick={() => {
                            setIsPlaying(false);
                            setCurrentStep(pairIdx * 2 + 2);
                          }}
                          className={`px-2 py-0.5 rounded transition-colors text-left flex-1 ${
                            isBlackActive
                              ? 'bg-slate-900 text-white font-bold'
                              : 'text-slate-800 hover:bg-slate-200'
                          }`}
                        >
                          {blackMove.san}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tactical feature checklist */}
            <div className="space-y-2 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Đồng bộ nước đi qua giao thức WebSocket hai chiều không độ trễ</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Hỗ trợ luật phong cấp tốt, bắt tốt qua đường (En Passant) và nhập thành</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Lưu trữ toàn bộ lịch sử biên bản PGN và xem lại từng nước đi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Three Tournament Pillars (Engine, Network, Elo) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mb-16">
        {/* Pillar 1: Minimax AI Engine */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold mb-4 border border-slate-200">
              <Cpu className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Động Cơ Minimax & Alpha-Beta
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Thuật toán duyệt cây tìm kiếm thông minh kết hợp cắt tỉa Alpha-Beta Pruning,
              đánh giá vị trí và gợi ý nước đi chiến thuật giúp nâng cao trình độ.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Độ sâu: 3 cấp độ</span>
            <span className="text-emerald-700 font-semibold font-sans">Thời gian thực</span>
          </div>
        </div>

        {/* Pillar 2: WebSocket Realtime Sync */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold mb-4 border border-slate-200">
              <Radio className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Hạ Tầng WebSocket Độ Trễ Thấp
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Đồng bộ trạng thái ván cờ tức thì, bù trễ mili-giây cho đồng hồ thi đấu
              và cơ chế tự động tái kết nối khi mạng gián đoạn.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Ping &lt; 20ms</span>
            <span className="text-emerald-700 font-semibold font-sans">Bảo toàn đồng hồ</span>
          </div>
        </div>

        {/* Pillar 3: Elo Rating & PGN History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold mb-4 border border-slate-200">
              <BarChart3 className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              Hệ Thống Xếp Hạng Elo FIDE
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Tính toán hệ số Elo chuẩn sau mỗi trận đấu, bảng xếp hạng minh bạch
              và công cụ xem lại lịch sử ván cờ trực quan.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>K-Factor: 32</span>
            <span className="text-emerald-700 font-semibold font-sans">Lưu trữ PGN</span>
          </div>
        </div>
      </div>

      {/* Community Call to Action */}
      <div className="w-full bg-slate-900 text-white rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
          Sẵn sàng thử thách bản thân trên bàn cờ?
        </h2>
        <p className="text-slate-300 text-sm max-w-xl mx-auto mb-6">
          Tạo phòng đấu riêng cùng bạn bè, ghép cặp ngẫu nhiên theo điểm Elo hoặc rèn luyện chiến thuật cùng máy AI.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/lobby"
            className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors active:scale-[0.98]"
          >
            Vào Sảnh Thi Đấu
          </Link>
          <Link
            to="/ai"
            className="px-6 py-3 rounded-xl bg-slate-800 text-white border border-slate-700 font-semibold text-sm hover:bg-slate-700 transition-colors active:scale-[0.98]"
          >
            Đấu với Máy AI
          </Link>
        </div>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="p-16 text-center max-w-lg mx-auto my-auto">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 mx-auto flex items-center justify-center text-2xl font-bold mb-4">
        404
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Không tìm thấy trang</h2>
      <p className="text-slate-500 mb-6 text-sm">
        Trang bạn đang truy cập không tồn tại hoặc đã được chuyển sang địa chỉ khác.
      </p>
      <Link
        to="/"
        className="inline-flex px-5 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-white font-semibold text-sm shadow-sm transition-all duration-150 active:scale-[0.98]"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
