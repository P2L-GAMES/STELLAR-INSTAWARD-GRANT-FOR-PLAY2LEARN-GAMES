import type { GameModeId } from '@/types';

export class PlayButtonView {
  constructor(
    private readonly button: HTMLButtonElement,
    private readonly onPlay: (modeId: GameModeId) => void,
  ) {
    this.button.addEventListener('click', this.handleClick);
  }

  setEnabled(enabled: boolean): void {
    this.button.disabled = !enabled;
    this.button.style.opacity = enabled ? '1' : '0.5';
    this.button.style.pointerEvents = enabled ? 'auto' : 'none';
  }

  get dispose(): () => void {
    return () => this.button.removeEventListener('click', this.handleClick);
  }

  private readonly handleClick = (): void => {
    this.onPlay('quiz');
  };
}