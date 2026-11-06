export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  eloRating: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

export interface LeaderboardResponse {
  total: number;
  page: number;
  limit: number;
  data: LeaderboardEntry[];
}
