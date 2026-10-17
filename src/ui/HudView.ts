import type { EventBus } from '@/core/EventBus';
import type { Player } from '@/state/Player';
import type { AppEvents, Unsubscribe } from '@/types';

export interface HudElements {
  readonly playerId: HTMLElement;
  readonly points: HTMLElement;
  readonly cash: HTMLElement;
  readonly addCash: HTMLButtonElement;
  readonly connect: HTMLButtonElement;
}

export interface HudHandlers {
  readonly onConnect: () => void;
  readonly onAddCash: () => void;
}

export class HudView {
  private readonly subscriptions: Unsubscribe[] = [];

  constructor(
    private readonly elements: HudElements,
    private readonly player: Player,
    events: EventBus<AppEvents>,
    private readonly handlers: HudHandlers,
  ) {
    this.subscriptions.push(
      events.on('player:points', ({ total }) => {
        elements.points.textContent = `${total} pts`;
      }),
      events.on('player:cash', ({ total }) => {
        elements.cash.textContent = `USD ${total}`;
      }),
      events.on('player:connection', (state) => {
        const connected = state === 'connected';
        elements.connect.classList.toggle('connected', connected);
        elements.connect.textContent = connected ? player.walletShort : 'Connect';
      }),
      events.on('player:wallet', () => {
        elements.playerId.textContent = player.walletShort;
      }),
    );

    elements.addCash.addEventListener('click', this.handleAddCash);
    elements.connect.addEventListener('click', this.handleConnect);

    this.renderIdentity();
    this.renderTotals();
  }

  private readonly handleAddCash = (): void => {
    this.handlers.onAddCash();
  };

  private readonly handleConnect = (): void => {
    this.handlers.onConnect();
  };

  private renderIdentity(): void {
    this.elements.playerId.textContent = this.player.walletShort;
  }

  private renderTotals(): void {
    this.elements.points.textContent = `${this.player.points} pts`;
    this.elements.cash.textContent = `USD ${this.player.cash}`;
  }

  dispose(): void {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe();
    this.elements.addCash.removeEventListener('click', this.handleAddCash);
    this.elements.connect.removeEventListener('click', this.handleConnect);
  }
}