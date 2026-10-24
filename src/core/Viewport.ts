import {
  BREAKPOINTS,
  ORIENTATION_SETTLE_MS,
  PIXEL_RATIO,
  RESIZE_DEBOUNCE_MS,
} from '@/config';

export type ViewportTier = 'tiny' | 'phone' | 'tablet' | 'desktop';

export interface ViewportState {
  readonly width: number;
  readonly height: number;
  readonly aspect: number;
  /** Portrait phone/tablet: uses the vertical layout and camera framing. */
  readonly portrait: boolean;
  readonly shortLandscape: boolean;
  readonly tier: ViewportTier;
}

export class Viewport {
  private readonly listeners = new Set<(state: ViewportState) => void>();
  private readonly mobileQuery = window.matchMedia(PIXEL_RATIO.mobileQuery);
  private debounceId = 0;
  private state: ViewportState;

  constructor() {
    this.state = this.measure();
    this.mobileQuery.addEventListener('change', this.handleSignal);
    window.addEventListener('resize', this.handleSignal, { passive: true });
    window.addEventListener('orientationchange', this.handleOrientation);
    window.visualViewport?.addEventListener('resize', this.handleSignal);
  }

  getState(): ViewportState {
    return this.state;
  }

  get isPortrait(): boolean {
    return this.state.portrait;
  }

  getTargetPixelRatio(): number {
    return this.mobileQuery.matches
      ? Math.min(window.devicePixelRatio, PIXEL_RATIO.mobile)
      : Math.min(window.devicePixelRatio, PIXEL_RATIO.desktop);
  }

  onChange(listener: (state: ViewportState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.listeners.clear();
    window.clearTimeout(this.debounceId);
    this.mobileQuery.removeEventListener('change', this.handleSignal);
    window.removeEventListener('resize', this.handleSignal);
    window.removeEventListener('orientationchange', this.handleOrientation);
    window.visualViewport?.removeEventListener('resize', this.handleSignal);
  }

  private readonly handleOrientation = () => {
    window.setTimeout(() => this.commit(), ORIENTATION_SETTLE_MS);
  };

  private readonly handleSignal = () => {
    window.clearTimeout(this.debounceId);
    this.debounceId = window.setTimeout(() => this.commit(), RESIZE_DEBOUNCE_MS);
  };

  private commit(): void {
    const next = this.measure();
    const changed =
      next.width !== this.state.width ||
      next.height !== this.state.height ||
      next.portrait !== this.state.portrait ||
      next.tier !== this.state.tier;
    if (!changed) return;
    this.state = next;
    for (const listener of [...this.listeners]) listener(next);
  }

  private measure(): ViewportState {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / Math.max(1, height);
    return {
      width,
      height,
      aspect,
      portrait: height > width,
      shortLandscape: height < BREAKPOINTS.shortLandscapeHeight && width > height,
      tier: resolveTier(width, aspect),
    };
  }
}

function resolveTier(width: number, aspect: number): ViewportTier {
  if (width <= BREAKPOINTS.tiny || aspect < 0.7) return 'tiny';
  if (width <= BREAKPOINTS.phone || aspect < 1) return 'phone';
  if (width <= BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}