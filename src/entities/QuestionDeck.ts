import * as THREE from 'three';
import { QUESTION_DECK, type DeckSlot } from '@/config';
import type { Viewport } from '@/core/Viewport';
import type { Question, Unsubscribe } from '@/types';

interface DeckTransform {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly ry: number;
  readonly scale: number;
}

interface DeckCard {
  readonly mesh: THREE.Mesh;
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  readonly template: HTMLImageElement;
  /** Where the card is travelling to as the carousel advances. */
  target: DeckTransform;
  /** 0 shows the question face, PI shows the cover face. */
  flipAngle: number;
  flipTarget: number;
  /** Extra rotation that decays, giving the reveal its swing. */
  swing: number;
  /** Seconds to hold the current transform before easing to the new target. */
  delay: number;
}

/**
 * Question cards held in a carousel. The active card always travels to the
 * middle slot while its neighbours fan out left and right; advancing flips the
 * finished card closed and rotates the next one into the middle, where it flips
 * open to show its prompt.
 */
export class QuestionDeck {
  readonly group = new THREE.Group();

  private readonly cards: DeckCard[] = [];
  private readonly positionEase = QUESTION_DECK.positionEase;
  private readonly rotationEase = QUESTION_DECK.rotationEase;
  private readonly scaleEase = QUESTION_DECK.scaleEase;
  private readonly flipEase = QUESTION_DECK.flipEase;
  private readonly offViewport: Unsubscribe;
  private activeIndex = 0;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly viewport: Viewport,
  ) {
    this.scene.add(this.group);
    // Slot geometry differs between portrait and landscape, so recompute the
    // carousel targets when the device rotates.
    this.offViewport = this.viewport.onChange(() => this.relayout());
  }

  /** Recompute slot targets for the current orientation. */
  relayout(): void {
    this.cards.forEach((card, index) => {
      card.target = this.transformFor(index, this.activeIndex);
    });
  }

  get isReady(): boolean {
    return this.cards.length > 0;
  }

  async init(
    questionTemplateUrl: string,
    coverUrl: string,
    questions: readonly Question[],
  ): Promise<void> {
    const [template, cover] = await Promise.all([
      loadImage(questionTemplateUrl),
      loadImage(coverUrl),
    ]);
    const backTexture = new THREE.CanvasTexture(toCanvas(cover));
    backTexture.colorSpace = THREE.SRGBColorSpace;
    backTexture.anisotropy = 8;

    this.clear();
    const width = QUESTION_DECK.cardWidth;
    const height = width / QUESTION_DECK.aspect;

    questions.forEach((_question, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = template.naturalWidth;
      canvas.height = template.naturalHeight;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;

      const target = this.transformFor(index, 0);

      const faceMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        toneMapped: false,
      });
      const backMaterial = new THREE.MeshBasicMaterial({
        map: backTexture,
        transparent: true,
        toneMapped: false,
      });
      const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0x1b1030 });

      // Box face order: +x, -x, +y, -y, +z (question), -z (cover).
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, QUESTION_DECK.cardThickness),
        [edgeMaterial, edgeMaterial, edgeMaterial, edgeMaterial, faceMaterial, backMaterial],
      );

      mesh.position.set(target.x, target.y, target.z);
      mesh.rotation.y = target.ry + Math.PI;
      mesh.scale.setScalar(target.scale);
      mesh.visible = target.scale > QUESTION_DECK.hiddenScale;
      mesh.renderOrder = 30 - index;

      this.cards.push({
        mesh,
        canvas,
        texture,
        template,
        target,
        flipAngle: Math.PI,
        flipTarget: Math.PI,
        swing: 0,
        delay: 0,
      });
      this.group.add(mesh);
      this.paint(this.cards[this.cards.length - 1]!, null);
    });
  }

  /**
   * Rotates the carousel so the given question sits in the middle slot and
   * flips it open. Every other card closes and fans out to its side.
   */
  setActive(questionIndex: number, question: Question | null): void {
    const previousActive = this.activeIndex;
    this.activeIndex = questionIndex;
    this.cards.forEach((card, index) => {
      const isActive = index === questionIndex && question !== null;
      const offset = index - questionIndex;
      card.target = this.transformFor(index, questionIndex);
      card.flipTarget = isActive ? 0 : Math.PI;
      card.swing = isActive ? QUESTION_DECK.revealSwing : 0;
      card.mesh.renderOrder = isActive ? 40 : 30 - Math.abs(offset);
      card.delay = this.transitionDelay(index, previousActive, questionIndex);
      this.paint(card, isActive ? question : null);
    });
  }

  /** Closes every card, used when the round ends. */
  closeAll(): void {
    for (const card of this.cards) {
      card.flipTarget = Math.PI;
      card.swing = 0;
      this.paint(card, null);
    }
  }

  update(delta: number, elapsed: number): void {
    const bob = Math.sin(elapsed * 0.9) * 0.035;

    for (const card of this.cards) {
      // Hold the card still while its delay runs so the previous card can
      // vacate the slot before this one travels into it.
      if (card.delay > 0) {
        card.delay = Math.max(0, card.delay - delta);
        continue;
      }

      const { target } = card;

      card.flipAngle = damp(card.flipAngle, card.flipTarget, this.flipEase, delta);
      card.swing = Math.max(0, card.swing - QUESTION_DECK.swingDecay * delta * 60);

      // A turning card lifts toward the camera so its sweep clears the cards
      // beside it instead of passing through them.
      const zBoost = Math.sin(card.flipAngle) * QUESTION_DECK.flipZBoost;

      // Ease factors are authored per frame at 60fps; scale them by delta so
      // the motion is identical at 30fps or 120fps instead of stuttering.
      card.mesh.position.x = damp(card.mesh.position.x, target.x, this.positionEase, delta);
      card.mesh.position.y = damp(card.mesh.position.y, target.y + bob, this.positionEase, delta);
      card.mesh.position.z = damp(
        card.mesh.position.z,
        target.z + zBoost,
        this.positionEase,
        delta,
      );

      const rotation = target.ry + card.flipAngle + card.swing;
      card.mesh.rotation.y = damp(card.mesh.rotation.y, rotation, this.rotationEase, delta);

      const targetScale = target.scale * (1 + card.swing * 0.04);
      const current = card.mesh.scale.x || 1;
      const nextScale = damp(current, targetScale, this.scaleEase, delta);
      card.mesh.scale.setScalar(nextScale);
      card.mesh.visible = nextScale > QUESTION_DECK.hiddenScale || target.scale > QUESTION_DECK.hiddenScale;
    }
  }

  /**
   * Maps a card to a slot relative to the active index: the active card takes
   * the middle slot, its immediate neighbours the left and right slots, and any
   * card further away waits off to its side at a negligible scale.
   */
  private transformFor(index: number, active: number): DeckTransform {
    const slots = this.slots;
    const offset = index - active;
    const slot =
      offset === 0
        ? slots[1] ?? QUESTION_DECK.fallbackSlot
        : offset < 0
          ? slots[0] ?? QUESTION_DECK.fallbackSlot
          : slots[2] ?? QUESTION_DECK.fallbackSlot;
    const scale = Math.abs(offset) > 1 ? slot.scale * QUESTION_DECK.hiddenScale : slot.scale;
    return { x: slot.x, y: slot.y, z: slot.z, ry: slot.ry, scale };
  }

  /**
   * Staggers the carousel so a slot is vacated before the next card arrives.
   * Cards that are leaving shrink away first, the outgoing active card moves
   * to its side slot next, the incoming active card takes the middle last, and
   * a freshly revealed side card appears only once its slot is free. Without
   * this the outgoing and incoming cards travel through each other.
   */
  private transitionDelay(
    index: number,
    previousActive: number,
    nextActive: number,
  ): number {
    const nextOffset = index - nextActive;
    const wasVisible = Math.abs(index - previousActive) <= 1;
    const isVisible = Math.abs(nextOffset) <= 1;

    if (nextOffset === 0) return QUESTION_DECK.enterActiveDelay;
    if (!isVisible) return wasVisible ? QUESTION_DECK.exitDelay : 0;
    if (index === previousActive) return QUESTION_DECK.exitActiveDelay;
    return wasVisible ? 0 : QUESTION_DECK.enterSideDelay;
  }

  private get slots(): readonly DeckSlot[] {
    return this.viewport.getState().portrait
      ? QUESTION_DECK.portraitSlots
      : QUESTION_DECK.slots;
  }

  dispose(): void {
    this.offViewport();
    this.clear();
    this.scene.remove(this.group);
  }

  /** Question text is painted only on the open card; closed cards stay blank. */
  private paint(card: DeckCard, question: Question | null): void {
    const context = card.canvas.getContext('2d');
    if (!context) return;
    const { width, height } = card.canvas;

    context.clearRect(0, 0, width, height);
    context.drawImage(card.template, 0, 0, width, height);

    if (question) {
      const maxWidth = width * QUESTION_DECK.textMaxWidthRatio;
      const centerY = height * QUESTION_DECK.textCenterY;

      let size = QUESTION_DECK.textBaseSize;
      let lines: string[] = [];
      for (; size >= QUESTION_DECK.textMinSize; size -= 2) {
        context.font = `800 ${size}px Inter, system-ui, sans-serif`;
        lines = wrapText(context, question.prompt, maxWidth);
        if (lines.length <= QUESTION_DECK.textMaxLines) break;
      }

      context.font = `800 ${size}px Inter, system-ui, sans-serif`;
      context.fillStyle = QUESTION_DECK.textColor;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const lineHeight = size * 1.22;
      const startY = centerY - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, index) => {
        context.fillText(line, width / 2, startY + index * lineHeight);
      });
    }

    card.texture.needsUpdate = true;
  }

  private clear(): void {
    for (const card of this.cards.splice(0)) {
      card.mesh.geometry.dispose();
      const materials = card.mesh.material as THREE.Material[];
      for (const material of materials) {
        const mapped = material as THREE.Material & { map?: THREE.Texture | null };
        mapped.map?.dispose();
        material.dispose();
      }
      this.group.remove(card.mesh);
    }
  }
}

/**
 * Framerate-independent exponential smoothing. `easePerFrame` is the fraction
 * covered each frame at 60fps; the exponent rescales it to the actual step.
 */
function damp(current: number, target: number, easePerFrame: number, delta: number): number {
  const t = 1 - Math.pow(1 - easePerFrame, delta * 60);
  return current + (target - current) * t;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function toCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (context) context.drawImage(image, 0, 0);
  return canvas;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load card artwork: ${url}`));
    image.src = url;
  });
}