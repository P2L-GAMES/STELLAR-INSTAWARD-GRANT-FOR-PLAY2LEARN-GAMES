import type * as THREE from 'three';
import { QuizMode } from './modes/QuizMode';
import type { GameMode, GameModeContext } from './GameMode';
import type { EventBus } from '@/core/EventBus';
import type { Viewport } from '@/core/Viewport';
import type { Player } from '@/state/Player';
import type { AppEvents, GameModeId } from '@/types';

export type GameModeFactory = (context: GameModeContext) => GameMode;

export class GameRegistry {
  private readonly factories = new Map<GameModeId, GameModeFactory>();
  private active: GameMode | null = null;
  private stopping = false;

  constructor(player: Player, events: EventBus<AppEvents>) {
    this.register('quiz', (context) => new QuizMode(context, player, events));
  }

  register(modeId: GameModeId, factory: GameModeFactory): void {
    this.factories.set(modeId, factory);
  }

  has(modeId: GameModeId): boolean {
    return this.factories.has(modeId);
  }

  get activeMode(): GameMode | null {
    return this.active;
  }

  async start(
    modeId: GameModeId,
    layer: HTMLElement,
    scene: THREE.Scene,
    viewport: Viewport,
  ): Promise<boolean> {
    const factory = this.factories.get(modeId);
    if (!factory) return false;
    await this.stop();
    const context: GameModeContext = {
      modeId,
      layer,
      scene,
      viewport,
      requestExit: () => {
        void this.stop();
      },
    };
    this.active = factory(context);
    await this.active.enter();
    return this.active !== null;
  }

  async stop(): Promise<void> {
    if (this.stopping) return;
    const mode = this.active;
    if (!mode) return;
    this.active = null;
    this.stopping = true;
    try {
      await mode.exit();
      mode.dispose();
    } finally {
      this.stopping = false;
    }
  }
}