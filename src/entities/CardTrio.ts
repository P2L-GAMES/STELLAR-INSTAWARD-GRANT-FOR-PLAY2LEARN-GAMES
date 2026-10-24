import * as THREE from 'three';
import {
  ANIMATION,
  CARD_TIERS,
  CARD_Z,
  COLORS,
  FALLBACK_CARD_ASPECT,
  SIDE_TILT,
  type CardLayoutTier,
} from '@/config';
import type { AssetLoader } from '@/core/AssetLoader';
import type { Engine } from '@/core/Engine';
import type { EventBus } from '@/core/EventBus';
import type { Viewport } from '@/core/Viewport';
import type { AppEvents } from '@/types';

const tier_defaultY = CARD_TIERS.desktop.ySide;

export interface CardTrioDeps {
  readonly engine: Engine;
  readonly events: EventBus<AppEvents>;
  readonly textureUrl: string;
  readonly assets: AssetLoader;
  readonly viewport: Viewport;
}

/**
 * Decorative lobby cards. They present the available quests but carry no
 * selection state and are not interactive — the game is started from the
 * PLAY button and the game-select panel.
 */
export class CardTrio {
  readonly group = new THREE.Group();

  private readonly deps: CardTrioDeps;
  private readonly cards: THREE.Mesh[] = [];
  private texture: THREE.Texture | null = null;
  private aspect = FALLBACK_CARD_ASPECT;
  private baseY = [1.55, 1.85, 1.55];

  constructor(deps: CardTrioDeps) {
    this.deps = deps;
    this.deps.engine.scene.add(this.group);
  }

  mount(): void {
    this.rebuild();
    void this.loadTexture();
  }

  relayout(): void {
    this.rebuild();
  }

  /** Show or hide the lobby trio (used to clear space for a game scene). */
  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  update(_delta: number, elapsed: number): void {
    this.group.position.y =
      Math.sin(elapsed * ANIMATION.groupBobSpeed) * ANIMATION.groupBobHeight;

    this.cards.forEach((card, index) => {
      const baseY = this.baseY[index] ?? tier_defaultY;
      card.position.y =
        baseY +
        Math.sin(elapsed * ANIMATION.cardBobSpeed + index * 1.3) *
          ANIMATION.cardBobHeight;
    });
  }

  dispose(): void {
    for (const card of this.cards) {
      card.geometry.dispose();
      (card.material as THREE.MeshBasicMaterial).dispose();
    }
    this.cards.length = 0;
    this.deps.engine.scene.remove(this.group);
  }

  private async loadTexture(): Promise<void> {
    try {
      const texture = await this.deps.assets.loadTexture(this.deps.textureUrl, {
        srgb: true,
      });
      this.texture = texture;
      if (texture.image) {
        const width = (texture.image as HTMLImageElement).width;
        const height = (texture.image as HTMLImageElement).height;
        if (width && height) this.aspect = width / height;
      }
      this.rebuild();
      this.deps.events.emit('card:ready', { count: this.cards.length });
    } catch (error) {
      console.error(error);
      this.deps.events.emit('card:ready', { count: this.cards.length });
    }
  }

  private rebuild(): void {
    for (const card of this.cards) {
      card.geometry.dispose();
      (card.material as THREE.MeshBasicMaterial).dispose();
      this.group.remove(card);
    }
    this.cards.length = 0;

    const layout = this.computeLayout();
    for (const spec of layout) {
      const material = this.texture
        ? new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            toneMapped: false,
          })
        : new THREE.MeshBasicMaterial({
            color: COLORS.cardFallback,
            transparent: true,
          });

      const card = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.w, spec.h),
        material,
      );
      card.position.set(spec.x, spec.y, spec.z);
      card.rotation.y = spec.ry;
      this.baseY[this.cards.length] = spec.y;

      this.cards.push(card);
      this.group.add(card);
    }
  }

  private computeLayout(): Array<{
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    ry: number;
  }> {
    const state = this.deps.viewport.getState();
    const tier: CardLayoutTier = state.portrait
      ? CARD_TIERS.portrait
      : CARD_TIERS[state.tier];

    let ySide = tier.ySide;
    let yMid = tier.yMid;
    if (state.shortLandscape) {
      ySide -= 0.25;
      yMid -= 0.25;
    }

    // Portrait fans the trio into a tight hand: the centre card stands proud
    // while its neighbours tuck behind, angled toward the player.
    const sideZ = state.portrait ? CARD_Z - 0.35 : CARD_Z;
    const sideTilt = state.portrait ? 0.34 : SIDE_TILT;

    return [
      {
        x: -tier.spread,
        y: ySide,
        z: sideZ,
        w: tier.sideW,
        h: tier.sideW / this.aspect,
        ry: sideTilt,
      },
      { x: 0, y: yMid, z: CARD_Z, w: tier.midW, h: tier.midW / this.aspect, ry: 0 },
      {
        x: tier.spread,
        y: ySide,
        z: sideZ,
        w: tier.sideW,
        h: tier.sideW / this.aspect,
        ry: -sideTilt,
      },
    ];
  }
}