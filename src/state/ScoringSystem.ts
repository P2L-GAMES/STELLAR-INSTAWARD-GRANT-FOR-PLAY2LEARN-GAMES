import { SCORING } from '@/config';
import type { EventBus } from '@/core/EventBus';
import type { AppEvents, ScoringRules } from '@/types';

export class ScoringSystem {
  private pointsValue = 0;
  private xlmValue: number;

  constructor(
    private readonly events: EventBus<AppEvents>,
    private readonly rules: ScoringRules = SCORING,
  ) {
    this.xlmValue = rules.startingXlm;
  }

  get points(): number {
    return this.pointsValue;
  }

  get xlm(): number {
    return this.xlmValue;
  }

  awardPoints(points: number): void {
    if (!Number.isFinite(points) || points <= 0) return;
    this.pointsValue += points;
    this.events.emit('player:points', { total: this.pointsValue });
  }

  awardXlm(xlm: number): void {
    if (!Number.isFinite(xlm) || xlm <= 0) return;
    this.xlmValue += xlm;
    this.events.emit('player:xlm', { total: this.xlmValue });
  }

  /** Award a quiz completion: points plus the derived XLM reward (deferred until cash-out). */
  awardCorrectAnswer(): void {
    this.awardPoints(this.rules.pointsPerCorrect);
  }

  restore(points: number, xlm: number): void {
    this.pointsValue = Math.max(0, points);
    this.xlmValue = Math.max(0, xlm);
    this.events.emit('player:points', { total: this.pointsValue });
    this.events.emit('player:xlm', { total: this.xlmValue });
  }

  reset(): void {
    this.restore(0, this.rules.startingXlm);
  }
}