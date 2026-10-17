import type { Dispose } from '@/types';

export type UpdateFn = (deltaSeconds: number, elapsedSeconds: number) => void;

export class Loop {
  private readonly updaters = new Set<UpdateFn>();
  private frameId = 0;
  private lastTime = 0;
  private elapsed = 0;
  private running = false;

  add(update: UpdateFn): Dispose {
    this.updaters.add(update);
    return () => this.updaters.delete(update);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  dispose(): Dispose {
    return () => {
      this.stop();
      this.updaters.clear();
    };
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    this.frameId = requestAnimationFrame(this.tick);

    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.elapsed += delta;

    for (const update of [...this.updaters]) update(delta, this.elapsed);
  };
}