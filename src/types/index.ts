export type GameModeId = 'quiz';

/** Question rendering kind. `image` is reserved for a future media question type. */
export type QuestionType = 'text' | 'image';

export interface Answer {
  readonly id: string;
  readonly text: string;
}

export interface Question {
  readonly id: string;
  readonly prompt: string;
  readonly type: QuestionType;
  /** Required when `type === 'image'`. */
  readonly mediaUrl?: string;
  readonly answers: readonly Answer[];
  readonly correctAnswerId: string;
}

export interface GameDefinition {
  readonly modeId: GameModeId;
  readonly label: string;
  /** Total round time in seconds, shared across every question. */
  readonly durationSeconds: number;
  readonly questions: readonly Question[];
}

export type QuizPhase = 'question' | 'reveal' | 'finished';

export interface AnswerResult {
  readonly questionId: string;
  /** null when the player advanced without answering. */
  readonly selectedAnswerId: string | null;
  readonly correct: boolean;
  readonly passed: boolean;
}

export type PlayerConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected';

export type PlayerActivityState = 'idle' | 'inLobby' | 'inGame';

export interface PlayerSnapshot {
  readonly id: string;
  readonly displayName: string;
  readonly rank: string;
  readonly walletAddress: string | null;
  readonly points: number;
  readonly cash: number;
  readonly activity: PlayerActivityState;
}

export interface LeaderboardEntry {
  readonly id: string;
  readonly displayName: string;
  readonly points: number;
  readonly cash: number;
  readonly walletAddress: string | null;
}

export interface CardTransformSpec {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly ry: number;
  readonly selected: boolean;
}

export interface ScoringRules {
  readonly pointsPerCorrect: number;
  readonly cashPerPoint: number;
  readonly startingCash: number;
}

export interface AppEvents extends Record<string, unknown> {
  'card:ready': { count: number };
  'game:changed': { modeId: GameModeId };
  'game:started': { modeId: GameModeId };
  'game:exited': { modeId: GameModeId };
  'quiz:question': {
    index: number;
    total: number;
    question: Question;
    remainingSeconds: number;
  };
  'quiz:answered': {
    questionId: string;
    answerId: string | null;
    correct: boolean;
    passed: boolean;
    pointsAwarded: number;
  };
  'quiz:reveal': { correctAnswerId: string; selectedAnswerId: string | null };
  'quiz:finished': {
    reason: 'completed' | 'timeup';
    correctCount: number;
    total: number;
    results: AnswerResult[];
  };
  'player:points': { total: number };
  'player:cash': { total: number };
  'player:connection': PlayerConnectionState;
  'player:activity': PlayerActivityState;
  'player:wallet': { address: string | null };
  'viewport:resized': { width: number; height: number; gated: boolean };
  'viewport:gated': { gated: boolean };
  'assets:ready': Record<string, unknown>;
}

export type Unsubscribe = () => void;
export type Dispose = () => void;