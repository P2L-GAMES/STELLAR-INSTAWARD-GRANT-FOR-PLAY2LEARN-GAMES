import * as THREE from 'three';
import {
  ARCADE_FLOOR_SIZE,
  MIRROR_CLIP_BIAS,
  MIRROR_COLOR,
  MIRROR_RESOLUTION,
} from '@/config';
import { Reflector } from '@/core/Engine';

export class ArenaShell {
  readonly group = new THREE.Group();

  constructor() {
    this.group.add(this.createRings());
    this.group.add(this.createHexWall());
  }

  private createRings(): THREE.Group {
    const group = new THREE.Group();
    const teal = new THREE.MeshBasicMaterial({
      color: 0x0e5a66,
      transparent: true,
      opacity: 0.5,
    });
    const purple = new THREE.MeshBasicMaterial({
      color: 0x3b1a5e,
      transparent: true,
      opacity: 0.5,
    });
    const rings: Array<[number, number, THREE.Material]> = [
      [14, 4.5, teal],
      [19, 6.5, purple],
      [24, 8.5, teal],
    ];
    for (const [radius, height, material] of rings) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.06, 8, 120),
        material,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = height;
      group.add(ring);
    }
    return group;
  }

  private createHexWall(): THREE.Mesh {
    const texture = new THREE.CanvasTexture(createHexGridCanvas());
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 2);
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(26, 26, 12, 64, 1, true),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    wall.position.y = 5;
    return wall;
  }
}

function createHexGridCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return canvas;

  context.strokeStyle = 'rgba(0,229,255,0.20)';
  context.lineWidth = 2;
  const size = 44;

  for (let row = -1; row < 14; row += 1) {
    for (let column = -1; column < 14; column += 1) {
      const centerX = column * size * 1.5;
      const centerY = row * size * 1.732 + (column % 2 ? size * 0.866 : 0);
      context.beginPath();
      for (let edge = 0; edge < 6; edge += 1) {
        const angle = (Math.PI / 3) * edge + Math.PI / 6;
        const x = centerX + size * 0.5 * Math.cos(angle);
        const y = centerY + size * 0.5 * Math.sin(angle);
        if (edge === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.stroke();
    }
  }
  return canvas;
}

export class ArenaFloor {
  readonly mirror: Reflector;
  readonly group = new THREE.Group();

  constructor() {
    this.mirror = new Reflector(
      new THREE.PlaneGeometry(ARCADE_FLOOR_SIZE, ARCADE_FLOOR_SIZE),
      {
        clipBias: MIRROR_CLIP_BIAS,
        textureWidth: MIRROR_RESOLUTION,
        textureHeight: MIRROR_RESOLUTION,
        color: MIRROR_COLOR,
      },
    );
    this.mirror.rotation.x = -Math.PI / 2;
    this.group.add(this.mirror);
  }

  setResolution(resolution: number): void {
    this.mirror.getRenderTarget().setSize(resolution, resolution);
  }

  dispose(): void {
    this.mirror.dispose();
  }
}

export class ParticleField {
  readonly points: THREE.Points;

  constructor(count = 450) {
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 30;
      positions[index * 3 + 1] = Math.random() * 10 + 0.3;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 20 - 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xff9ae2,
        size: 0.07,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
  }
}
