import { TOAST_DURATION_MS } from '@/config';
import type { Dispose } from '@/types';

export class ToastView {
  private timerId = 0;

  constructor(private readonly root: HTMLElement) {}

  show(message: string): void {
    window.clearTimeout(this.timerId);
    this.root.textContent = message;
    this.root.classList.remove('hidden');
    this.timerId = window.setTimeout(() => {
      this.root.classList.add('hidden');
    }, TOAST_DURATION_MS);
  }

  dispose(): Dispose {
    return () => window.clearTimeout(this.timerId);
  }
}