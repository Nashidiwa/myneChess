import { describe, it, expect } from 'vitest';
import { chessRulesService } from '../src/modules/chess/chessRules.service';
import { STARTING_FEN } from '@online-chess/shared';

describe('Phase 4 - Chess Rules & Authoritative Engine Tests', () => {
  it('should accept valid opening moves', () => {
    // 1. e4
    expect(chessRulesService.isValidMove(STARTING_FEN, 'e2', 'e4')).toBe(true);
    // 1. Nf3
    expect(chessRulesService.isValidMove(STARTING_FEN, 'g1', 'f3')).toBe(true);
  });

  it('should reject illegal moves', () => {
    // Cannot jump pawns illegally
    expect(chessRulesService.isValidMove(STARTING_FEN, 'e2', 'e5')).toBe(false);
    // Cannot move black piece on white turn
    expect(chessRulesService.isValidMove(STARTING_FEN, 'e7', 'e5')).toBe(false);
    // Rook cannot move diagonally
    expect(chessRulesService.isValidMove(STARTING_FEN, 'a1', 'b2')).toBe(false);
  });

  it('should detect check and apply check state properly', () => {
    // Scholar's mate setup: 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6
    let fen = STARTING_FEN;
    fen = chessRulesService.applyMove(fen, 'e2', 'e4').fenAfter;
    fen = chessRulesService.applyMove(fen, 'e7', 'e5').fenAfter;
    fen = chessRulesService.applyMove(fen, 'd1', 'h5').fenAfter;
    fen = chessRulesService.applyMove(fen, 'b8', 'c6').fenAfter;
    fen = chessRulesService.applyMove(fen, 'f1', 'c4').fenAfter;
    fen = chessRulesService.applyMove(fen, 'g8', 'f6').fenAfter;

    // 4. Qxf7#
    const moveRes = chessRulesService.applyMove(fen, 'h5', 'f7');
    expect(moveRes.isCheck).toBe(true);
    expect(moveRes.isCheckmate).toBe(true);
    expect(moveRes.result).toBe('WHITE_WON');
    expect(moveRes.terminationReason).toBe('CHECKMATE');
  });

  it('should handle castling correctly', () => {
    // Setup position where White can castle kingside
    // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O
    let fen = STARTING_FEN;
    fen = chessRulesService.applyMove(fen, 'e2', 'e4').fenAfter;
    fen = chessRulesService.applyMove(fen, 'e7', 'e5').fenAfter;
    fen = chessRulesService.applyMove(fen, 'g1', 'f3').fenAfter;
    fen = chessRulesService.applyMove(fen, 'b8', 'c6').fenAfter;
    fen = chessRulesService.applyMove(fen, 'f1', 'c4').fenAfter;
    fen = chessRulesService.applyMove(fen, 'f8', 'c5').fenAfter;

    // White Kingside castling (e1 -> g1)
    expect(chessRulesService.isValidMove(fen, 'e1', 'g1')).toBe(true);
    const castleRes = chessRulesService.applyMove(fen, 'e1', 'g1');
    expect(castleRes.san).toBe('O-O');
  });

  it('should handle en passant capture correctly', () => {
    // White pawn on e5, Black plays d7 -> d5
    // FEN with white pawn on e5 and black pawn on d5 with en passant target square d6
    const fen = 'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3';
    expect(chessRulesService.isValidMove(fen, 'e5', 'd6')).toBe(true);
    const epRes = chessRulesService.applyMove(fen, 'e5', 'd6');
    expect(epRes.san).toBe('exd6');
    // Black pawn on d5 should be removed from board
    expect(epRes.fenAfter).not.toContain('3pP3');
  });

  it('should handle pawn promotions (queen, rook, bishop, knight)', () => {
    // White pawn on a7 about to promote to a8
    const fen = '8/P7/8/8/8/8/8/4K2k w - - 0 1';

    // Queen promotion
    const qRes = chessRulesService.applyMove(fen, 'a7', 'a8', 'q');
    expect(qRes.san).toBe('a8=Q+');

    // Knight underpromotion
    const nRes = chessRulesService.applyMove(fen, 'a7', 'a8', 'n');
    expect(nRes.san).toBe('a8=N');

    // Rook promotion
    const rRes = chessRulesService.applyMove(fen, 'a7', 'a8', 'r');
    expect(rRes.san).toBe('a8=R');

    // Bishop promotion
    const bRes = chessRulesService.applyMove(fen, 'a7', 'a8', 'b');
    expect(bRes.san).toBe('a8=B+');
  });

  it('should detect stalemate', () => {
    // Known stalemate position: White Ka8, Black Qc7, Ka6
    // FEN: 7k/8/8/8/8/8/2q5/K7 w - - 0 1 (White to move, Ka1 is trapped, no check)
    const stalemateFen = '7k/8/8/8/8/8/2q5/K7 w - - 0 1';
    const status = chessRulesService.getGameStatus(stalemateFen);
    expect(status.isGameOver).toBe(true);
    expect(status.result).toBe('DRAW');
    expect(status.terminationReason).toBe('STALEMATE');
  });

  it('should detect insufficient material', () => {
    // King vs King
    const kvkFen = '8/8/8/4k3/8/8/4K3/8 w - - 0 1';
    const status = chessRulesService.getGameStatus(kvkFen);
    expect(status.isGameOver).toBe(true);
    expect(status.result).toBe('DRAW');
    expect(status.terminationReason).toBe('INSUFFICIENT_MATERIAL');
  });

  it('should detect threefold repetition draw using historical position hashes (Finding H-04)', () => {
    // Sequence: 1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. Ng1 Ng8
    const history: string[] = [STARTING_FEN];
    let currentFen = STARTING_FEN;

    // 1. Nf3
    let res = chessRulesService.applyMove(currentFen, 'g1', 'f3', undefined, history);
    history.push(res.fenAfter);
    currentFen = res.fenAfter;

    // 1... Nf6
    res = chessRulesService.applyMove(currentFen, 'g8', 'f6', undefined, history);
    history.push(res.fenAfter);
    currentFen = res.fenAfter;

    // 2. Ng1 (repetition 2 of starting position)
    res = chessRulesService.applyMove(currentFen, 'f3', 'g1', undefined, history);
    history.push(res.fenAfter);
    currentFen = res.fenAfter;

    // 2... Ng8
    res = chessRulesService.applyMove(currentFen, 'f6', 'g8', undefined, history);
    history.push(res.fenAfter);
    currentFen = res.fenAfter;
    expect(res.isThreefoldRepetition).toBe(false);

    // 3. Nf3
    res = chessRulesService.applyMove(currentFen, 'g1', 'f3', undefined, history);
    history.push(res.fenAfter);
    currentFen = res.fenAfter;

    // 3... Nf6
    res = chessRulesService.applyMove(currentFen, 'g8', 'f6', undefined, history);
    history.push(res.fenAfter);
    currentFen = res.fenAfter;

    // 4. Ng1
    res = chessRulesService.applyMove(currentFen, 'f3', 'g1', undefined, history);
    history.push(res.fenAfter);
    currentFen = res.fenAfter;

    // 4... Ng8 (3rd time reaching original starting position!)
    res = chessRulesService.applyMove(currentFen, 'f6', 'g8', undefined, history);

    expect(res.isThreefoldRepetition).toBe(true);
    expect(res.isDraw).toBe(true);
    expect(res.result).toBe('DRAW');
    expect(res.terminationReason).toBe('THREEFOLD_REPETITION');
  });
});
