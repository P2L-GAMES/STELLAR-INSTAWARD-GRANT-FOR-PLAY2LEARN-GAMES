import type { EventBus } from '@/core/EventBus';
import type {
  AnswerResult,
  AppEvents,
  GameDefinition,
  Question,
  QuizPhase,
} from '@/types';

export type QuizEndReason = 'completed' | 'timeup';

export interface QuizGameHooks {
  readonly onCorrectAnswer: () => void;
  /** Fired once when the round ends, for either reason. */
  readonly onFinish: (reason: QuizEndReason) => void;
}

export class QuizGame {
  private index = 0;
  private phase: QuizPhase = 'question';
  /** Total round time remaining, not per question. */
  private remaining = 0;
  private readonly results: AnswerResult[] = [];

  constructor(
    private readonly definition: GameDefinition,
    private readonly events: EventBus<AppEvents>,
    private readonly hooks: QuizGameHooks,
  ) {}

  get questions(): readonly Question[] {
    return this.definition.questions;
  }

  get currentQuestion(): Question | null {
    return this.definition.questions[this.index] ?? null;
  }

  get currentIndex(): number {
    return this.index;
  }

  get total(): number {
    return this.definition.questions.length;
  }

  get currentPhase(): QuizPhase {
    return this.phase;
  }

  /** Whole seconds left in the round. */
  get remainingSeconds(): number {
    return Math.max(0, Math.ceil(this.remaining));
  }

  /** Fraction of the round still remaining, 0–1. Drives the timer bar. */
  get remainingRatio(): number {
    if (this.definition.durationSeconds <= 0) return 0;
    return Math.max(0, Math.min(1, this.remaining / this.definition.durationSeconds));
  }

  get answeredCount(): number {
    return this.results.length;
  }

  get isLastQuestion(): boolean {
    return this.index >= this.total - 1;
  }

  get correctCount(): number {
    return this.results.filter((result) => result.correct).length;
  }

  getResults(): readonly AnswerResult[] {
    return this.results;
  }

  start(): void {
    this.index = 0;
    this.phase = 'question';
    this.results.length = 0;
    this.remaining = this.definition.durationSeconds;
    this.emitQuestion();
  }

  /** Locks in an answer. Ignored once the question is revealed or the round ended. */
  selectAnswer(answerId: string): void {
    if (this.phase !== 'question') return;
    const question = this.currentQuestion;
    if (!question) return;
    if (!question.answers.some((answer) => answer.id === answerId)) return;

    const correct = answerId === question.correctAnswerId;
    this.record(question, answerId, correct);
  }

  /** Advance to the next question, or end the round. */
  advance(): void {
    if (this.phase === 'finished') return;
    if (this.phase === 'question') {
      // Advancing without answering counts as passed.
      const question = this.currentQuestion;
      if (question) this.record(question, null, false);
    }
    if (this.isLastQuestion) {
      this.finish('completed');
      return;
    }
    this.index += 1;
    this.phase = 'question';
    this.emitQuestion();
  }

  /** Counts the total round clock down. Running out ends the round. */
  update(delta: number): void {
    if (this.phase === 'finished') return;
    this.remaining -= delta;
    if (this.remaining > 0) return;
    this.remaining = 0;
    this.phase = 'reveal';
    this.finish('timeup');
  }

  dispose(): void {
    this.results.length = 0;
  }

  private record(
    question: Question,
    answerId: string | null,
    correct: boolean,
  ): void {
    this.results.push({
      questionId: question.id,
      selectedAnswerId: answerId,
      correct,
      passed: answerId === null,
    });

    this.phase = 'reveal';
    if (correct) this.hooks.onCorrectAnswer();

    this.events.emit('quiz:answered', {
      questionId: question.id,
      answerId,
      correct,
      passed: answerId === null,
      pointsAwarded: correct ? 1 : 0,
    });
    this.events.emit('quiz:reveal', {
      correctAnswerId: question.correctAnswerId,
      selectedAnswerId: answerId,
    });
  }

  private finish(reason: QuizEndReason): void {
    if (this.phase === 'finished') return;
    this.phase = 'finished';
    this.recordUnanswered();
    this.events.emit('quiz:finished', {
      reason,
      correctCount: this.correctCount,
      total: this.total,
      results: [...this.results],
    });
    this.hooks.onFinish(reason);
  }

  /**
   * Running out of time can end the round part-way through, leaving questions
   * that were never reached. Record them as unanswered so the results screen
   * accounts for every question instead of silently dropping them.
   */
  private recordUnanswered(): void {
    const seen = new Set(this.results.map((result) => result.questionId));
    for (const question of this.definition.questions) {
      if (seen.has(question.id)) continue;
      this.results.push({
        questionId: question.id,
        selectedAnswerId: null,
        correct: false,
        passed: true,
      });
    }
  }

  private emitQuestion(): void {
    const question = this.currentQuestion;
    if (!question) return;
    this.events.emit('quiz:question', {
      index: this.index,
      total: this.total,
      question,
      remainingSeconds: this.remainingSeconds,
    });
  }
}