import { SCORING } from '@/config';
import type { EventBus } from '@/core/EventBus';
import type { AppEvents, ScoringRules } from '@/types';

export class ScoringSystem {
  private pointsValue = 0;
  private cashValue: number;

  constructor(
    private readonly events: EventBus<AppEvents>,
    private readonly rules: ScoringRules = SCORING,
  ) {
    this.cashValue = rules.startingCash;
  }

  get points(): number {
    return this.pointsValue;
  }

  get cash(): number {
    return this.cashValue;
  }

  awardPoints(points: number): void {
    if (!Number.isFinite(points) || points <= 0) return;
    this.pointsValue += points;
    this.events.emit('player:points', { total: this.pointsValue });
  }

  awardCash(cash: number): void {
    if (!Number.isFinite(cash) || cash <= 0) return;
    this.cashValue += cash;
    this.events.emit('player:cash', { total: this.cashValue });
  }

  /** Award a quiz completion: points plus the derived cash reward. */
  awardCorrectAnswer(): void {
    this.awardPoints(this.rules.pointsPerCorrect);
    this.awardCash(this.rules.pointsPerCorrect * this.rules.cashPerPoint);
  }

  restore(points: number, cash: number): void {
    this.pointsValue = Math.max(0, points);
    this.cashValue = Math.max(0, cash);
    this.events.emit('player:points', { total: this.pointsValue });
    this.events.emit('player:cash', { total: this.cashValue });
  }

  reset(): void {
    this.restore(0, this.rules.startingCash);
  }
}