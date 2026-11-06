import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Chessboard } from 'react-chessboard';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import {
  History,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
} from 'lucide-react';

export default function GameReplayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeReplayId = searchParams.get('replay');
  const { user } = useAuthStore();

  const [currentPlyIndex, setCurrentPlyIndex] = useState(0);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

  // Fetch match history
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['myFullHistory'],
    queryFn: async () => {
      const res = await api.get('/games/history/me?limit=20');
      return res.data;
    },
  });

  // Fetch replay details when activeReplayId is selected
  const { data: replayData } = useQuery({
    queryKey: ['gameReplay', activeReplayId],
    queryFn: async () => {
      if (!activeReplayId) return null;
      const res = await api.get(`/games/${activeReplayId}/replay`);
      return res.data.data;
    },
    enabled: !!activeReplayId,
  });

  const historyMoves = replayData?.history || [];
  const currentFen =
    historyMoves.length > 0 && historyMoves[currentPlyIndex]
      ? historyMoves[currentPlyIndex].fen
      : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const selectGameToReplay = (gameId: string) => {
    setSearchParams({ replay: gameId });
    setCurrentPlyIndex(0);
  };

  const stepFirst = () => setCurrentPlyIndex(0);
  const stepPrev = () => setCurrentPlyIndex((prev) => Math.max(0, prev - 1));
  const stepNext = () =>
    setCurrentPlyIndex((prev) => Math.min(historyMoves.length - 1, prev + 1));
  const stepLast = () => setCurrentPlyIndex(historyMoves.length - 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col lg:flex-row gap-6 items-start">
      {/* Left: Interactive Replay Viewer */}
      {activeReplayId && replayData ? (
        <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col gap-4">
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-card">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-600" />
                <span>Xem Lại Ván Đấu #{replayData.game.id.slice(0, 8)}</span>
              </h2>
              <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                {replayData.game.whitePlayerName} ({replayData.game.whitePlayerRating}) vs{' '}
                {replayData.game.blackPlayerName} ({replayData.game.blackPlayerRating})
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200/70">
                {replayData.game.result}
              </span>
              <div className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                {replayData.game.terminationReason}
              </div>
            </div>
          </div>

          {/* Chessboard View */}
          <div className="w-full aspect-square bg-white p-2.5 sm:p-3 rounded-2xl shadow-card border border-slate-200/90">
            <Chessboard
              position={currentFen}
              boardOrientation={boardOrientation}
              arePiecesDraggable={false}
              customBoardStyle={{
                borderRadius: '12px',
                boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.05)',
              }}
              customDarkSquareStyle={{ backgroundColor: '#6ba3c8' }}
              customLightSquareStyle={{ backgroundColor: '#f0f5fa' }}
            />
          </div>

          {/* Stepper Controls */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-card">
            <button
              onClick={() =>
                setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'))
              }
              aria-label="Xoay hướng bàn cờ"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4 text-sky-600" />
              <span>Xoay bàn</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={stepFirst}
                disabled={currentPlyIndex === 0}
                aria-label="Nước đầu tiên"
                className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 disabled:opacity-40 text-slate-700 rounded-xl transition-colors shadow-subtle active:scale-[0.98]"
                title="Đầu ván"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={stepPrev}
                disabled={currentPlyIndex === 0}
                aria-label="Nước trước"
                className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 disabled:opacity-40 text-slate-700 rounded-xl transition-colors shadow-subtle active:scale-[0.98]"
                title="Nước trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="font-mono tabular-nums text-xs font-bold text-slate-800 px-2 sm:px-3">
                {currentPlyIndex} / {Math.max(0, historyMoves.length - 1)}
              </span>

              <button
                onClick={stepNext}
                disabled={currentPlyIndex >= historyMoves.length - 1}
                aria-label="Nước kế tiếp"
                className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 disabled:opacity-40 text-slate-700 rounded-xl transition-colors shadow-subtle active:scale-[0.98]"
                title="Nước sau"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={stepLast}
                disabled={currentPlyIndex >= historyMoves.length - 1}
                aria-label="Nước cuối cùng"
                className="p-2 sm:p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 disabled:opacity-40 text-slate-700 rounded-xl transition-colors shadow-subtle active:scale-[0.98]"
                title="Cuối ván"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Move SAN list table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-card max-h-48 overflow-y-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Biên bản nước đi (SAN)
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-mono tabular-nums">
              {historyMoves.map((h: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPlyIndex(idx)}
                  className={`p-1.5 rounded-lg text-left transition-colors duration-150 ${
                    idx === currentPlyIndex
                      ? 'bg-sky-50 text-sky-700 font-bold border border-sky-300'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {idx === 0
                    ? 'Bắt đầu'
                    : `${Math.ceil(idx / 2)}${idx % 2 === 1 ? '.' : '...'} ${h.san}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 shadow-card flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Chọn Một Trận Đấu Để Xem Lại</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
            Duyệt danh sách các ván đấu đã diễn ra bên cạnh và chọn một trận để phân tích chi tiết.
          </p>
        </div>
      )}

      {/* Right: History match list */}
      <div className="w-full lg:w-96 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-card flex flex-col gap-4 self-stretch max-h-[800px]">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <History className="w-5 h-5 text-sky-600" />
          <h3 className="font-bold text-slate-900 text-base">Lịch Sử Thi Đấu</h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoadingHistory ? (
            <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center">
              <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-2" />
              <span>Đang tải lịch sử...</span>
            </div>
          ) : !historyData?.data || historyData.data.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Chưa có trận đấu nào được ghi nhận.
            </div>
          ) : (
            historyData.data.map((g: any) => {
              const isWhite = g.whitePlayerId === user?.id;
              const opponent = isWhite ? g.blackPlayerName : g.whitePlayerName;
              const isSelected = activeReplayId === g.id;

              return (
                <div
                  key={g.id}
                  onClick={() => selectGameToReplay(g.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-sky-50/90 border-sky-400 shadow-subtle ring-1 ring-sky-300'
                      : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-sky-300 hover:shadow-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 text-xs truncate max-w-[170px]">
                      Vs {opponent || 'Máy AI'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono tabular-nums">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(g.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      {isWhite ? 'Quân Trắng' : 'Quân Đen'} • {g.gameMode}
                    </span>
                    <span className="font-bold text-sky-700 text-[11px] uppercase">
                      {g.result || 'Đang đấu'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
