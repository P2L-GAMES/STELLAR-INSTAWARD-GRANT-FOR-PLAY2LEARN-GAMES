import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { CAMERA, COLORS } from '@/config';
import type { ViewportState } from './Viewport';

export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private subjectBounds: {
    bounds: { width: number; centerZ: number };
    targetWidthFraction: number;
    limits: { minDistance: number; maxDistance: number };
  } | null = null;
  private lastViewport: ViewportState | null = null;
  private lastPixelRatio = 1;

  constructor(private readonly canvas: HTMLCanvasElement, pixelRatio: number) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.background);
    this.scene.fog = new THREE.FogExp2(COLORS.fog, COLORS.fogDensity);

    this.camera = new THREE.PerspectiveCamera(
      CAMERA.fov.desktop,
      window.innerWidth / window.innerHeight,
      CAMERA.near,
      CAMERA.far,
    );
    this.camera.position.set(0, CAMERA.position.desktop.y, CAMERA.position.desktop.z);
    this.camera.lookAt(0, CAMERA.target.y, 0);
  }

  get maxAnisotropy(): number {
    return this.renderer.capabilities.getMaxAnisotropy();
  }

  /**
   * Frames a subject of known world bounds so it occupies a fixed fraction of
   * the viewport width. This keeps the cards the same apparent size on a phone
   * as on a desktop, instead of shrinking them on a pulled-back camera.
   */
  frameSubject(
    bounds: { width: number; centerZ: number },
    targetWidthFraction: number,
    limits: { minDistance: number; maxDistance: number },
  ): void {
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const widthAtUnitDistance = 2 * Math.tan(halfFov) * this.camera.aspect;
    const distance =
      bounds.width / (targetWidthFraction * widthAtUnitDistance);
    const clamped = THREE.MathUtils.clamp(
      distance,
      limits.minDistance,
      limits.maxDistance,
    );
    this.camera.userData.baseZ = clamped + bounds.centerZ;
  }

  /** Keeps the subject the same apparent size at every viewport size. */
  frameSubjectToViewport(
    bounds: { width: number; centerZ: number },
    targetWidthFraction: number,
    limits: { minDistance: number; maxDistance: number },
  ): void {
    this.subjectBounds = { bounds, targetWidthFraction, limits };
    if (this.lastViewport) {
      this.applyViewport(this.lastViewport, this.lastPixelRatio);
    }
  }

  applyViewport(state: ViewportState, pixelRatio: number): void {
    this.lastViewport = state;
    this.lastPixelRatio = pixelRatio;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(state.width, state.height);
    this.camera.aspect = state.aspect;

    const fov = state.shortLandscape
      ? CAMERA.fov.shortLandscape
      : state.tier === 'phone' || state.tier === 'tiny'
        ? CAMERA.fov.narrow
        : state.tier === 'tablet'
          ? CAMERA.fov.tablet
          : CAMERA.fov.desktop;

    const position = state.shortLandscape
      ? CAMERA.position.shortLandscape
      : state.tier === 'phone' || state.tier === 'tiny'
        ? CAMERA.position.narrow
        : state.tier === 'tablet'
          ? CAMERA.position.tablet
          : CAMERA.position.desktop;

    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
    this.camera.userData.baseY = position.y;
    this.camera.userData.baseZ = position.z;
    if (this.subjectBounds) {
      this.frameSubject(
        this.subjectBounds.bounds,
        this.subjectBounds.targetWidthFraction,
        this.subjectBounds.limits,
      );
    }
    this.focus();
  }

  focus(): void {
    this.camera.lookAt(0, CAMERA.target.y, 0);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    disposeObjectTree(this.scene);
    this.scene.clear();
    this.renderer.dispose();
    this.canvas.remove();
  }
}

export function disposeObjectTree(root: THREE.Object3D): void {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const material = mesh.material;
    if (Array.isArray(material)) {
      for (const entry of material) disposeMaterial(entry);
    } else if (material) {
      disposeMaterial(material);
    }
  });
}

function disposeMaterial(material: THREE.Material): void {
  const textured = material as THREE.Material & {
    map?: THREE.Texture | null;
  };
  textured.map?.dispose?.();
  material.dispose();
}

export { Reflector };