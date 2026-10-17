import * as THREE from 'three';
import type { Dispose } from '@/types';

export interface TextureRequestOptions {
  readonly srgb?: boolean;
  readonly anisotropy?: number;
}

export class AssetLoader {
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly cache = new Map<string, Promise<THREE.Texture>>();

  constructor(private readonly maxAnisotropy: number) {}

  loadTexture(url: string, options: TextureRequestOptions = {}): Promise<THREE.Texture> {
    const key = `${url}|${options.srgb ?? true}|${options.anisotropy ?? 'auto'}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const request = new Promise<THREE.Texture>((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          if (options.srgb ?? true) {
            texture.colorSpace = THREE.SRGBColorSpace;
          }
          texture.anisotropy = options.anisotropy ?? this.maxAnisotropy;
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        () => reject(new Error(`Failed to load texture: ${url}`)),
      );
    });

    this.cache.set(key, request);
    return request;
  }

  dispose(): Dispose {
    return () => {
      for (const pending of this.cache.values()) {
        void pending.then((texture) => texture.dispose()).catch(() => undefined);
      }
      this.cache.clear();
    };
  }
}