import { GameSelectView } from './GameSelectView';
import { HudView, type HudHandlers } from './HudView';
import { LoaderView } from './LoaderView';
import { PlayButtonView } from './PlayButtonView';
import { RotateGateView } from './RotateGateView';
import { ToastView } from './ToastView';
import type { EventBus } from '@/core/EventBus';
import type { Player } from '@/state/Player';
import type { AppEvents, Dispose, GameModeId } from '@/types';

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element #${id}`);
  return element as T;
}

export interface UIRootCallbacks {
  readonly hud: HudHandlers;
  readonly onModeSelect: (modeId: GameModeId) => void;
  readonly onPlay: (modeId: GameModeId) => void;
  readonly onModeExit: () => void;
}

export class UIRoot {
  readonly toast: ToastView;
  readonly loader: LoaderView;
  readonly gate: RotateGateView;
  readonly gameLayer: HTMLElement;
  readonly hud: HudView;
  readonly modeSelect: GameSelectView;
  readonly play: PlayButtonView;

  private readonly title: HTMLElement;
  private readonly disposers: Dispose[] = [];

  constructor(
    events: EventBus<AppEvents>,
    player: Player,
    callbacks: UIRootCallbacks,
  ) {
    this.title = requireElement('gameTitle');
    this.toast = new ToastView(requireElement('toast'));
    this.loader = new LoaderView(requireElement('loader'));
    this.gate = new RotateGateView(requireElement('rotateGate'), document.body);

    this.gameLayer = document.createElement('div');
    this.gameLayer.id = 'game-layer';
    document.body.append(this.gameLayer);

    this.hud = new HudView(
      {
        playerId: requireElement('playerId'),
        points: requireElement('pointsVal'),
        xlm: requireElement('cashVal'),
        payout: requireElement<HTMLButtonElement>('payoutBtn'),
        connect: requireElement<HTMLButtonElement>('connectBtn'),
      },
      player,
      events,
      callbacks.hud,
    );

    this.modeSelect = new GameSelectView(
      requireElement('gameSelect'),
      events,
      callbacks.onModeSelect,
    );

    this.play = new PlayButtonView(
      requireElement<HTMLButtonElement>('playBtn'),
      callbacks.onPlay,
    );

    this.disposers.push(
      () => this.hud.dispose(),
      () => this.modeSelect.dispose(),
      () => this.play.dispose(),
      () => this.toast.dispose(),
      () => this.loader.dispose(),
      () => this.gate.dispose(),
    );
  }

  setTitle(label: string): void {
    this.title.textContent = label;
  }

  setHint(text: string): void {
    const hint = document.getElementById('hint');
    if (hint) hint.textContent = text;
  }

  dispose(): void {
    for (const dispose of this.disposers.splice(0)) dispose();
    this.gameLayer.remove();
  }
}