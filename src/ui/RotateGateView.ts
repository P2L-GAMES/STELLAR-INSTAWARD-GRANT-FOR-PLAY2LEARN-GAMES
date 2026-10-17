import type { Dispose } from '@/types';

export class RotateGateView {
  constructor(
    private readonly root: HTMLElement,
    private readonly body: HTMLElement,
  ) {}

  set(gated: boolean): void {
    this.body.classList.toggle('gated', gated);
    this.root.setAttribute('aria-hidden', String(!gated));
  }

  get isGated(): boolean {
    return this.body.classList.contains('gated');
  }

  dispose(): Dispose {
    return () => this.set(false);
  }
}