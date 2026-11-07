import { Chess, Move } from 'chess.js';
import { AISearchStats, AIChessMove, AIDifficulty } from '@online-chess/shared';
import { logger } from '../../config/logger';
import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';

// Piece material values in centipawns
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (White perspective, rank 8 to rank 1, a to h)
// For black, these are mirrored vertically
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
 50, 50, 50, 50, 50, 50, 50, 50,
 10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
 -50,-40,-30,-30,-30,-30,-40,-50,
 -40,-20,  0,  0,  0,  0,-20,-40,
 -30,  0, 10, 15, 15, 10,  0,-30,
 -30,  5, 15, 20, 20, 15,  5,-30,
 -30,  0, 15, 20, 20, 15,  0,-30,
 -30,  5, 10, 15, 15, 10,  5,-30,
 -40,-20,  0,  5,  5,  0,-20,-40,
 -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_PST = [
 -20,-10,-10,-10,-10,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5, 10, 10,  5,  0,-10,
 -10,  5,  5, 10, 10,  5,  5,-10,
 -10,  0, 10, 10, 10, 10,  0,-10,
 -10, 10, 10, 10, 10, 10, 10,-10,
 -10,  5,  0,  0,  0,  0,  5,-10,
 -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_PST = [
 -20,-10,-10, -5, -5,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
   0,  0,  5,  5,  5,  5,  0, -5,
 -10,  5,  5,  5,  5,  5,  0,-10,
 -10,  0,  5,  0,  0,  0,  0,-10,
 -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MIDGAME_PST = [
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -20,-30,-30,-40,-40,-30,-30,-20,
 -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

export interface IChessAI {
  chooseMove(fen: string, difficulty?: AIDifficulty): Promise<AIChessMove>;
  chooseMoveDirect(fen: string, difficulty?: AIDifficulty): Promise<AIChessMove>;
  evaluatePosition(chess: Chess): number;
  search(
    chess: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    ply: number
  ): number;
  orderMoves(chess: Chess, moves: Move[]): Move[];
  getSearchStatistics(): AISearchStats;
}

function executeInWorker(fen: string, difficulty: AIDifficulty): Promise<AIChessMove> {
  return new Promise((resolve, reject) => {
    const isTs = __filename.endsWith('.ts');
    let workerPath = path.resolve(__dirname, isTs ? 'ai.worker.ts' : 'ai.worker.js');

    if (!fs.existsSync(workerPath)) {
      workerPath = path.resolve(__dirname, 'ai.worker.js');
    }

    const worker = new Worker(workerPath, {
      execArgv: isTs ? ['--import', 'tsx'] : undefined,
      workerData: { fen, difficulty },
    });

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('AI worker search timed out'));
    }, 10000);

    worker.on('message', (res) => {
      clearTimeout(timeout);
      worker.terminate();
      if (res?.success && res.move) {
        resolve(res.move);
      } else {
        reject(new Error(res?.error || 'Worker error'));
      }
    });

    worker.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    worker.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`AI worker stopped with exit code ${code}`));
      }
    });
  });
}

export class CustomChessAI implements IChessAI {
  private stats: AISearchStats = {
    depth: 0,
    nodesVisited: 0,
    nodesPruned: 0,
    durationMs: 0,
    score: 0,
    bestMove: '',
  };

  private bestMoveAtRoot: Move | null = null;
  private timeLimitMs = 3000;
  private startTime = 0;
  private isTimeout = false;

  getSearchStatistics(): AISearchStats {
    return { ...this.stats };
  }

  /**
   * Optimized allocation-free position evaluation (Finding H-02).
   * Parses FEN directly without allocating 8x8 arrays or piece objects.
   */
  evaluatePosition(chess: Chess): number {
    if (chess.inCheck()) {
      const moves = chess.moves();
      if (moves.length === 0) {
        // Checkmate! Current side is mated
        return chess.turn() === 'w' ? -100000 : 100000;
      }
    } else if (chess.isInsufficientMaterial()) {
      return 0;
    }

    const fen = chess.fen();
    const firstSpace = fen.indexOf(' ');
    const placement = firstSpace !== -1 ? fen.slice(0, firstSpace) : fen;

    let whiteScore = 0;
    let blackScore = 0;

    let r = 0;
    let c = 0;

    // Fixed column counts for doubled pawn evaluation
    const whitePawnFiles = [0, 0, 0, 0, 0, 0, 0, 0];
    const blackPawnFiles = [0, 0, 0, 0, 0, 0, 0, 0];

    for (let i = 0; i < placement.length; i++) {
      const ch = placement.charCodeAt(i);
      if (ch === 47) {
        // '/' character -> new rank
        r++;
        c = 0;
        continue;
      }
      if (ch >= 49 && ch <= 56) {
        // '1' to '8' digits -> skip empty squares
        c += ch - 48;
        continue;
      }

      const isWhite = ch >= 65 && ch <= 90;
      const type = isWhite ? String.fromCharCode(ch + 32) : placement[i];
      const squareIndex = r * 8 + c;
      const mirroredIndex = (7 - r) * 8 + c;
      const val = PIECE_VALUES[type] || 0;

      let pstVal = 0;
      switch (type) {
        case 'p':
          pstVal = isWhite ? PAWN_PST[squareIndex] : PAWN_PST[mirroredIndex];
          if (isWhite) whitePawnFiles[c]++;
          else blackPawnFiles[c]++;
          break;
        case 'n':
          pstVal = isWhite ? KNIGHT_PST[squareIndex] : KNIGHT_PST[mirroredIndex];
          break;
        case 'b':
          pstVal = isWhite ? BISHOP_PST[squareIndex] : BISHOP_PST[mirroredIndex];
          break;
        case 'r':
          pstVal = isWhite ? ROOK_PST[squareIndex] : ROOK_PST[mirroredIndex];
          break;
        case 'q':
          pstVal = isWhite ? QUEEN_PST[squareIndex] : QUEEN_PST[mirroredIndex];
          break;
        case 'k':
          pstVal = isWhite ? KING_MIDGAME_PST[squareIndex] : KING_MIDGAME_PST[mirroredIndex];
          break;
      }

      if (isWhite) {
        whiteScore += val + pstVal;
      } else {
        blackScore += val + pstVal;
      }

      c++;
    }

    // Penalize doubled pawns
    for (let f = 0; f < 8; f++) {
      if (whitePawnFiles[f] > 1) {
        whiteScore -= (whitePawnFiles[f] - 1) * 20;
      }
      if (blackPawnFiles[f] > 1) {
        blackScore -= (blackPawnFiles[f] - 1) * 20;
      }
    }

    // Check bonus
    if (chess.inCheck()) {
      if (chess.turn() === 'w') {
        whiteScore -= 40;
      } else {
        blackScore -= 40;
      }
    }

    return whiteScore - blackScore;
  }

  orderMoves(chess: Chess, moves: Move[]): Move[] {
    return moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // MVV-LVA: Most Valuable Victim - Least Valuable Attacker
      if (a.captured) {
        const victimVal = PIECE_VALUES[a.captured] || 0;
        const attackerVal = PIECE_VALUES[a.piece] || 0;
        scoreA += victimVal * 10 - attackerVal;
      }
      if (b.captured) {
        const victimVal = PIECE_VALUES[b.captured] || 0;
        const attackerVal = PIECE_VALUES[b.piece] || 0;
        scoreB += victimVal * 10 - attackerVal;
      }

      // Promotions
      if (a.promotion) scoreA += 800;
      if (b.promotion) scoreB += 800;

      // Checks
      if (a.san.includes('+')) scoreA += 50;
      if (b.san.includes('+')) scoreB += 50;

      return scoreB - scoreA;
    });
  }

  /**
   * Quiescence Search at depth 0 to eliminate horizon effect blunders (Finding H-03).
   */
  private quiescenceSearch(
    chess: Chess,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    qDepth: number = 0
  ): number {
    this.stats.nodesVisited++;

    if (this.isTimeout || qDepth >= 4) {
      return this.evaluatePosition(chess);
    }

    const standPat = this.evaluatePosition(chess);

    if (isMaximizing) {
      if (standPat >= beta) return beta;
      if (standPat > alpha) alpha = standPat;

      const legalMoves = chess.moves({ verbose: true });
      const captureMoves = legalMoves.filter((m) => !!m.captured || !!m.promotion);
      if (captureMoves.length === 0) return standPat;

      const orderedCaptures = this.orderMoves(chess, captureMoves);

      for (const move of orderedCaptures) {
        chess.move(move);
        const score = this.quiescenceSearch(chess, alpha, beta, false, qDepth + 1);
        chess.undo();

        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
        if (this.isTimeout) break;
      }
      return alpha;
    } else {
      if (standPat <= alpha) return alpha;
      if (standPat < beta) beta = standPat;

      const legalMoves = chess.moves({ verbose: true });
      const captureMoves = legalMoves.filter((m) => !!m.captured || !!m.promotion);
      if (captureMoves.length === 0) return standPat;

      const orderedCaptures = this.orderMoves(chess, captureMoves);

      for (const move of orderedCaptures) {
        chess.move(move);
        const score = this.quiescenceSearch(chess, alpha, beta, true, qDepth + 1);
        chess.undo();

        if (score <= alpha) return alpha;
        if (score < beta) beta = score;
        if (this.isTimeout) break;
      }
      return beta;
    }
  }

  search(
    chess: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    ply: number
  ): number {
    this.stats.nodesVisited++;

    // Time limit guard
    if (this.stats.nodesVisited % 1000 === 0) {
      if (Date.now() - this.startTime > this.timeLimitMs) {
        this.isTimeout = true;
      }
    }

    if (this.isTimeout) {
      return this.evaluatePosition(chess);
    }

    if (depth === 0) {
      // Transition to Quiescence Search to resolve pending captures (Finding H-03)
      return this.quiescenceSearch(chess, alpha, beta, isMaximizing, 0);
    }

    const legalMoves = chess.moves({ verbose: true });

    if (legalMoves.length === 0) {
      if (chess.inCheck()) {
        return isMaximizing ? -100000 + ply : 100000 - ply;
      }
      return 0; // Stalemate
    }

    const orderedMoves = this.orderMoves(chess, legalMoves);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of orderedMoves) {
        chess.move(move);
        const evalScore = this.search(chess, depth - 1, alpha, beta, false, ply + 1);
        chess.undo();

        if (evalScore > maxEval) {
          maxEval = evalScore;
          if (ply === 0) {
            this.bestMoveAtRoot = move;
          }
        }

        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) {
          this.stats.nodesPruned++;
          break; // Beta cutoff
        }

        if (this.isTimeout) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of orderedMoves) {
        chess.move(move);
        const evalScore = this.search(chess, depth - 1, alpha, beta, true, ply + 1);
        chess.undo();

        if (evalScore < minEval) {
          minEval = evalScore;
          if (ply === 0) {
            this.bestMoveAtRoot = move;
          }
        }

        beta = Math.min(beta, evalScore);
        if (beta <= alpha) {
          this.stats.nodesPruned++;
          break; // Alpha cutoff
        }

        if (this.isTimeout) break;
      }
      return minEval;
    }
  }

  async chooseMoveDirect(fen: string, difficulty: AIDifficulty = 'MEDIUM'): Promise<AIChessMove> {
    const chess = new Chess(fen);
    const legalMoves = chess.moves({ verbose: true });

    if (legalMoves.length === 0) {
      throw new Error('Không còn nước đi hợp lệ (Hết cờ)');
    }

    let depth = 3;
    let timeLimit = 3000;
    let randomness = 0;

    switch (difficulty) {
      case 'EASY':
        depth = 1;
        timeLimit = 1000;
        randomness = 0.35; // 35% chance to pick any safe legal move
        break;
      case 'MEDIUM':
        depth = 3;
        timeLimit = 2500;
        randomness = 0;
        break;
      case 'HARD':
        depth = 4;
        timeLimit = 5000;
        randomness = 0;
        break;
    }

    this.timeLimitMs = timeLimit;
    this.startTime = Date.now();
    this.isTimeout = false;
    this.stats = {
      depth,
      nodesVisited: 0,
      nodesPruned: 0,
      durationMs: 0,
      score: 0,
      bestMove: '',
    };
    this.bestMoveAtRoot = null;

    // In Easy mode, if random chance hits, pick a random legal move
    if (randomness > 0 && Math.random() < randomness) {
      const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      return {
        from: randomMove.from,
        to: randomMove.to,
        promotion: randomMove.promotion,
        san: randomMove.san,
        score: 0,
        stats: {
          depth: 1,
          nodesVisited: 1,
          nodesPruned: 0,
          durationMs: Date.now() - this.startTime,
          score: 0,
          bestMove: randomMove.san,
        },
      };
    }

    const isWhite = chess.turn() === 'w';

    // Minimax search with Alpha-Beta pruning & Quiescence search
    const bestScore = this.search(chess, depth, -Infinity, Infinity, isWhite, 0);

    const chosen = this.bestMoveAtRoot || legalMoves[0];
    const durationMs = Date.now() - this.startTime;

    this.stats.durationMs = durationMs;
    this.stats.score = bestScore;
    this.stats.bestMove = chosen.san;

    logger.info(
      `AI (${difficulty}) chose ${chosen.san} [depth: ${depth}, nodes: ${this.stats.nodesVisited}, pruned: ${this.stats.nodesPruned}, duration: ${durationMs}ms, score: ${bestScore}]`
    );

    return {
      from: chosen.from,
      to: chosen.to,
      promotion: chosen.promotion,
      san: chosen.san,
      score: bestScore,
      stats: this.stats,
    };
  }

  async chooseMove(fen: string, difficulty: AIDifficulty = 'MEDIUM'): Promise<AIChessMove> {
    // If in vitest/test environment, direct execution is fastest and prevents IPC overhead
    if (process.env.VITEST || process.env.NODE_ENV === 'test') {
      return this.chooseMoveDirect(fen, difficulty);
    }

    try {
      return await executeInWorker(fen, difficulty);
    } catch (err) {
      logger.warn(err, 'Worker thread failed for AI move, falling back to direct computation');
      return this.chooseMoveDirect(fen, difficulty);
    }
  }
}

export const chessAI = new CustomChessAI();
