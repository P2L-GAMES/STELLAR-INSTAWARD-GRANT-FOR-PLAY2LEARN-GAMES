import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import backgroundUrl from '@/assets/Background.jpg';
import { CAMERA, COLORS, type SubjectFraming } from '@/config';
import type { ViewportState } from './Viewport';

export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private backgroundTexture: THREE.Texture | null = null;
  private backgroundAspect = 2;
  private targetY: number = CAMERA.target.y;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    pixelRatio: number,
    antialias = true,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias });
    // Mobile browsers drop the GL context when the tab is backgrounded (for
    // example while a wallet app handles the connection). Allowing the default
    // lets Three.js rebuild its resources when the context comes back.
    canvas.addEventListener('webglcontextlost', (event) => event.preventDefault());
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    // Solid colour until the artwork has decoded, then swap in the image.
    this.scene.background = new THREE.Color(COLORS.background);
    this.scene.backgroundIntensity = 1.35;
    this.scene.fog = new THREE.FogExp2(COLORS.fog, COLORS.fogDensity);
    this.installBackground();

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

  /** Loads the arena backdrop and keeps it covering the viewport. */
  private installBackground(): void {
    const texture = new THREE.TextureLoader().load(backgroundUrl, (loaded) => {
      const image = loaded.image as HTMLImageElement | undefined;
      if (image?.width && image.height) {
        this.backgroundAspect = image.width / image.height;
      }
      this.scene.background = loaded;
      this.fitBackground(loaded, this.camera.aspect);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    this.backgroundTexture = texture;
  }

  /**
   * Scales the backdrop like CSS `cover`: fill the viewport on the tighter
   * axis and crop the overflow, rather than stretching the artwork.
   */
  private fitBackground(texture: THREE.Texture, viewportAspect: number): void {
    if (!this.backgroundAspect || !viewportAspect) return;
    if (viewportAspect > this.backgroundAspect) {
      const repeatY = this.backgroundAspect / viewportAspect;
      texture.repeat.set(1, repeatY);
      texture.offset.set(0, (1 - repeatY) / 2);
    } else {
      const repeatX = viewportAspect / this.backgroundAspect;
      texture.repeat.set(repeatX, 1);
      texture.offset.set((1 - repeatX) / 2, 0);
    }
  }

  /**
   * Frames a subject of known world bounds so it occupies a fixed fraction of
   * the viewport. Framing by width keeps the cards the same apparent size on
   * every screen; an optional height fraction prevents a tall portrait deck
   * from colliding with the answer stack.
   */
  frameSubject(
    bounds: { width: number; height: number; centerZ: number },
    framing: SubjectFraming,
  ): void {
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const heightAtUnitDistance = 2 * Math.tan(halfFov);
    const widthAtUnitDistance = heightAtUnitDistance * this.camera.aspect;

    const distanceByWidth =
      bounds.width / (framing.widthFraction * widthAtUnitDistance);
    const distanceByHeight = framing.heightFraction
      ? bounds.height / (framing.heightFraction * heightAtUnitDistance)
      : 0;
    const distance = Math.max(distanceByWidth, distanceByHeight);

    const clamped = THREE.MathUtils.clamp(
      distance,
      framing.minDistance,
      framing.maxDistance,
    );
    this.camera.userData.baseZ = clamped + bounds.centerZ;
  }

  applyViewport(state: ViewportState, pixelRatio: number): void {
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(state.width, state.height);
    this.camera.aspect = state.aspect;
    if (this.backgroundTexture) this.fitBackground(this.backgroundTexture, state.aspect);

    const fov = state.portrait
      ? CAMERA.fov.portrait
      : state.shortLandscape
        ? CAMERA.fov.shortLandscape
        : state.tier === 'phone' || state.tier === 'tiny'
          ? CAMERA.fov.narrow
          : state.tier === 'tablet'
            ? CAMERA.fov.tablet
            : CAMERA.fov.desktop;

    const position = state.portrait
      ? CAMERA.position.portrait
      : state.shortLandscape
        ? CAMERA.position.shortLandscape
        : state.tier === 'phone' || state.tier === 'tiny'
          ? CAMERA.position.narrow
          : state.tier === 'tablet'
            ? CAMERA.position.tablet
            : CAMERA.position.desktop;

    this.targetY = state.portrait ? CAMERA.target.portraitY : CAMERA.target.y;

    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
    this.camera.userData.baseY = position.y;
    this.camera.userData.baseZ = position.z;
    this.focus();
  }

  focus(): void {
    this.camera.lookAt(0, this.targetY, 0);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.backgroundTexture?.dispose();
    this.backgroundTexture = null;
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