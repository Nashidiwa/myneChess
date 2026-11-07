import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/authStore';
import { soundManager } from '../../lib/sound';
import {
  GameState,
  MoveResultPayload,
  ChatMessage,
  GameOverPayload,
  ClockUpdatePayload,
  SOCKET_EVENTS,
} from '@online-chess/shared';
import {
  Clock,
  RotateCcw,
  Flag,
  Handshake,
  Send,
  MessageSquare,
  AlertCircle,
  Trophy,
  History,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Share2,
  Swords,
} from 'lucide-react';
import { PieceSvg } from './AIGamePage';

export default function GamePage() {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const socket = getSocket();

  const isWaitingRoom = gameId === 'waiting';
  const roomIdParam = searchParams.get('roomId');
  const roomCodeParam = searchParams.get('code');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  const toggleSound = () => {
    const next = soundManager.toggle();
    setSoundEnabled(next);
  };

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [boardFen, setBoardFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [gameOverData, setGameOverData] = useState<GameOverPayload | null>(null);

  // Clocks
  const [whiteClockMs, setWhiteClockMs] = useState(300000);
  const [blackClockMs, setBlackClockMs] = useState(300000);

  // Modals & offers
  const [incomingDrawOffer, setIncomingDrawOffer] = useState<string | null>(null);
  const [showResignModal, setShowResignModal] = useState(false);
  const [lastMoveSquares, setLastMoveSquares] = useState<{ from?: string; to?: string }>({});

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const localChessRef = useRef(new Chess());

  // Determine user's assigned color
  const isWhitePlayer = gameState?.whitePlayerId === user?.id;
  const isBlackPlayer = gameState?.blackPlayerId === user?.id;
  const isPlayer = isWhitePlayer || isBlackPlayer;

  // Waiting room socket listeners & polling fallback
  useEffect(() => {
    if (!isWaitingRoom) return;

    if (roomIdParam) {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: roomIdParam, roomCode: roomCodeParam });
    }

    const handleRoomUpdated = (room: any) => {
      if (room?.gameId) {
        navigate(`/game/${room.gameId}`);
      }
    };

    const handleGameState = (state: any) => {
      if (state?.id) {
        navigate(`/game/${state.id}`);
      }
    };

    const handleMatchFound = (data: any) => {
      if (data?.gameId) {
        navigate(`/game/${data.gameId}`);
      }
    };

    socket.on(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdated);
    socket.on(SOCKET_EVENTS.GAME_STATE, handleGameState);
    socket.on(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
    socket.on('GAME_STARTED', handleMatchFound);

    const pollInterval = setInterval(async () => {
      if (roomIdParam) {
        try {
          const res = await api.get(`/rooms/${roomIdParam}`);
          if (res.data?.success && res.data?.data?.gameId) {
            navigate(`/game/${res.data.data.gameId}`);
          }
        } catch {}
      }
    }, 2500);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdated);
      socket.off(SOCKET_EVENTS.GAME_STATE, handleGameState);
      socket.off(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
      socket.off('GAME_STARTED', handleMatchFound);
      clearInterval(pollInterval);
    };
  }, [isWaitingRoom, roomIdParam, roomCodeParam, socket, navigate]);

  const copyCode = () => {
    if (roomCodeParam) {
      navigator.clipboard.writeText(roomCodeParam);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyInviteLink = () => {
    if (roomCodeParam) {
      const link = `${window.location.origin}/lobby?join=${roomCodeParam}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCancelWaitingRoom = async () => {
    if (roomIdParam) {
      try {
        await api.post(`/rooms/${roomIdParam}/leave`);
      } catch {}
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId: roomIdParam });
    }
    navigate('/lobby');
  };

  // Set orientation according to assigned player color
  useEffect(() => {
    if (gameState && user) {
      if (gameState.blackPlayerId === user.id && gameState.whitePlayerId !== user.id) {
        setOrientation('black');
      } else {
        setOrientation('white');
      }
    }
  }, [gameState?.whitePlayerId, gameState?.blackPlayerId, user]);

  // Request game state & setup socket listeners
  useEffect(() => {
    if (!gameId || isWaitingRoom) return;

    socket.emit(SOCKET_EVENTS.REQUEST_GAME_STATE, { gameId }, (res: any) => {
      if (res?.success && res.data) {
        setGameState(res.data.state);
        setBoardFen(res.data.state.currentFen);
        localChessRef.current = new Chess(res.data.state.currentFen);
        setWhiteClockMs(res.data.state.whiteRemainingMs);
        setBlackClockMs(res.data.state.blackRemainingMs);
        if (res.data.messages) {
          setChatMessages(res.data.messages);
        }
      }
    });

    const handleMoveResult = (payload: MoveResultPayload) => {
      setBoardFen(payload.fen);
      localChessRef.current = new Chess(payload.fen);
      setWhiteClockMs(payload.whiteRemainingMs);
      setBlackClockMs(payload.blackRemainingMs);
      setLastMoveSquares({ from: payload.move.fromSquare, to: payload.move.toSquare });

      if (payload.isGameOver) {
        soundManager.play('gameover');
      } else if (payload.isCheck) {
        soundManager.play('check');
      } else if (payload.move?.san?.includes('x')) {
        soundManager.play('capture');
      } else {
        soundManager.play('move');
      }

      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentFen: payload.fen,
          currentTurn: payload.currentTurn,
          positionVersion: payload.positionVersion,
          isCheck: payload.isCheck,
          moves: [...prev.moves, payload.move],
        };
      });
    };

    const handleClockSync = (payload: ClockUpdatePayload) => {
      setWhiteClockMs(payload.whiteRemainingMs);
      setBlackClockMs(payload.blackRemainingMs);
    };

    const handleGameOver = (payload: GameOverPayload) => {
      setGameOverData(payload);
      soundManager.play('gameover');
      if (payload.winnerId === user?.id) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    };

    const handleChatMessage = (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const handleDrawOffered = (data: { offeredBy: string }) => {
      setIncomingDrawOffer(data.offeredBy);
    };

    const handleMoveRejected = () => {
      if (gameState?.currentFen) {
        setBoardFen(gameState.currentFen);
        localChessRef.current = new Chess(gameState.currentFen);
      }
    };

    const handleSocketError = (err: any) => {
      if (
        err?.code === 'MOVE_ERROR' ||
        err?.code === 'UNAUTHORIZED' ||
        err?.message?.includes('nước đi') ||
        err?.message?.includes('lượt')
      ) {
        handleMoveRejected();
      }
    };

    socket.on(SOCKET_EVENTS.MOVE_RESULT, handleMoveResult);
    socket.on(SOCKET_EVENTS.MOVE_REJECTED, handleMoveRejected);
    socket.on(SOCKET_EVENTS.ERROR, handleSocketError);
    socket.on(SOCKET_EVENTS.CLOCK_UPDATE, handleClockSync);
    socket.on(SOCKET_EVENTS.GAME_OVER, handleGameOver);
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
    socket.on(SOCKET_EVENTS.DRAW_OFFERED, handleDrawOffered);

    return () => {
      socket.off(SOCKET_EVENTS.MOVE_RESULT, handleMoveResult);
      socket.off(SOCKET_EVENTS.MOVE_REJECTED, handleMoveRejected);
      socket.off(SOCKET_EVENTS.ERROR, handleSocketError);
      socket.off(SOCKET_EVENTS.CLOCK_UPDATE, handleClockSync);
      socket.off(SOCKET_EVENTS.GAME_OVER, handleGameOver);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
      socket.off(SOCKET_EVENTS.DRAW_OFFERED, handleDrawOffered);
    };
  }, [gameId, isWaitingRoom, socket, user]);

  // Local clock tick when in progress
  useEffect(() => {
    if (!gameState || gameState.status !== 'IN_PROGRESS' || gameOverData) return;

    const interval = setInterval(() => {
      if (gameState.currentTurn === 'w') {
        setWhiteClockMs((prev) => Math.max(0, prev - 1000));
      } else {
        setBlackClockMs((prev) => Math.max(0, prev - 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState?.currentTurn, gameState?.status, gameOverData]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    if (!isPlayer || !gameId || gameOverData) return false;

    // Check client-side valid move
    try {
      const moveAttempt = localChessRef.current.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
      if (!moveAttempt) return false;
      localChessRef.current.undo();
      if (moveAttempt.captured) {
        soundManager.play('capture');
      } else {
        soundManager.play('move');
      }
    } catch {
      return false;
    }

    socket.emit(
      SOCKET_EVENTS.MOVE,
      {
        gameId,
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
        expectedVersion: gameState?.positionVersion ?? 0,
      },
      (ack: any) => {
        if (ack && !ack.success) {
          if (gameState?.currentFen) {
            setBoardFen(gameState.currentFen);
            localChessRef.current = new Chess(gameState.currentFen);
          }
        }
      }
    );

    return true;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !gameId) return;

    socket.emit(SOCKET_EVENTS.CHAT, {
      gameId,
      message: inputMessage.trim(),
    });
    setInputMessage('');
  };

  const handleResign = () => {
    if (!gameId) return;
    socket.emit(SOCKET_EVENTS.RESIGN, { gameId });
    setShowResignModal(false);
  };

  const handleOfferDraw = () => {
    if (!gameId) return;
    socket.emit(SOCKET_EVENTS.DRAW_OFFER, { gameId });
    alert('Đã gửi lời mời cầu hòa tới đối thủ');
  };

  const handleAcceptDraw = () => {
    if (!gameId) return;
    socket.emit(SOCKET_EVENTS.DRAW_ACCEPT, { gameId });
    setIncomingDrawOffer(null);
  };

  const handleRejectDraw = () => {
    if (!gameId) return;
    socket.emit(SOCKET_EVENTS.DRAW_REJECT, { gameId });
    setIncomingDrawOffer(null);
  };

  const handleClaimTimeout = () => {
    if (!gameId) return;
    socket.emit(SOCKET_EVENTS.CLAIM_TIMEOUT, { gameId });
  };

  const formatClock = (ms: number) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isMyTurn =
    gameState?.status === 'IN_PROGRESS' &&
    ((gameState?.currentTurn === 'w' && isWhitePlayer) ||
      (gameState?.currentTurn === 'b' && isBlackPlayer));

  // Custom square highlighting for last move
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMoveSquares.from) {
    customSquareStyles[lastMoveSquares.from] = { backgroundColor: 'rgba(56, 189, 248, 0.35)' };
  }
  if (lastMoveSquares.to) {
    customSquareStyles[lastMoveSquares.to] = { backgroundColor: 'rgba(56, 189, 248, 0.45)' };
  }

  const isTopPlayerTurn =
    gameState?.currentTurn === (orientation === 'white' ? 'b' : 'w') && !gameOverData;
  const isBottomPlayerTurn =
    gameState?.currentTurn === (orientation === 'white' ? 'w' : 'b') && !gameOverData;

  const topClockMs = orientation === 'white' ? blackClockMs : whiteClockMs;
  const bottomClockMs = orientation === 'white' ? whiteClockMs : blackClockMs;

  if (isWaitingRoom) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center">
        <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-card text-center relative overflow-hidden">
          {/* Animated pulse radar */}
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-sky-400/20 animate-ping" />
            <span className="absolute inset-2 rounded-full bg-sky-200/40 animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-sky-500/25 relative z-10">
              <Swords className="w-8 h-8" />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            Đang Chờ Đối Thủ Tham Gia
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            Phòng đấu đã được khởi tạo. Hãy gửi mã phòng hoặc link mời trực tiếp cho bạn bè để bắt đầu thi đấu.
          </p>

          {/* Room Code Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 mb-6 flex flex-col items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Mã Phòng Của Bạn
            </span>
            <div className="font-mono text-3xl sm:text-4xl font-black text-sky-700 tracking-widest tabular-nums select-all">
              {roomCodeParam || '...'}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
              <button
                type="button"
                onClick={copyCode}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-subtle transition-all active:scale-[0.98]"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{copiedCode ? 'Đã sao chép mã!' : 'Sao chép mã'}</span>
              </button>
              <button
                type="button"
                onClick={copyInviteLink}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4 text-white" />}
                <span>{copiedLink ? 'Đã sao chép link!' : 'Sao chép link mời'}</span>
              </button>
            </div>
          </div>

          {/* Cancel button */}
          <button
            type="button"
            onClick={handleCancelWaitingRoom}
            className="w-full py-3 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.98]"
          >
            Hủy Phòng & Quay Lại Sảnh Chờ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-6 items-start">
      {/* Left: Chessboard & Player Info */}
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col gap-3">
        {/* Top Player (Opponent) */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between transition-all duration-150 ${
            isTopPlayerTurn
              ? 'bg-sky-50/90 border-sky-400 shadow-card ring-1 ring-sky-300'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
              <PieceSvg type="k" color={orientation === 'white' ? 'b' : 'w'} className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">
                {orientation === 'white'
                  ? gameState?.blackPlayerName || 'Đối thủ'
                  : gameState?.whitePlayerName || 'Đối thủ'}
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                ELO:{' '}
                {orientation === 'white'
                  ? gameState?.blackPlayerRating || 1200
                  : gameState?.whitePlayerRating || 1200}
              </div>
            </div>
          </div>

          {/* Clock */}
          <div
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono tabular-nums text-lg font-bold flex items-center gap-2 tracking-tight transition-colors ${
              isTopPlayerTurn
                ? topClockMs < 30000
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatClock(topClockMs)}</span>
          </div>
        </div>

        {/* The Interactive Chessboard */}
        <div className="w-full aspect-square bg-white p-2.5 sm:p-3 rounded-2xl shadow-card border border-slate-200/90">
          <Chessboard
            position={boardFen}
            onPieceDrop={onPieceDrop}
            boardOrientation={orientation}
            arePiecesDraggable={isPlayer && !gameOverData && isMyTurn}
            customBoardStyle={{
              borderRadius: '12px',
              boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.05)',
            }}
            customDarkSquareStyle={{ backgroundColor: '#6ba3c8' }}
            customLightSquareStyle={{ backgroundColor: '#f0f5fa' }}
            customSquareStyles={customSquareStyles}
          />
        </div>

        {/* Bottom Player (You) */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between transition-all duration-150 ${
            isBottomPlayerTurn
              ? 'bg-sky-50/90 border-sky-400 shadow-card ring-1 ring-sky-300'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
              <PieceSvg type="k" color={orientation === 'white' ? 'w' : 'b'} className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>
                  {orientation === 'white'
                    ? gameState?.whitePlayerName || user?.username || 'Bạn'
                    : gameState?.blackPlayerName || user?.username || 'Bạn'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 font-semibold">
                  Bạn
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                ELO:{' '}
                {orientation === 'white'
                  ? gameState?.whitePlayerRating || user?.eloRating || 1200
                  : gameState?.blackPlayerRating || user?.eloRating || 1200}
              </div>
            </div>
          </div>

          {/* Clock */}
          <div
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono tabular-nums text-lg font-bold flex items-center gap-2 tracking-tight transition-colors ${
              isBottomPlayerTurn
                ? bottomClockMs < 30000
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatClock(bottomClockMs)}</span>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOrientation((prev) => (prev === 'white' ? 'black' : 'white'))}
              aria-label="Xoay hướng bàn cờ"
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-subtle active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4 text-sky-600" />
              <span>Xoay bàn cờ</span>
            </button>

            <button
              onClick={toggleSound}
              aria-label={soundEnabled ? 'Tắt âm thanh ván đấu' : 'Bật âm thanh ván đấu'}
              title="Âm thanh"
              className={`px-3 py-2 border text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-subtle active:scale-[0.98] ${
                soundEnabled
                  ? 'bg-sky-50 border-sky-300 text-sky-800'
                  : 'bg-white border-slate-200/90 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-sky-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span className="hidden sm:inline">Âm thanh</span>
            </button>
          </div>

          {isPlayer && !gameOverData && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleOfferDraw}
                className="px-3.5 py-2 bg-white hover:bg-amber-50 border border-slate-200/90 hover:border-amber-300 text-slate-700 hover:text-amber-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-subtle active:scale-[0.98]"
              >
                <Handshake className="w-4 h-4 text-amber-500" />
                <span>Cầu hòa</span>
              </button>
              <button
                onClick={() => setShowResignModal(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-subtle active:scale-[0.98]"
              >
                <Flag className="w-4 h-4 text-rose-500" />
                <span>Đầu hàng</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Move History & In-Game Chat Panel */}
      <div className="w-full lg:w-96 flex flex-col gap-4 self-stretch">
        {/* Move History */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col h-64 shadow-card">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-sky-600" />
              Nước Đi Trận Đấu
            </span>
            <span className="font-mono tabular-nums text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
              {gameState?.moves?.length || 0}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto mt-2 space-y-1 text-sm font-mono tabular-nums pr-2">
            {gameState?.moves && gameState.moves.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {gameState.moves.map((m, idx) => (
                  <div
                    key={idx}
                    className={`px-2 py-1 rounded-lg transition-colors ${
                      idx === gameState.moves.length - 1
                        ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200/60'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m.ply % 2 !== 0 && (
                      <span className="text-slate-400 mr-2">{Math.ceil(m.ply / 2)}.</span>
                    )}
                    <span>{m.san}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Chưa có nước đi nào</p>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex-1 flex flex-col shadow-card min-h-[350px]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-sky-600" />
            <span>Trò Chuyện Trong Trận</span>
          </div>

          <div className="flex-1 overflow-y-auto my-3 space-y-2.5 text-xs pr-1">
            {chatMessages.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Gửi lời chào tới đối thủ...</p>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl max-w-[85%] ${
                    msg.senderId === user?.id
                      ? 'ml-auto bg-sky-600 text-white rounded-br-none shadow-subtle'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                  }`}
                >
                  <div
                    className={`font-semibold text-[10px] mb-0.5 ${
                      msg.senderId === user?.id ? 'text-sky-100' : 'text-slate-500'
                    }`}
                  >
                    {msg.senderUsername}
                  </div>
                  <div>{msg.content}</div>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              maxLength={500}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              aria-label="Gửi tin nhắn"
              className="p-2.5 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white rounded-xl shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Incoming Draw Offer Modal */}
      {incomingDrawOffer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 text-center shadow-modal animate-in fade-in zoom-in-95 duration-150">
            <Handshake className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Đối Thủ Đề Nghị Hòa</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Kỳ thủ <strong className="text-slate-800">{incomingDrawOffer}</strong> muốn kết thúc trận đấu với kết quả hòa. Bạn có đồng ý không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRejectDraw}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Từ Chối
              </button>
              <button
                onClick={handleAcceptDraw}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Chấp Nhận Hòa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resign Confirmation Modal */}
      {showResignModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 text-center shadow-modal animate-in fade-in zoom-in-95 duration-150">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Xác Nhận Đầu Hàng?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn đầu hàng không? Điểm ELO của bạn sẽ bị trừ sau khi chấp nhận thua ván này.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResignModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Tiếp Tục Chơi
              </button>
              <button
                onClick={handleResign}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Đầu Hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOverData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-modal animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-sky-50 border border-sky-200 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-sky-600" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">
              Trận Đấu Kết Thúc
            </h2>
            <div className="text-lg font-bold text-sky-600 mb-1">
              {gameOverData.result === 'WHITE_WON'
                ? 'Quân Trắng Thắng!'
                : gameOverData.result === 'BLACK_WON'
                ? 'Quân Đen Thắng!'
                : 'Trận Đấu Hòa!'}
            </div>
            <p className="text-xs text-slate-500 mb-6 uppercase tracking-wider font-semibold">
              Lý do: {gameOverData.terminationReason}
            </p>

            {/* ELO Changes display */}
            {gameOverData.whiteEloChange !== undefined && (
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-200/80 grid grid-cols-2 gap-4 text-xs font-mono tabular-nums">
                <div>
                  <div className="text-slate-500 mb-1 font-sans">Quân Trắng</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {gameOverData.newWhiteElo} ELO
                  </div>
                  <div
                    className={`font-semibold ${
                      gameOverData.whiteEloChange >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {gameOverData.whiteEloChange >= 0 ? '+' : ''}
                    {gameOverData.whiteEloChange}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-sans">Quân Đen</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {gameOverData.newBlackElo} ELO
                  </div>
                  <div
                    className={`font-semibold ${
                      gameOverData.blackEloChange !== undefined && gameOverData.blackEloChange >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {gameOverData.blackEloChange !== undefined && gameOverData.blackEloChange >= 0
                      ? '+'
                      : ''}
                    {gameOverData.blackEloChange}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/history?replay=${gameId}`)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
              >
                Xem Lại Trận
              </button>
              <button
                onClick={() => navigate('/lobby')}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all active:scale-[0.98]"
              >
                Về Sảnh Chờ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
