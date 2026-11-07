import { Chess } from 'chess.js';
import { GameResultType, TerminationReasonType, PieceColor } from '@online-chess/shared';

export interface MoveValidationResult {
  isValid: boolean;
  fenAfter: string;
  san: string;
  from: string;
  to: string;
  promotion?: string;
  capturedPiece?: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isThreefoldRepetition: boolean;
  isFiftyMoveRule: boolean;
  isInsufficientMaterial: boolean;
  nextTurn: PieceColor;
  result?: GameResultType | null;
  terminationReason?: TerminationReasonType | null;
}

export interface IChessRulesService {
  isValidMove(fen: string, from: string, to: string, promotion?: string): boolean;
  applyMove(fen: string, from: string, to: string, promotion?: string, fenHistory?: string[]): MoveValidationResult;
  getLegalMoves(fen: string, square?: string): Array<{ from: string; to: string; promotion?: string; san: string }>;
  isGameOver(fen: string): boolean;
  getGameStatus(fen: string, fenHistory?: string[]): {
    isGameOver: boolean;
    result?: GameResultType | null;
    terminationReason?: TerminationReasonType | null;
  };
  validateFen(fen: string): boolean;
  checkThreefoldRepetition(history: string[], currentFen: string): boolean;
}

export class ChessRulesService implements IChessRulesService {
  validateFen(fen: string): boolean {
    try {
      const chess = new Chess(fen);
      return chess.fen() !== '';
    } catch {
      return false;
    }
  }

  checkThreefoldRepetition(history: string[], currentFen: string): boolean {
    const targetBase = currentFen.split(' ').slice(0, 4).join(' ');
    let count = 1; // current position counts as 1
    for (const fen of history) {
      if (fen.split(' ').slice(0, 4).join(' ') === targetBase) {
        count++;
        if (count >= 3) return true;
      }
    }
    return false;
  }

  isValidMove(fen: string, from: string, to: string, promotion?: string): boolean {
    try {
      const chess = new Chess(fen);
      const move = chess.move({
        from,
        to,
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
      });
      return !!move;
    } catch {
      return false;
    }
  }

  applyMove(
    fen: string,
    from: string,
    to: string,
    promotion?: string,
    fenHistory?: string[]
  ): MoveValidationResult {
    const chess = new Chess(fen);
    const move = chess.move({
      from,
      to,
      promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
    });

    if (!move) {
      throw new Error(`Nước đi không hợp lệ: từ ${from} đến ${to}`);
    }

    const fenAfter = chess.fen();
    const isCheck = chess.inCheck();
    const isCheckmate = chess.isCheckmate();
    const isStalemate = chess.isStalemate();
    const isThreefold =
      (fenHistory && fenHistory.length > 0
        ? this.checkThreefoldRepetition(fenHistory, fenAfter)
        : false) || chess.isThreefoldRepetition();
    const isInsufficient = chess.isInsufficientMaterial();
    const isFifty = chess.isDraw() && !isStalemate && !isThreefold && !isInsufficient;
    const isDraw = isStalemate || isThreefold || isFifty || isInsufficient || chess.isDraw();

    let result: GameResultType | null = null;
    let terminationReason: TerminationReasonType | null = null;

    if (isCheckmate) {
      // The side who just moved delivered checkmate
      const winnerColor = move.color; // 'w' or 'b'
      result = winnerColor === 'w' ? 'WHITE_WON' : 'BLACK_WON';
      terminationReason = 'CHECKMATE';
    } else if (isStalemate) {
      result = 'DRAW';
      terminationReason = 'STALEMATE';
    } else if (isThreefold) {
      result = 'DRAW';
      terminationReason = 'THREEFOLD_REPETITION';
    } else if (isFifty) {
      result = 'DRAW';
      terminationReason = 'FIFTY_MOVE_RULE';
    } else if (isInsufficient) {
      result = 'DRAW';
      terminationReason = 'INSUFFICIENT_MATERIAL';
    }

    return {
      isValid: true,
      fenAfter,
      san: move.san,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      capturedPiece: move.captured,
      isCheck,
      isCheckmate,
      isStalemate,
      isDraw,
      isThreefoldRepetition: isThreefold,
      isFiftyMoveRule: isFifty,
      isInsufficientMaterial: isInsufficient,
      nextTurn: chess.turn() as PieceColor,
      result,
      terminationReason,
    };
  }

  getLegalMoves(fen: string, square?: string): Array<{ from: string; to: string; promotion?: string; san: string }> {
    const chess = new Chess(fen);
    const moves = chess.moves({ square: square as any, verbose: true });
    return moves.map((m) => ({
      from: m.from,
      to: m.to,
      promotion: m.promotion,
      san: m.san,
    }));
  }

  isGameOver(fen: string): boolean {
    const chess = new Chess(fen);
    return chess.isGameOver();
  }

  getGameStatus(fen: string, fenHistory?: string[]): {
    isGameOver: boolean;
    result?: GameResultType | null;
    terminationReason?: TerminationReasonType | null;
  } {
    const chess = new Chess(fen);
    const isThreefold =
      fenHistory && fenHistory.length > 0
        ? this.checkThreefoldRepetition(fenHistory, fen)
        : chess.isThreefoldRepetition();

    if (isThreefold) {
      return { isGameOver: true, result: 'DRAW', terminationReason: 'THREEFOLD_REPETITION' };
    }

    if (!chess.isGameOver()) {
      return { isGameOver: false, result: null, terminationReason: null };
    }

    if (chess.isCheckmate()) {
      // Current turn is mated! The opponent won
      const currentTurn = chess.turn();
      const result: GameResultType = currentTurn === 'w' ? 'BLACK_WON' : 'WHITE_WON';
      return { isGameOver: true, result, terminationReason: 'CHECKMATE' };
    }

    if (chess.isStalemate()) {
      return { isGameOver: true, result: 'DRAW', terminationReason: 'STALEMATE' };
    }

    if (chess.isInsufficientMaterial()) {
      return { isGameOver: true, result: 'DRAW', terminationReason: 'INSUFFICIENT_MATERIAL' };
    }

    return { isGameOver: true, result: 'DRAW', terminationReason: 'FIFTY_MOVE_RULE' };
  }
}

export const chessRulesService = new ChessRulesService();
