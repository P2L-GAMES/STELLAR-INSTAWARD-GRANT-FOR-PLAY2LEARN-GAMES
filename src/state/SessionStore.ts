import type { PlayerSnapshot } from '@/types';

/**
 * Persistence seam. Swap `LocalSessionStore` for an HTTP-backed
 * implementation later without touching game or state code.
 */
export interface SessionStore {
  load(playerId: string): Promise<PlayerSnapshot | null>;
  save(snapshot: PlayerSnapshot): Promise<void>;
  listAll(): Promise<PlayerSnapshot[]>;
  clear(): Promise<void>;
}