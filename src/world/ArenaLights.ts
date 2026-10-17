import * as THREE from 'three';
import { COLORS } from '@/config';

export class ArenaLights {
  readonly group = new THREE.Group();

  constructor() {
    this.group.add(new THREE.AmbientLight(0x334, 1.2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(3, 8, 6);
    this.group.add(keyLight);

    this.group.add(this.createSpot(0xff1ad9, 350, [-4, 10, 2], [-1.5, 1, 0]));
    this.group.add(this.createSpot(0x7a2bff, 400, [0, 11, 1], [0, 1.2, 0]));
    this.group.add(this.createSpot(0x00e5ff, 180, [5, 9, 3], [1.8, 1, 0]));
  }

  private createSpot(
    color: number,
    intensity: number,
    [x, y, z]: [number, number, number],
    [tx, ty, tz]: [number, number, number],
  ): THREE.Group {
    const holder = new THREE.Group();
    const light = new THREE.SpotLight(
      color,
      intensity,
      40,
      Math.PI / 6,
      0.5,
      1.6,
    );
    light.position.set(x, y, z);
    light.target.position.set(tx, ty, tz);
    holder.add(light, light.target);
    return holder;
  }
}

export class LightCone {
  readonly mesh: THREE.Mesh;

  constructor(color: number, x: number, height = 9, radius = 3.2) {
    const geometry = new THREE.ConeGeometry(radius, height, 32, 1, true);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, 10 - height / 2, 0.5);
  }
}

export function createLightCones(): THREE.Group {
  const group = new THREE.Group();
  group.add(new LightCone(0xff1ad9, -3.5).mesh);
  group.add(new LightCone(0x8a2bff, 0, 10, 4).mesh);
  group.add(new LightCone(0x00e5ff, 4).mesh);
  return group;
}

export function createReflectiveFloor(): THREE.Group {
  const group = new THREE.Group();
  const overlay = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({
      color: COLORS.overlay,
      transparent: true,
      opacity: COLORS.overlayOpacity,
    }),
  );
  overlay.rotation.x = -Math.PI / 2;
  overlay.position.y = 0.01;
  group.add(overlay);
  return group;
}

export function createCenterGlow(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, 'rgba(0,229,255,0)');
    gradient.addColorStop(0.5, 'rgba(180,60,255,0.9)');
    gradient.addColorStop(1, 'rgba(0,229,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 28, 512, 8);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 1.2),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.02, 1.2);
  return mesh;
}