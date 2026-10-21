import type { SessionStore } from './SessionStore';
import type { LeaderboardEntry } from '@/types';

export class Leaderboard {
  constructor(private readonly store: SessionStore) {}

  async top(limit = 10): Promise<LeaderboardEntry[]> {
    const snapshots = await this.store.listAll();
    return snapshots
      .map((snapshot) => ({
        id: snapshot.id,
        displayName: snapshot.displayName,
        points: snapshot.points,
        xlm: snapshot.xlm,
        walletAddress: snapshot.walletAddress,
      }))
      .sort((a, b) => b.points - a.points || b.xlm - a.xlm)
      .slice(0, limit);
  }

  async rankOf(playerId: string): Promise<number | null> {
    const board = await this.top(Number.MAX_SAFE_INTEGER);
    const index = board.findIndex((entry) => entry.id === playerId);
    return index < 0 ? null : index + 1;
  }
}