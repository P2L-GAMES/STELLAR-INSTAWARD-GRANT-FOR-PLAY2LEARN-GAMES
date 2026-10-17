import { STORAGE_KEYS } from '@/config';
import type { SessionStore } from './SessionStore';
import type { PlayerSnapshot } from '@/types';

export class LocalSessionStore implements SessionStore {
  constructor(private readonly storage: Storage = window.localStorage) {}

  async load(playerId: string): Promise<PlayerSnapshot | null> {
    const raw = this.storage.getItem(STORAGE_KEYS.playerPrefix + playerId);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PlayerSnapshot;
    } catch {
      return null;
    }
  }

  async save(snapshot: PlayerSnapshot): Promise<void> {
    this.storage.setItem(
      STORAGE_KEYS.playerPrefix + snapshot.id,
      JSON.stringify(snapshot),
    );
    this.addToIndex(snapshot.id);
  }

  async listAll(): Promise<PlayerSnapshot[]> {
    const ids = this.readIndex();
    const snapshots: PlayerSnapshot[] = [];
    for (const id of ids) {
      const snapshot = await this.load(id);
      if (snapshot) snapshots.push(snapshot);
    }
    return snapshots;
  }

  async clear(): Promise<void> {
    for (const id of this.readIndex()) {
      this.storage.removeItem(STORAGE_KEYS.playerPrefix + id);
    }
    this.storage.removeItem(STORAGE_KEYS.index);
  }

  private readIndex(): string[] {
    const raw = this.storage.getItem(STORAGE_KEYS.index);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }

  private addToIndex(playerId: string): void {
    const ids = this.readIndex();
    if (!ids.includes(playerId)) {
      ids.push(playerId);
      this.storage.setItem(STORAGE_KEYS.index, JSON.stringify(ids));
    }
  }
}