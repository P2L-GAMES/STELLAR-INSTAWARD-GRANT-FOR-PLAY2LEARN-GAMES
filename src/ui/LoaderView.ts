import type { Dispose } from '@/types';

export class LoaderView {
  private timerId = 0;

  constructor(private readonly root: HTMLElement) {}

  dismiss(): void {
    window.clearTimeout(this.timerId);
    this.root.classList.add('done');
  }

  scheduleFallback(delayMs: number): void {
    this.timerId = window.setTimeout(() => this.dismiss(), delayMs);
  }

  dispose(): Dispose {
    return () => window.clearTimeout(this.timerId);
  }
}