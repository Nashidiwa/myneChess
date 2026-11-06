import { useState, useRef, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { soundManager } from '../../lib/sound';
import {
  GameState,
  AIDifficulty,
  TIME_CONTROLS,
  AISearchStats,
} from '@online-chess/shared';
import {
  RotateCcw,
  RotateCw,
  Trophy,
  Play,
  Lightbulb,
  Volume2,
  VolumeX,
  Flag,
  Clock,
  ShieldAlert,
  X,
  Swords,
  BookOpen,
  Compass,
  Bot,
  User,
  SlidersHorizontal,
} from 'lucide-react';

// Chess.com style piece vector icons for captured pieces & status badges
export function PieceSvg({
  type,
  color,
  className = 'w-4 h-4',
}: {
  type: string;
  color: 'w' | 'b';
  className?: string;
}) {
  const isWhite = color === 'w';
  const fill = isWhite ? '#ffffff' : '#1e293b';
  const stroke = isWhite ? '#475569' : '#0f172a';

  switch (type.toLowerCase()) {
    case 'p':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'n':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="m 22,10 c 10.5,1 16.5,8 16,29 H 15 c 0,-9 10,-6.5 8,-21"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.042,-0.94 1.41,-3.04 0,-3 -1,0 0.19,1.23 -1,2 -1,0 -4.003,1 -4,-4 0,-2 6,-12 6,-12 0,0 1.89,-1.9 2,-3.5 -0.73,-0.994 -0.5,-2 -1,-3 3,0 6,1 8.5,4 1.5,1.5 2.5,4 2.5,6.5 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'b':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
            <path d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,1 -3.39,-0.97 -10.11,0.46 -13.5,-1 -3.39,1.46 -10.11,0.03 -13.5,1 -1.354,-0.01 -2.324,-0.03 -3,-1 1.35,-1.46 3,-2 3,-2 z" />
            <path d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 0.5,-1.5 0,-2 0,-2 0,-2.5 -2.5,-4 -2.5,-4 5.5,-1.5 6,-11.5 -5,-15.5 -11,4 -10.5,14 -5,15.5 0,0 -2.5,1.5 -2.5,4 0,0 -0.5,0.5 0,2 z" />
            <path d="m 25,8 a 2.5,2.5 0 1 1 -5,0 2.5,2.5 0 1 1 5,0 z" />
            <path
              d="m 17.5,26 h 10 M 20,20 h 5 M 22.5,17.5 v 5"
              stroke={isWhite ? '#475569' : '#ffffff'}
            />
          </g>
        </svg>
      );
    case 'r':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
            <path d="m 9,39 h 27 v -3 H 9 v 3 z m 3,-3 v -4 h 21 v 4 H 12 z m -1,-22 v -4 h 4 v 2 h 5 v -2 h 5 v 2 h 5 v -2 h 4 v 4 z m 2,1 v 17 h 17 v -17 z" />
          </g>
        </svg>
      );
    case 'q':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
            <path d="m 9,26 c 8.5,-1.5 21,-1.5 27,0 l 2,-12 -7,11 -7,-14 -7,14 -7,-11 2,12 z" />
            <path d="m 9,31 c 8,0 19,0 27,0 v 5 H 9 v -5 z" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="14" cy="9" r="2" />
            <circle cx="22.5" cy="8" r="2" />
            <circle cx="31" cy="9" r="2" />
            <circle cx="39" cy="12" r="2" />
          </g>
        </svg>
      );
    case 'k':
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
            <path d="m 22.5,11.63 v 6 M 20,13 h 5" stroke={stroke} />
            <path d="m 22.5,25 c 0,0 4.5,-7.5 3,-10.5 -1.5,-3 -6,-3 -7.5,0 -1.5,3 3,10.5 3,10.5" />
            <path d="m 11.5,37 c 5.5,3.5 15.5,3.5 21,0 v -7 c 0,0 9,-4.5 6,-10.5 -4,-8 -12,2 -16,2 -4,0 -12,-10 -16,-2 -3,6 6,10.5 6,10.5 v 7 z" />
          </g>
        </svg>
      );
    default:
      return null;
  }
}

export default function AIGamePage() {
  const { user } = useAuthStore();

  // Game Setup Configuration
  const [difficulty, setDifficulty] = useState<AIDifficulty>('MEDIUM');
  const [selectedTimeKey, setSelectedTimeKey] = useState<keyof typeof TIME_CONTROLS>('RAPID_10');
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | 'random'>('white');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Game Play State
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [boardFen, setBoardFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiStats, setAiStats] = useState<AISearchStats | null>(null);
  const [gameOverResult, setGameOverResult] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<{ ply: number; san: string; from: string; to: string }[]>([]);

  // Legal moves & Selection state
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [captureMoves, setCaptureMoves] = useState<Set<string>>(new Set());
  const [lastMoveSquares, setLastMoveSquares] = useState<{ from?: string; to?: string }>({});
  const [isCheck, setIsCheck] = useState(false);

  // User Settings
  const [showHints, setShowHints] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  // Clocks
  const [humanTimeMs, setHumanTimeMs] = useState(600000);
  const [aiTimeMs, setAiTimeMs] = useState(600000);

  const localChessRef = useRef(new Chess());
  const moveHistoryContainerRef = useRef<HTMLDivElement>(null);

  // Sound Effects via SoundManager
  const playSound = useCallback((type: 'move' | 'capture' | 'check' | 'gameover') => {
    soundManager.play(type);
  }, []);

  const toggleSound = () => {
    const newVal = soundManager.toggle();
    setSoundEnabled(newVal);
  };

  // Clock countdown ticker
  useEffect(() => {
    if (!gameState || gameState.status !== 'IN_PROGRESS' || gameOverResult) return;

    const interval = setInterval(() => {
      const isHumanWhite = gameState.whitePlayerId !== 'ai-engine';
      const isHumanTurn =
        (gameState.currentTurn === 'w' && isHumanWhite) ||
        (gameState.currentTurn === 'b' && !isHumanWhite);

      if (isHumanTurn) {
        setHumanTimeMs((prev) => Math.max(0, prev - 1000));
      } else {
        setAiTimeMs((prev) => Math.max(0, prev - 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, gameOverResult]);

  // Auto-scroll move history container internally without scrolling the page
  useEffect(() => {
    if (moveHistoryContainerRef.current) {
      moveHistoryContainerRef.current.scrollTop = moveHistoryContainerRef.current.scrollHeight;
    }
  }, [moveHistory]);

  // Format Clock MM:SS
  const formatTime = (ms: number) => {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Find King square for check warning highlight
  const findKingSquare = (chess: Chess, color: 'w' | 'b'): string | null => {
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          const file = String.fromCharCode('a'.charCodeAt(0) + c);
          const rank = 8 - r;
          return `${file}${rank}`;
        }
      }
    }
    return null;
  };

  // Calculate captured pieces
  const getCapturedStats = (chess: Chess) => {
    const initialCounts: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentW: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    const currentB: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };

    const board = chess.board();
    for (const row of board) {
      for (const piece of row) {
        if (piece && piece.type !== 'k') {
          if (piece.color === 'w') currentW[piece.type]++;
          else currentB[piece.type]++;
        }
      }
    }

    const whiteCaptured: { type: string; count: number }[] = [];
    const blackCaptured: { type: string; count: number }[] = [];

    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    let whiteMat = 0;
    let blackMat = 0;

    for (const [type, init] of Object.entries(initialCounts)) {
      const lostByWhite = Math.max(0, init - currentW[type]);
      const lostByBlack = Math.max(0, init - currentB[type]);
      if (lostByWhite > 0) whiteCaptured.push({ type, count: lostByWhite });
      if (lostByBlack > 0) blackCaptured.push({ type, count: lostByBlack });
      whiteMat += currentW[type] * pieceValues[type];
      blackMat += currentB[type] * pieceValues[type];
    }

    return {
      whiteCaptured,
      blackCaptured,
      materialAdvantage: whiteMat - blackMat,
    };
  };

  const capturedStats = getCapturedStats(localChessRef.current);

  const renderCapturedPieces = (
    pieces: { type: string; count: number }[],
    pieceColor: 'w' | 'b'
  ) => {
    if (pieces.length === 0) return null;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {pieces.map((c) => (
          <span
            key={c.type}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/80 shadow-[0_1px_1px_rgba(0,0,0,0.03)]"
            title={`${c.count} ${c.type.toUpperCase()}`}
          >
            <PieceSvg type={c.type} color={pieceColor} className="w-3.5 h-3.5" />
            {c.count > 1 && (
              <span className="text-[10px] font-bold font-mono text-slate-600">
                ×{c.count}
              </span>
            )}
          </span>
        ))}
      </div>
    );
  };

  // Initialize or Restart Game
  const handleStartGame = async () => {
    try {
      setShowConfigModal(false);
      setGameOverResult(null);
      setAiStats(null);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves(new Set());
      setLastMoveSquares({});
      setMoveHistory([]);

      const tc = TIME_CONTROLS[selectedTimeKey];
      setHumanTimeMs(tc.initialTimeMs);
      setAiTimeMs(tc.initialTimeMs);

      const res = await api.post('/ai/game', {
        difficulty,
        initialTimeMs: tc.initialTimeMs,
        incrementMs: tc.incrementMs,
        playerColor,
      });

      if (res.data.success && res.data.data) {
        const game: GameState = res.data.data;
        setGameState(game);
        setBoardFen(game.currentFen);
        localChessRef.current = new Chess(game.currentFen);

        const isHumanWhite = game.whitePlayerId !== 'ai-engine';
        setOrientation(isHumanWhite ? 'white' : 'black');
        setIsCheck(localChessRef.current.inCheck());

        if (game.moves && game.moves.length > 0) {
          setMoveHistory(
            game.moves.map((m: any) => ({
              ply: m.ply,
              san: m.san,
              from: m.fromSquare,
              to: m.toSquare,
            }))
          );
          const lastM = game.moves[game.moves.length - 1];
          setLastMoveSquares({ from: lastM.fromSquare, to: lastM.toSquare });
          playSound(lastM.san.includes('x') ? 'capture' : 'move');
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể khởi tạo ván đấu với máy');
    }
  };

  // Trigger AI to make a move
  const triggerAiResponse = async (gameId: string) => {
    setIsAiThinking(true);
    try {
      const res = await api.post('/ai/move', { gameId });
      if (res.data.success && res.data.data) {
        const moveRes = res.data.data;
        setBoardFen(moveRes.fen);
        localChessRef.current = new Chess(moveRes.fen);
        setAiStats(res.data.stats);

        const aiCheck = localChessRef.current.inCheck();
        setIsCheck(aiCheck);

        // Update last move highlight
        if (moveRes.move) {
          setLastMoveSquares({ from: moveRes.move.fromSquare, to: moveRes.move.toSquare });
          setMoveHistory((prev) => [
            ...prev,
            {
              ply: moveRes.move.ply,
              san: moveRes.move.san,
              from: moveRes.move.fromSquare,
              to: moveRes.move.toSquare,
            },
          ]);
        }

        // Sound effect
        if (moveRes.isGameOver) {
          playSound('gameover');
        } else if (aiCheck) {
          playSound('check');
        } else if (moveRes.move?.san?.includes('x')) {
          playSound('capture');
        } else {
          playSound('move');
        }

        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentFen: moveRes.fen,
            currentTurn: moveRes.currentTurn,
            positionVersion: moveRes.positionVersion,
            isCheck: moveRes.isCheck,
            moves: [...prev.moves, moveRes.move],
          };
        });

        if (moveRes.isGameOver) {
          const resultStr =
            moveRes.result === 'WHITE_WON'
              ? 'Trắng thắng!'
              : moveRes.result === 'BLACK_WON'
              ? 'Đen thắng!'
              : 'Trận đấu hòa!';
          setGameOverResult(`${resultStr} (${moveRes.terminationReason})`);
          if (
            (moveRes.result === 'WHITE_WON' && orientation === 'white') ||
            (moveRes.result === 'BLACK_WON' && orientation === 'black')
          ) {
            confetti({ particleCount: 90, spread: 70 });
          }
        }
      }
    } catch (err: any) {
      console.error('AI move error', err);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Perform Human Move
  const executeMove = useCallback(
    (sourceSquare: string, targetSquare: string, promotion: string = 'q'): boolean => {
      if (!gameState || gameState.status !== 'IN_PROGRESS' || isAiThinking || gameOverResult) {
        return false;
      }

      const isHumanWhite = gameState.whitePlayerId !== 'ai-engine';
      const isHumanTurn =
        (gameState.currentTurn === 'w' && isHumanWhite) ||
        (gameState.currentTurn === 'b' && !isHumanWhite);

      if (!isHumanTurn) return false;

      // Validate on local chess instance
      const localChess = localChessRef.current;
      const testMove = localChess.move({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        promotion,
      });

      if (!testMove) return false;
      localChess.undo();

      // Sound
      if (testMove.captured) playSound('capture');
      else playSound('move');

      // Optimistic local state update
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves(new Set());
      setLastMoveSquares({ from: sourceSquare, to: targetSquare });

      // Call API
      api
        .post(`/games/${gameState.id}/move`, {
          from: sourceSquare,
          to: targetSquare,
          promotion,
          expectedVersion: gameState.positionVersion,
        })
        .then((res) => {
          if (res.data.success) {
            const moveRes = res.data.data;
            setBoardFen(moveRes.fen);
            localChessRef.current = new Chess(moveRes.fen);
            setIsCheck(localChessRef.current.inCheck());

            if (moveRes.move) {
              setMoveHistory((prev) => [
                ...prev,
                {
                  ply: moveRes.move.ply,
                  san: moveRes.move.san,
                  from: moveRes.move.fromSquare,
                  to: moveRes.move.toSquare,
                },
              ]);
            }

            setGameState((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                currentFen: moveRes.fen,
                currentTurn: moveRes.currentTurn,
                positionVersion: moveRes.positionVersion,
                isCheck: moveRes.isCheck,
                moves: [...prev.moves, moveRes.move],
              };
            });

            if (moveRes.isGameOver) {
              playSound('gameover');
              const resultStr =
                moveRes.result === 'WHITE_WON'
                  ? 'Trắng thắng!'
                  : moveRes.result === 'BLACK_WON'
                  ? 'Đen thắng!'
                  : 'Hòa!';
              setGameOverResult(`${resultStr} (${moveRes.terminationReason})`);
              if (
                (moveRes.result === 'WHITE_WON' && isHumanWhite) ||
                (moveRes.result === 'BLACK_WON' && !isHumanWhite)
              ) {
                confetti({ particleCount: 100, spread: 80 });
              }
            } else {
              triggerAiResponse(gameState.id);
            }
          }
        })
        .catch(() => {
          setBoardFen(gameState.currentFen);
          localChessRef.current = new Chess(gameState.currentFen);
        });

      return true;
    },
    [gameState, isAiThinking, gameOverResult, orientation, playSound]
  );

  // Square Click handler (Click-to-Move + Legal moves calculation)
  const handleSquareClick = (square: Square) => {
    if (!gameState || gameState.status !== 'IN_PROGRESS' || isAiThinking || gameOverResult) {
      return;
    }

    const isHumanWhite = gameState.whitePlayerId !== 'ai-engine';
    const isHumanTurn =
      (gameState.currentTurn === 'w' && isHumanWhite) ||
      (gameState.currentTurn === 'b' && !isHumanWhite);

    if (!isHumanTurn) return;

    // If a piece is already selected and target square is a legal destination -> Move!
    if (selectedSquare && possibleMoves.includes(square)) {
      executeMove(selectedSquare, square, 'q');
      return;
    }

    // Check if the clicked square contains a piece belonging to the human player
    const piece = localChessRef.current.get(square);
    const humanColor = isHumanWhite ? 'w' : 'b';

    if (piece && piece.color === humanColor) {
      setSelectedSquare(square);
      const moves = localChessRef.current.moves({ square, verbose: true });
      const targets = moves.map((m) => m.to);
      const captures = new Set(moves.filter((m) => !!m.captured).map((m) => m.to));
      setPossibleMoves(targets);
      setCaptureMoves(captures);
    } else {
      // Clicked on an invalid square or empty square -> Deselect
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureMoves(new Set());
    }
  };

  // Drag begin handler
  const handlePieceDragBegin = (_piece: string, sourceSquare: Square) => {
    if (!gameState || gameState.status !== 'IN_PROGRESS' || isAiThinking || gameOverResult) {
      return;
    }

    const isHumanWhite = gameState.whitePlayerId !== 'ai-engine';
    const humanColor = isHumanWhite ? 'w' : 'b';
    const pieceObj = localChessRef.current.get(sourceSquare);

    if (pieceObj && pieceObj.color === humanColor) {
      setSelectedSquare(sourceSquare);
      const moves = localChessRef.current.moves({ square: sourceSquare, verbose: true });
      setPossibleMoves(moves.map((m) => m.to));
      setCaptureMoves(new Set(moves.filter((m) => !!m.captured).map((m) => m.to)));
    }
  };

  // Drag drop handler
  const handlePieceDrop = (sourceSquare: Square, targetSquare: Square) => {
    setSelectedSquare(null);
    setPossibleMoves([]);
    setCaptureMoves(new Set());
    return executeMove(sourceSquare, targetSquare, 'q');
  };

  // Resign match
  const handleResign = async () => {
    if (!gameState || gameState.status !== 'IN_PROGRESS') return;
    if (confirm('Bạn có chắc chắn muốn xin thua ván này không?')) {
      const isHumanWhite = gameState.whitePlayerId !== 'ai-engine';
      const winner = isHumanWhite ? 'Máy (Quân Đen)' : 'Máy (Quân Trắng)';
      setGameOverResult(`${winner} thắng (Bạn xin thua)`);
      playSound('gameover');
      try {
        await api.post(`/games/${gameState.id}/resign`);
      } catch {}
    }
  };

  // Build custom square styles for hints, selection, last move, check
  const getCustomSquareStyles = (): Record<string, React.CSSProperties> => {
    const styles: Record<string, React.CSSProperties> = {};

    // 1. Last move squares highlight (gentle sky blue warmth)
    if (lastMoveSquares.from) {
      styles[lastMoveSquares.from] = {
        backgroundColor: 'rgba(56, 189, 248, 0.25)',
      };
    }
    if (lastMoveSquares.to) {
      styles[lastMoveSquares.to] = {
        backgroundColor: 'rgba(56, 189, 248, 0.38)',
      };
    }

    // 2. Selected square highlight
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(14, 165, 233, 0.32)',
        boxShadow: 'inset 0 0 0 2px #0284c7',
      };
    }

    // 3. Legal move dots & capture rings
    if (showHints) {
      possibleMoves.forEach((sq) => {
        const isCapture = captureMoves.has(sq);
        if (isCapture) {
          // Warm red target circle around enemy piece
          styles[sq] = {
            background:
              'radial-gradient(circle, transparent 56%, rgba(239, 68, 68, 0.65) 57%, rgba(239, 68, 68, 0.65) 72%, transparent 73%)',
            cursor: 'pointer',
            borderRadius: '50%',
          };
        } else {
          // Soft blue circular dot on empty square
          styles[sq] = {
            background:
              'radial-gradient(circle, rgba(14, 165, 233, 0.75) 23%, transparent 24%)',
            cursor: 'pointer',
            borderRadius: '50%',
          };
        }
      });
    }

    // 4. King in check highlight
    if (isCheck) {
      const kingSq = findKingSquare(localChessRef.current, localChessRef.current.turn());
      if (kingSq) {
        styles[kingSq] = {
          background:
            'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.85) 0%, rgba(239, 68, 68, 0.4) 45%, transparent 75%)',
        };
      }
    }

    return styles;
  };

  // Whose turn is it right now?
  const isHumanTurn =
    gameState &&
    gameState.status === 'IN_PROGRESS' &&
    ((gameState.currentTurn === 'w' && gameState.whitePlayerId !== 'ai-engine') ||
      (gameState.currentTurn === 'b' && gameState.blackPlayerId !== 'ai-engine'));

  // Evaluation centipawns conversion
  const evalPawns = aiStats ? (aiStats.score / 100).toFixed(1) : '0.0';

  // Human-friendly game assessment message
  const getGameAssessment = () => {
    if (!aiStats) return 'Ván cờ vừa bắt đầu, chưa có đánh giá thế trận.';
    const score = aiStats.score;
    const isHumanWhite = gameState?.whitePlayerId !== 'ai-engine';
    const humanScore = isHumanWhite ? score : -score;

    if (Math.abs(score) < 50) return '⚖️ Thế trận đang giằng co rất cân bằng!';
    if (humanScore > 150) return '🌟 Bạn đang chiếm ưu thế rõ rệt, hãy duy trì nhịp độ!';
    if (humanScore > 50) return '📈 Bạn đang có chút lợi thế nhỏ về vị trí hoặc quân số.';
    if (humanScore < -150) return '🛡️ Máy đang tạo áp lực mạnh, hãy cẩn trọng bảo vệ Vua!';
    return '⚔️ Máy đang dẫn trước một chút, cơ hội phản công vẫn còn!';
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex-1 flex flex-col gap-3.5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Luyện Tập Với Máy</span>
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70">
              {difficulty === 'EASY' ? 'Bot Tập sự' : difficulty === 'MEDIUM' ? 'Bot Kỳ thủ' : 'Bot Cao thủ'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Luyện tập cờ vua cùng máy thông minh — hỗ trợ gợi ý nước đi và nhận định thế trận
          </p>
        </div>

        {/* Live Status Pill & Action button */}
        <div className="flex items-center gap-2">
          {isCheck && !gameOverResult && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 font-semibold text-xs border border-red-200 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              Chiếu tướng!
            </div>
          )}

          {isAiThinking ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
              <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Máy đang suy nghĩ...
            </div>
          ) : isHumanTurn && !gameOverResult ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Đến lượt bạn
            </div>
          ) : gameOverResult ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              {gameOverResult}
            </div>
          ) : null}

          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm shadow-sky-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Ván mới
          </button>
        </div>
      </div>

      {/* Main Playing Area: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Board & Player Info (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-2 max-w-[550px] mx-auto w-full">
          {/* Opponent Card (AI) - Chess.com style */}
          <div
            className={`px-3.5 py-2.5 bg-white rounded-2xl flex items-center justify-between transition-all shadow-sm border ${
              !isHumanTurn && !gameOverResult && gameState
                ? 'border-sky-300 ring-2 ring-sky-100'
                : 'border-slate-200/90'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 shadow-sm">
                  <Bot className="w-5 h-5 text-sky-600" />
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200"
                  title="Trực tuyến"
                />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>
                    {difficulty === 'EASY'
                      ? 'Bot Tập Sự'
                      : difficulty === 'MEDIUM'
                      ? 'Bot Kỳ Thủ'
                      : 'Bot Cao Thủ'}
                  </span>
                  <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                    {difficulty === 'EASY' ? '1000' : difficulty === 'MEDIUM' ? '1500' : '2000'}
                  </span>
                </div>
                {/* Captured pieces by AI */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 min-h-[18px]">
                  {renderCapturedPieces(
                    orientation === 'white'
                      ? capturedStats.whiteCaptured
                      : capturedStats.blackCaptured,
                    orientation === 'white' ? 'w' : 'b'
                  )}
                  {orientation === 'white' && capturedStats.materialAdvantage < 0 && (
                    <span className="font-bold text-slate-600 text-[10px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                      +{Math.abs(capturedStats.materialAdvantage)}
                    </span>
                  )}
                  {orientation === 'black' && capturedStats.materialAdvantage > 0 && (
                    <span className="font-bold text-slate-600 text-[10px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                      +{capturedStats.materialAdvantage}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Clock */}
            <div
              className={`px-3 py-1.5 rounded-xl font-mono tabular-nums text-sm font-bold flex items-center gap-1.5 transition-all ${
                !isHumanTurn && !gameOverResult && gameState
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatTime(aiTimeMs)}
            </div>
          </div>

          {/* Interactive Chessboard Container */}
          <div className="w-full aspect-square bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm border border-slate-200/90 relative">
            <Chessboard
              position={boardFen}
              onPieceDrop={handlePieceDrop}
              onSquareClick={handleSquareClick}
              onPieceDragBegin={handlePieceDragBegin}
              boardOrientation={orientation}
              arePiecesDraggable={!!gameState && !gameOverResult && !isAiThinking}
              customBoardStyle={{
                borderRadius: '14px',
              }}
              customDarkSquareStyle={{ backgroundColor: '#6ba3c8' }}
              customLightSquareStyle={{ backgroundColor: '#f0f5fa' }}
              customSquareStyles={getCustomSquareStyles()}
            />

            {/* Game Over Celebration Overlay */}
            {gameOverResult && (
              <div className="absolute inset-2.5 sm:inset-3 bg-slate-900/40 backdrop-blur-sm rounded-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full shadow-2xl border border-slate-100">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl mx-auto flex items-center justify-center text-2xl mb-3">
                    🏆
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Ván đấu đã kết thúc</h3>
                  <div className="text-sky-600 font-semibold text-sm mb-4">{gameOverResult}</div>
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Bắt đầu ván mới
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Player Card (You) - Chess.com style */}
          <div
            className={`px-3.5 py-2.5 bg-white rounded-2xl flex items-center justify-between transition-all shadow-sm border ${
              isHumanTurn && !gameOverResult && gameState
                ? 'border-sky-300 ring-2 ring-sky-100'
                : 'border-slate-200/90'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200 flex items-center justify-center text-sky-700 shadow-sm">
                  <User className="w-5 h-5 text-sky-600" />
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200"
                  title="Sẵn sàng"
                />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>{user?.displayName || user?.username || 'Bạn'}</span>
                  <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200/80 tabular-nums">
                    {user?.eloRating || 1200}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({orientation === 'white' ? 'Trắng' : 'Đen'})
                  </span>
                </div>
                {/* Captured pieces by Human */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 min-h-[18px]">
                  {renderCapturedPieces(
                    orientation === 'white'
                      ? capturedStats.blackCaptured
                      : capturedStats.whiteCaptured,
                    orientation === 'white' ? 'b' : 'w'
                  )}
                  {orientation === 'white' && capturedStats.materialAdvantage > 0 && (
                    <span className="font-bold text-emerald-600 text-[10px] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                      +{capturedStats.materialAdvantage}
                    </span>
                  )}
                  {orientation === 'black' && capturedStats.materialAdvantage < 0 && (
                    <span className="font-bold text-emerald-600 text-[10px] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                      +{Math.abs(capturedStats.materialAdvantage)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Human Clock */}
            <div
              className={`px-3 py-1.5 rounded-xl font-mono tabular-nums text-sm font-bold flex items-center gap-1.5 transition-all ${
                isHumanTurn && !gameOverResult && gameState
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatTime(humanTimeMs)}
            </div>
          </div>

          {/* Chess.com style Action Toolbar */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setOrientation((prev) => (prev === 'white' ? 'black' : 'white'))}
                title="Xoay bàn cờ"
                className="p-2 sm:px-3 sm:py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Xoay bàn</span>
              </button>

              <button
                onClick={() => setShowHints((prev) => !prev)}
                title="Bật/tắt chấm gợi ý nước đi"
                className={`p-2 sm:px-3 sm:py-1.5 font-medium rounded-xl border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  showHints
                    ? 'bg-sky-50 border-sky-200 text-sky-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Lightbulb
                  className={`w-3.5 h-3.5 ${
                    showHints ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
                  }`}
                />
                <span className="hidden sm:inline">Gợi ý {showHints ? 'Bật' : 'Tắt'}</span>
              </button>

              <button
                onClick={toggleSound}
                aria-label={soundEnabled ? 'Tắt âm thanh ván đấu' : 'Bật âm thanh ván đấu'}
                title="Âm thanh ván đấu"
                className={`p-2 sm:px-3 sm:py-1.5 font-medium rounded-xl border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  soundEnabled
                    ? 'bg-sky-50 border-sky-200 text-sky-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="hidden sm:inline">Âm thanh</span>
              </button>

              <button
                onClick={() => setShowConfigModal(true)}
                title="Cài đặt cấp độ & thời gian"
                className="p-2 sm:px-3 sm:py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Cài đặt</span>
              </button>
            </div>

            {gameState && gameState.status === 'IN_PROGRESS' && !gameOverResult && (
              <button
                onClick={handleResign}
                title="Xin thua ván đấu"
                className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 font-medium rounded-xl border border-red-200 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Flag className="w-3.5 h-3.5 text-red-500" />
                <span>Xin thua</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Move History & Match Insights (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 self-stretch">
          {/* Match Insights Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-600" />
                Nhận Định Thế Trận
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono tabular-nums">
                {aiStats ? (aiStats.score > 0 ? `+${evalPawns}` : evalPawns) : '0.0'}
              </span>
            </div>

            {/* Friendly Assessment Banner */}
            <div className="p-3 bg-slate-50/80 rounded-xl text-xs text-slate-700 leading-relaxed font-medium border border-slate-100">
              {getGameAssessment()}
            </div>

            {/* Visual Balance Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>⚪ Quân Trắng</span>
                <span>Quân Đen ⚫</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="bg-sky-500 transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.max(
                      8,
                      Math.min(92, 50 + (aiStats ? aiStats.score / 600 : 0) * 50)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Stats row */}
            {aiStats && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-[10px] text-slate-400">Độ sâu tính toán</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">
                    {aiStats.depth} nước đi
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-[10px] text-slate-400">Thời gian phản hồi</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">
                    {aiStats.durationMs} ms
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Move History (Nhật ký ván cờ) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 flex-1 flex flex-col min-h-[220px] max-h-[340px]">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-600" />
                Lịch Sử Nước Đi ({moveHistory.length})
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Nước #{Math.ceil(moveHistory.length / 2) || 1}
              </span>
            </div>

            {/* Note: using ref={moveHistoryContainerRef} and scrollTop to prevent page scrolling! */}
            <div
              ref={moveHistoryContainerRef}
              className="flex-1 overflow-y-auto mt-2 space-y-0.5 text-xs pr-1"
            >
              {moveHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8">
                  <Swords className="w-7 h-7 text-slate-200 mb-2" />
                  <span>Ván cờ chưa có nước đi nào</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Chọn một quân cờ để bắt đầu đi
                  </span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => {
                    const whiteM = moveHistory[i * 2];
                    const blackM = moveHistory[i * 2 + 1];
                    const isLatest =
                      blackM?.ply === moveHistory[moveHistory.length - 1]?.ply ||
                      (!blackM && whiteM?.ply === moveHistory[moveHistory.length - 1]?.ply);

                    return (
                      <div
                        key={i}
                        className={`flex items-center px-2.5 py-1 rounded-lg transition-colors ${
                          isLatest
                            ? 'bg-sky-50 text-sky-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="w-7 text-slate-400 font-medium">{i + 1}.</span>
                        <span className="w-20 font-mono tabular-nums font-medium">{whiteM?.san}</span>
                        <span className="flex-1 font-mono tabular-nums font-medium text-slate-600">
                          {blackM?.san || ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Setup New Game Modal (Thân thiện, ấm áp) */}
      {(showConfigModal || !gameState) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-150 border border-slate-100">
            {gameState && (
              <button
                onClick={() => setShowConfigModal(false)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-sm text-white">
                <PieceSvg type="k" color="w" className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Thiết Lập Ván Đấu Mới</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tùy chỉnh cấp độ máy, thời gian và màu quân cờ
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Trình độ của máy */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  1. Chọn cấp độ máy
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      key: 'EASY',
                      label: 'Bot Tập sự',
                      elo: '1000',
                      iconNode: <Bot className="w-5 h-5 text-emerald-600 mb-1" />,
                      desc: 'Nước đi cơ bản, thích hợp giải trí và rèn luyện ban đầu',
                    },
                    {
                      key: 'MEDIUM',
                      label: 'Bot Kỳ thủ',
                      elo: '1500',
                      iconNode: <Bot className="w-5 h-5 text-sky-600 mb-1" />,
                      desc: 'Đánh bài bản, chiến thuật cân bằng và thử thách vừa sức',
                    },
                    {
                      key: 'HARD',
                      label: 'Bot Cao thủ',
                      elo: '2000',
                      iconNode: <Bot className="w-5 h-5 text-indigo-600 mb-1" />,
                      desc: 'Tính toán nước đi sâu, tư duy chiến thuật đỉnh cao',
                    },
                  ].map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setDifficulty(d.key as AIDifficulty)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        difficulty === d.key
                          ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-100 text-sky-950 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50/60'
                      }`}
                    >
                      {d.iconNode}
                      <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                        <span>{d.label}</span>
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                          {d.elo}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 leading-snug">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Màu quân cờ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  2. Chọn màu quân bạn cầm
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      key: 'white',
                      label: 'Quân Trắng',
                      iconNode: <PieceSvg type="k" color="w" className="w-6 h-6 mb-1" />,
                      sub: 'Được đi trước',
                    },
                    {
                      key: 'black',
                      label: 'Quân Đen',
                      iconNode: <PieceSvg type="k" color="b" className="w-6 h-6 mb-1" />,
                      sub: 'Đi sau (phản công)',
                    },
                    {
                      key: 'random',
                      label: 'Ngẫu nhiên',
                      iconNode: <span className="text-2xl mb-1">🎲</span>,
                      sub: 'Tăng tính bất ngờ',
                    },
                  ].map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setPlayerColor(c.key as any)}
                      className={`p-3 rounded-2xl border transition-all text-center flex flex-col items-center justify-center ${
                        playerColor === c.key
                          ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-100 text-sky-950 font-semibold shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50/60'
                      }`}
                    >
                      {c.iconNode}
                      <span className="text-xs font-bold text-slate-900">{c.label}</span>
                      <span className="text-[10px] text-slate-500">{c.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Thời gian thi đấu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  3. Thời gian ván cờ
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(TIME_CONTROLS).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedTimeKey(key as keyof typeof TIME_CONTROLS)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                        selectedTimeKey === key
                          ? 'bg-sky-50 border-sky-400 text-sky-800 font-bold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {val.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleStartGame}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-sm shadow-sky-500/25 transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.99]"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Bắt Đầu Chơi Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
