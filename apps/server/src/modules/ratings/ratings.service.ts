import { ELO_CONFIG, GameResultType } from '@online-chess/shared';
import { getUserRepository } from '../users/users.repository.impl';
import { prisma, isDatabaseConnected } from '../../database/prisma';
import { logger } from '../../config/logger';

export interface RatingChangeResult {
  whiteRatingBefore: number;
  whiteRatingAfter: number;
  whiteRatingChange: number;
  blackRatingBefore: number;
  blackRatingAfter: number;
  blackRatingChange: number;
}

export class RatingsService {
  private userRepo = getUserRepository();

  calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  getKFactor(rating: number): number {
    return rating >= ELO_CONFIG.HIGH_RATING_THRESHOLD
      ? ELO_CONFIG.K_FACTOR_HIGH
      : ELO_CONFIG.K_FACTOR_DEFAULT;
  }

  calculateEloChange(
    whiteRating: number,
    blackRating: number,
    result: GameResultType
  ): { whiteChange: number; blackChange: number } {
    let scoreWhite = 0.5;
    let scoreBlack = 0.5;

    if (result === 'WHITE_WON') {
      scoreWhite = 1;
      scoreBlack = 0;
    } else if (result === 'BLACK_WON') {
      scoreWhite = 0;
      scoreBlack = 1;
    }

    const expectedWhite = this.calculateExpectedScore(whiteRating, blackRating);
    const expectedBlack = this.calculateExpectedScore(blackRating, whiteRating);

    const kWhite = this.getKFactor(whiteRating);
    const kBlack = this.getKFactor(blackRating);

    const whiteChange = Math.round(kWhite * (scoreWhite - expectedWhite));
    const blackChange = Math.round(kBlack * (scoreBlack - expectedBlack));

    return { whiteChange, blackChange };
  }

  async applyGameRatingChanges(
    gameId: string,
    whitePlayerId: string,
    blackPlayerId: string,
    result: GameResultType
  ): Promise<RatingChangeResult> {
    const whiteUser = await this.userRepo.findById(whitePlayerId);
    const blackUser = await this.userRepo.findById(blackPlayerId);

    if (!whiteUser || !blackUser) {
      throw new Error('Không tìm thấy người chơi để cập nhật điểm ELO');
    }

    const whiteBefore = whiteUser.eloRating;
    const blackBefore = blackUser.eloRating;

    const { whiteChange, blackChange } = this.calculateEloChange(
      whiteBefore,
      blackBefore,
      result
    );

    const whiteAfter = Math.max(100, whiteBefore + whiteChange);
    const blackAfter = Math.max(100, blackBefore + blackChange);

    // Update ratings
    await this.userRepo.update(whitePlayerId, { eloRating: whiteAfter });
    await this.userRepo.update(blackPlayerId, { eloRating: blackAfter });

    // If database connected, persist rating history in PostgreSQL
    if (isDatabaseConnected) {
      try {
        await prisma.ratingHistory.createMany({
          data: [
            {
              userId: whitePlayerId,
              gameId,
              ratingBefore: whiteBefore,
              ratingAfter: whiteAfter,
              ratingChange: whiteChange,
            },
            {
              userId: blackPlayerId,
              gameId,
              ratingBefore: blackBefore,
              ratingAfter: blackAfter,
              ratingChange: blackChange,
            },
          ],
        });
      } catch (err) {
        logger.error(err, 'Failed to save rating histories to database');
      }
    }

    logger.info(
      `Updated ELO: White ${whiteBefore} -> ${whiteAfter} (${whiteChange >= 0 ? '+' : ''}${whiteChange}), Black ${blackBefore} -> ${blackAfter} (${blackChange >= 0 ? '+' : ''}${blackChange})`
    );

    return {
      whiteRatingBefore: whiteBefore,
      whiteRatingAfter: whiteAfter,
      whiteRatingChange: whiteChange,
      blackRatingBefore: blackBefore,
      blackRatingAfter: blackAfter,
      blackRatingChange: blackChange,
    };
  }
}

export const ratingsService = new RatingsService();
