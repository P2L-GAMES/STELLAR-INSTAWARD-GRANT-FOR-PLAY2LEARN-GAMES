import { ArenaLights, createCenterGlow, createLightCones, createReflectiveFloor } from './ArenaLights';
import { ArenaFloor, ArenaShell, ParticleField } from './ArenaShell';

export class Arena {
  readonly lights = new ArenaLights();
  readonly shell = new ArenaShell();
  readonly floor = new ArenaFloor();
  readonly particles = new ParticleField();

  build(): this {
    this.lights.group.add(createLightCones());
    this.lights.group.add(createReflectiveFloor());
    this.lights.group.add(createCenterGlow());
    return this;
  }

  update(elapsedSeconds: number): void {
    this.particles.points.rotation.y = elapsedSeconds * 0.02;
  }

  dispose(): void {
    this.floor.dispose();
  }
}

export type { ParticleField };