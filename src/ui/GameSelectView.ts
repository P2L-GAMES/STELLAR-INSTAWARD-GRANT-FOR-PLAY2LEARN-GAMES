import type { EventBus } from '@/core/EventBus';
import type { AppEvents, GameModeId, Unsubscribe } from '@/types';

export class GameSelectView {
  private readonly subscriptions: Unsubscribe[] = [];
  private readonly buttons: HTMLButtonElement[] = [];
  private activeId: GameModeId | null = null;

  constructor(
    container: HTMLElement,
    events: EventBus<AppEvents>,
    private readonly onSelect: (modeId: GameModeId) => void,
    private readonly onComingSoon?: () => void,
  ) {
    for (const element of Array.from(container.querySelectorAll<HTMLButtonElement>('.game-btn'))) {
      const modeId = element.dataset.game as GameModeId | undefined;
      if (!modeId) continue;
      this.buttons.push(element);
      if (element.hasAttribute('data-coming-soon')) {
        element.addEventListener('click', this.handleComingSoon);
        continue;
      }
      element.addEventListener('click', this.createHandler(modeId));
    }
    this.subscriptions.push(
      events.on('game:changed', ({ modeId }) => this.setActive(modeId)),
    );
  }

  setActive(modeId: GameModeId): void {
    this.activeId = modeId;
    for (const button of this.buttons) {
      button.classList.toggle('active', button.dataset.game === modeId);
    }
  }

  get selected(): GameModeId | null {
    return this.activeId;
  }

  dispose(): void {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe();
  }

  private readonly handleComingSoon = (): void => {
    this.onComingSoon?.();
  };

  private createHandler(modeId: GameModeId): () => void {
    return () => {
      this.setActive(modeId);
      this.onSelect(modeId);
    };
  }
}