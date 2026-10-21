import { DEFAULT_PLAYER } from '@/config';
import { ActivityMachine, ConnectionMachine } from './StateMachines';
import type { ScoringSystem } from './ScoringSystem';
import type { SessionStore } from './SessionStore';
import type { EventBus } from '@/core/EventBus';
import type {
  AppEvents,
  PlayerActivityState,
  PlayerConnectionState,
  PlayerSnapshot,
} from '@/types';

export class Player {
  private readonly connection = new ConnectionMachine();
  private readonly activity = new ActivityMachine();
  private displayName: string = DEFAULT_PLAYER.displayName;
  private rank: string = DEFAULT_PLAYER.rank;
  private walletAddress: string | null = null;

  constructor(
    public readonly id: string,
    private readonly scoring: ScoringSystem,
    private readonly store: SessionStore,
    private readonly events: EventBus<AppEvents>,
  ) {}

  get points(): number {
    return this.scoring.points;
  }

  get xlm(): number {
    return this.scoring.xlm;
  }

  get connectionState(): PlayerConnectionState {
    return this.connection.state;
  }

  get activityState(): PlayerActivityState {
    return this.activity.state;
  }

  get wallet(): string | null {
    return this.walletAddress;
  }

  /** Short display form of the wallet, e.g. `GABC…WXYZ`. */
  get walletShort(): string {
    if (!this.walletAddress) return 'Not connected';
    if (this.walletAddress.length <= 12) return this.walletAddress;
    return `${this.walletAddress.slice(0, 5)}…${this.walletAddress.slice(-4)}`;
  }

  get canEarn(): boolean {
    return this.connection.state === 'connected';
  }

  static async restore(
    id: string,
    scoring: ScoringSystem,
    store: SessionStore,
    events: EventBus<AppEvents>,
  ): Promise<Player> {
    const player = new Player(id, scoring, store, events);
    await player.hydrate();
    return player;
  }

  async hydrate(): Promise<void> {
    const snapshot = await this.store.load(this.id);
    if (!snapshot) {
      this.scoring.restore(0, this.scoring.xlm);
      return;
    }
    this.displayName = snapshot.displayName;
    this.rank = snapshot.rank;
    this.walletAddress = snapshot.walletAddress;
    this.scoring.restore(snapshot.points, snapshot.xlm);
    this.events.emit('player:wallet', { address: this.walletAddress });
  }

  async beginConnect(): Promise<void> {
    if (!this.connection.transitionTo('connecting')) return;
    this.events.emit('player:connection', this.connection.state);
  }

  async completeConnect(walletAddress: string): Promise<void> {
    if (!this.connection.transitionTo('connected')) return;
    this.walletAddress = walletAddress;
    this.events.emit('player:connection', this.connection.state);
    this.events.emit('player:wallet', { address: this.walletAddress });
    await this.persist();
  }

  async disconnect(): Promise<void> {
    if (!this.connection.transitionTo('disconnected')) return;
    this.events.emit('player:connection', this.connection.state);
  }

  async cancelConnect(): Promise<void> {
    if (this.connection.state !== 'connecting') return;
    this.connection.transitionTo('disconnected');
    this.events.emit('player:connection', this.connection.state);
  }

  enterLobby(): boolean {
    if (!this.activity.transitionTo('inLobby')) return false;
    this.events.emit('player:activity', this.activity.state);
    void this.persist();
    return true;
  }

  enterGame(): boolean {
    if (!this.canEarn) return false;
    if (!this.activity.transitionTo('inGame')) return false;
    this.events.emit('player:activity', this.activity.state);
    void this.persist();
    return true;
  }

  leaveGame(): boolean {
    if (!this.activity.transitionTo('inLobby')) return false;
    this.events.emit('player:activity', this.activity.state);
    void this.persist();
    return true;
  }

  awardCorrectAnswer(): void {
    if (!this.canEarn) return;
    this.scoring.awardCorrectAnswer();
    void this.persist();
  }

  /** Reset points and XLM to their starting values and persist. */
  resetEarnings(): void {
    this.scoring.reset();
    void this.persist();
  }

  snapshot(): PlayerSnapshot {
    return {
      id: this.id,
      displayName: this.displayName,
      rank: this.rank,
      walletAddress: this.walletAddress,
      points: this.points,
      xlm: this.xlm,
      activity: this.activity.state,
    };
  }

  async persist(): Promise<void> {
    await this.store.save(this.snapshot());
  }
}