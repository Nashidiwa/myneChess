import { describe, it, expect } from 'vitest';
import { chessAI } from '../src/modules/ai/chessAi.service';
import { Chess } from 'chess.js';
import { STARTING_FEN } from '@online-chess/shared';

describe('Phase 7 - Custom Chess AI (Minimax + Alpha-Beta) Tests', () => {
  it('should return a legal opening move from starting position', async () => {
    const move = await chessAI.chooseMove(STARTING_FEN, 'MEDIUM');
    expect(move.from).toBeDefined();
    expect(move.to).toBeDefined();
    expect(move.san).toBeDefined();
    expect(move.stats.nodesVisited).toBeGreaterThan(0);

    // Verify it is a valid move in chess.js
    const chess = new Chess(STARTING_FEN);
    const valid = chess.move({ from: move.from, to: move.to, promotion: move.promotion as any });
    expect(valid).toBeTruthy();
  });

  it('should capture a hanging queen (Material capture test)', async () => {
    // White: Kh1, Rd1; Black: Kh8, Qd2 (Hanging Queen on d2 that White can capture with Rxd2)
    const hangingQueenFen = '7k/8/8/8/8/8/3q4/3R3K w - - 0 1';
    const move = await chessAI.chooseMove(hangingQueenFen, 'HARD');

    // White should play Rxd2
    expect(move.from).toBe('d1');
    expect(move.to).toBe('d2');
  });

  it('should deliver mate in 1 when available (Checkmate delivery test)', async () => {
    // White King on f7, White Queen on h7 vs Black King on h8
    const mateInOneFen = '7k/5K1Q/8/8/8/8/8/8 w - - 0 1';
    const move = await chessAI.chooseMove(mateInOneFen, 'MEDIUM');

    // The AI should deliver checkmate (e.g. Kg6# or Qg7#)
    const chess = new Chess(mateInOneFen);
    const validMove = chess.move({ from: move.from, to: move.to });
    expect(validMove).toBeTruthy();
    expect(chess.isCheckmate()).toBe(true);
  });

  it('should verify Alpha-Beta pruning visited nodes and pruned nodes', async () => {
    const move = await chessAI.chooseMove(STARTING_FEN, 'HARD');
    expect(move.stats.nodesPruned).toBeGreaterThan(0);
    expect(move.stats.nodesVisited).toBeGreaterThan(0);
    expect(move.stats.depth).toBe(4);
  });

  it('should support all three difficulty levels', async () => {
    const easy = await chessAI.chooseMove(STARTING_FEN, 'EASY');
    const med = await chessAI.chooseMove(STARTING_FEN, 'MEDIUM');
    const hard = await chessAI.chooseMove(STARTING_FEN, 'HARD');

    expect(easy.san).toBeDefined();
    expect(med.san).toBeDefined();
    expect(hard.san).toBeDefined();
  });

  it('should evaluate piece square tables and material consistently', () => {
    const chessEqual = new Chess(STARTING_FEN);
    const scoreEqual = chessAI.evaluatePosition(chessEqual);
    expect(Math.abs(scoreEqual)).toBeLessThan(100); // symmetric starting evaluation close to 0

    // White up a full Queen
    const whiteUpQueen = new Chess('rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const scoreQueen = chessAI.evaluatePosition(whiteUpQueen);
    expect(scoreQueen).toBeGreaterThan(500); // White is winning by material
  });
});
