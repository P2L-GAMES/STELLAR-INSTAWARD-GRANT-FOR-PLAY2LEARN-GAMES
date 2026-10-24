import type * as THREE from 'three';
import type { Viewport } from '@/core/Viewport';
import type { GameModeId } from '@/types';

export interface GameModeContext {
  readonly modeId: GameModeId;
  /** DOM layer owned by the UI layer. */
  readonly layer: HTMLElement;
  /** Three.js scene, for modes that render 3D content. */
  readonly scene: THREE.Scene;
  /** Viewport state, for modes whose 3D layout changes with orientation. */
  readonly viewport: Viewport;
  /** Ask the registry to tear this mode down. The only supported exit path. */
  readonly requestExit: () => void;
}

export interface GameMode {
  readonly modeId: GameModeId;
  readonly label: string;
  enter(): Promise<void>;
  exit(): Promise<void>;
  update(_delta: number, _elapsed: number): void;
  dispose(): void;
}