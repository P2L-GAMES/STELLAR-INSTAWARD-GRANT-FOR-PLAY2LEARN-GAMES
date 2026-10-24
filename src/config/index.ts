export const CAMERA = {
  fov: {
    shortLandscape: 58,
    narrow: 62,
    portrait: 52,
    tablet: 55,
    desktop: 50,
  },
  position: {
    shortLandscape: { y: 2.6, z: 11.2 },
    narrow: { y: 2.5, z: 11.6 },
    portrait: { y: 2.4, z: 10.5 },
    tablet: { y: 2.4, z: 10.2 },
    desktop: { y: 2.4, z: 9.2 },
  },
  target: { y: 1.5, portraitY: 1.65 },
  near: 0.1,
  far: 200,
} as const;

export const BREAKPOINTS = {
  tiny: 480,
  phone: 900,
  tablet: 1200,
  wide: 1600,
  shortLandscapeHeight: 500,
} as const;

export const PIXEL_RATIO = {
  mobile: 1.5,
  desktop: 2,
  mobileQuery: '(max-width: 900px)',
} as const;

import type { ScoringRules } from '@/types';

export interface CardLayout {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly ry: number;
}

export interface CardLayoutTier {
  readonly sideW: number;
  readonly midW: number;
  readonly spread: number;
  readonly ySide: number;
  readonly yMid: number;
}

export const CARD_TIERS = {
  tiny: { sideW: 1.2, midW: 1.5, spread: 1.5, ySide: 1.45, yMid: 1.7 },
  phone: { sideW: 1.5, midW: 1.95, spread: 1.95, ySide: 1.55, yMid: 1.8 },
  tablet: { sideW: 1.4, midW: 1.75, spread: 1.8, ySide: 1.5, yMid: 1.8 },
  desktop: { sideW: 1.55, midW: 1.95, spread: 1.95, ySide: 1.55, yMid: 1.85 },
  /** Portrait mobiles: a tight hand of cards fanned toward the player. */
  portrait: { sideW: 1.15, midW: 1.5, spread: 0.82, ySide: 2.2, yMid: 2.5 },
} as const satisfies Record<string, CardLayoutTier>;

export const SIDE_TILT = 0.22;
export const CARD_Z = 0.9;
export const FALLBACK_CARD_ASPECT = 0.668;

export const ANIMATION = {
  cardBobSpeed: 1.6,
  cardBobHeight: 0.05,
  groupBobSpeed: 0.8,
  groupBobHeight: 0.03,
} as const;

export const COLORS = {
  background: 0x05070f,
  fog: 0x05070f,
  fogDensity: 0.028,
  gold: 0xffcc00,
  cardFallback: 0x2a0a5e,
  overlay: 0x05070f,
  overlayOpacity: 0.72,
} as const;

export const SCORING = {
  pointsPerCorrect: 100,
  /** Points → XLM conversion rate used when cashing out (100 pts = 0.5 XLM). */
  xlmPerPoint: 0.005,
  startingXlm: 0,
} as const satisfies ScoringRules;

export const STORAGE_KEYS = {
  playerPrefix: 'p2l:player:',
  index: 'p2l:index',
} as const;

export const DEFAULT_PLAYER = {
  displayName: 'PLAY2LEARNER',
  rank: "MINER'S",
} as const;

export interface DeckSlot {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly ry: number;
  readonly scale: number;
}

/**
 * Carousel arrangement for the in-game question cards. Slot 1 is the active
 * position in the middle; slot 0 and slot 2 fan out to the left and right.
 */
export const QUESTION_DECK = {
  aspect: 0.7436,
  cardWidth: 2.45,
  cardThickness: 0.06,
  /** Extra rotation that decays as the active card swings open. */
  revealSwing: 0.85,
  swingDecay: 0.03,
  flipEase: 0.085,
  slots: [
    { x: -2.3, y: 2.05, z: 0.8, ry: -0.22, scale: 1.0 },
    { x: 0.15, y: 2.62, z: 0.0, ry: 0.06, scale: 0.95 },
    { x: 2.5, y: 1.95, z: -0.4, ry: 0.28, scale: 0.9 },
  ] satisfies DeckSlot[],
  /** Portrait stack: the active card sits square-on, neighbours peek behind. */
  portraitSlots: [
    { x: -0.42, y: 2.32, z: -0.5, ry: 0.16, scale: 0.84 },
    { x: 0, y: 2.58, z: 0.1, ry: 0, scale: 1.0 },
    { x: 0.42, y: 2.32, z: -0.5, ry: -0.16, scale: 0.84 },
  ] satisfies DeckSlot[],
  fallbackSlot: { x: 0.15, y: 2.62, z: 0.0, ry: 0.06, scale: 0.95 } satisfies DeckSlot,
  portraitFallbackSlot: { x: 0, y: 2.58, z: 0.1, ry: 0, scale: 1.0 } satisfies DeckSlot,
  /** Cards further than one slot from the active card shrink to this scale. */
  hiddenScale: 0.001,
  positionEase: 0.12,
  rotationEase: 0.1,
  scaleEase: 0.12,
  /** Stagger (seconds) so a slot is vacated before the next card arrives. */
  exitDelay: 0,
  exitActiveDelay: 0.12,
  enterActiveDelay: 0.3,
  enterSideDelay: 0.45,
  /**
   * How far a card lifts toward the camera at the midpoint of its flip. The
   * sweep of a turning card would otherwise pass through its neighbours, which
   * are only a fraction of a card-width apart on a phone.
   */
  flipZBoost: 0.9,
  /** Vertical centre of the writable area inside the card artwork. */
  textCenterY: 0.5,
  textMaxWidthRatio: 0.68,
  textMaxLines: 4,
  textBaseSize: 68,
  textMinSize: 34,
  textColor: '#5b1bd6',
} as const;

export const CAMERA_DRIFT = {
  speed: 0.15,
  amount: 0.25,
} as const;

export interface SubjectFraming {
  readonly widthFraction: number;
  readonly heightFraction?: number;
  readonly minDistance: number;
  readonly maxDistance: number;
}

/** Screen-space footprint the deck should occupy, independent of viewport. */
export const DECK_FRAMING: SubjectFraming = {
  widthFraction: 0.47,
  minDistance: 6,
  maxDistance: 12,
};

/**
 * Portrait screens are tall and narrow, so the deck is framed by height while
 * leaving the lower third free for the answer stack.
 */
export const DECK_FRAMING_PORTRAIT: SubjectFraming = {
  widthFraction: 0.9,
  heightFraction: 0.46,
  minDistance: 5,
  maxDistance: 20,
};

/** World-space bounds of the question card cascade. */
export const DECK_BOUNDS = (() => {
  const halfW = QUESTION_DECK.cardWidth / 2;
  const halfH = halfW / QUESTION_DECK.aspect;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let zSum = 0;
  for (const slot of QUESTION_DECK.slots) {
    const halfCardW = halfW * slot.scale;
    const halfCardH = halfH * slot.scale;
    minX = Math.min(minX, slot.x - halfCardW);
    maxX = Math.max(maxX, slot.x + halfCardW);
    minY = Math.min(minY, slot.y - halfCardH);
    maxY = Math.max(maxY, slot.y + halfCardH);
    zSum += slot.z;
  }
  return {
    width: maxX - minX,
    height: maxY - minY,
    centerY: (minY + maxY) / 2,
    centerZ: zSum / QUESTION_DECK.slots.length,
  };
})();

/** World-space bounds of the active portrait card only. */
export const DECK_BOUNDS_PORTRAIT = (() => {
  const slot = QUESTION_DECK.portraitSlots[1] ?? QUESTION_DECK.portraitFallbackSlot;
  const halfW = (QUESTION_DECK.cardWidth * slot.scale) / 2;
  const halfH = halfW / QUESTION_DECK.aspect;
  return {
    width: halfW * 2,
    height: halfH * 2,
    centerY: slot.y,
    centerZ: slot.z,
  };
})();

export const RESIZE_DEBOUNCE_MS = 150;
export const ORIENTATION_SETTLE_MS = 300;
export const TOAST_DURATION_MS = 2600;
export const LOADER_FALLBACK_MS = 4000;

export const ARCADE_FLOOR_SIZE = 60;
export const MIRROR_RESOLUTION = 1024;
/** Cheaper reflection target on phones/emulators, where the mirror is a full second render pass. */
export const MIRROR_RESOLUTION_MOBILE = 256;
export const MIRROR_COLOR = 0x303038;
export const MIRROR_CLIP_BIAS = 0.003;