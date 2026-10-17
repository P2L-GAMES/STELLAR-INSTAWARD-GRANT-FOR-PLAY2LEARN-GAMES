import * as THREE from 'three';
import { QUESTION_DECK, type DeckSlot } from '@/config';
import type { Question } from '@/types';

interface DeckCard {
  readonly mesh: THREE.Mesh;
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  readonly template: HTMLImageElement;
  readonly slot: DeckSlot;
  /** 0 shows the question face, PI shows the cover face. */
  flipAngle: number;
  flipTarget: number;
  /** Extra rotation that decays, giving the reveal its swing. */
  swing: number;
}

/**
 * Three question cards held in a fixed cascade. Cards never change position —
 * they only rotate. The active card is flipped open to show its prompt, every
 * other card is flipped closed and shows the cover artwork.
 */
export class QuestionDeck {
  readonly group = new THREE.Group();

  private readonly cards: DeckCard[] = [];
  private readonly rotationEase = QUESTION_DECK.rotationEase;
  private readonly scaleEase = QUESTION_DECK.scaleEase;
  private readonly flipEase = QUESTION_DECK.flipEase;

  constructor(private readonly scene: THREE.Scene) {
    this.scene.add(this.group);
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

      const slot = QUESTION_DECK.slots[index] ?? QUESTION_DECK.fallbackSlot;

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

      // Fixed for the card's whole lifetime — it never moves.
      mesh.position.set(slot.x, slot.y, slot.z);
      mesh.rotation.y = slot.ry + Math.PI;
      mesh.scale.setScalar(slot.scale);
      mesh.renderOrder = 30 - index;

      this.cards.push({
        mesh,
        canvas,
        texture,
        template,
        slot,
        flipAngle: Math.PI,
        flipTarget: Math.PI,
        swing: 0,
      });
      this.group.add(mesh);
      this.paint(this.cards[this.cards.length - 1]!, null);
    });
  }

  /**
   * Opens the card holding the given question and closes every other card.
   * Called when a new question is presented, which is what makes cards flip.
   */
  setActive(questionIndex: number, question: Question | null): void {
    this.cards.forEach((card, index) => {
      const isActive = index === questionIndex && question !== null;
      card.flipTarget = isActive ? 0 : Math.PI;
      card.swing = isActive ? QUESTION_DECK.revealSwing : 0;
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
      // Only the card's own idle bob moves it; position never re-targets.
      card.mesh.position.y = card.slot.y + bob;

      card.flipAngle += (card.flipTarget - card.flipAngle) * this.flipEase;
      card.swing = Math.max(0, card.swing - QUESTION_DECK.swingDecay * delta * 60);

      const rotation = card.slot.ry + card.flipAngle + card.swing;
      card.mesh.rotation.y += (rotation - card.mesh.rotation.y) * this.rotationEase;

      const targetScale = card.slot.scale * (1 + card.swing * 0.04);
      const current = card.mesh.scale.x || 1;
      card.mesh.scale.setScalar(current + (targetScale - current) * this.scaleEase);
    }
  }

  dispose(): void {
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