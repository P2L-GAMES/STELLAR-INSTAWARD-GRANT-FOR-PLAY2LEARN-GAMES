import type { Dispose } from '@/types';

export type UpdateFn = (deltaSeconds: number, elapsedSeconds: number) => void;

/** Frame gaps larger than this are treated as a pause, not a stall. */
const PAUSE_THRESHOLD_S = 0.5;
/** Integration step is clamped so a slow frame cannot overshoot easing. */
const MAX_DELTA_S = 0.1;

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

    const rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // After the tab is hidden or the emulator stalls, skip the first frame so
    // the bobbing/drift resumes from where it stopped instead of snapping.
    if (rawDelta > PAUSE_THRESHOLD_S) return;

    // Elapsed follows real time so sine-driven motion stays smooth at any
    // frame rate; the clamped delta keeps per-frame integration stable.
    this.elapsed += rawDelta;
    const delta = Math.min(rawDelta, MAX_DELTA_S);

    for (const update of [...this.updaters]) update(delta, this.elapsed);
  };
}