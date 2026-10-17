import type { GameDefinition } from '@/types';

/** Total round time in seconds, shared across all three questions. */
export const QUIZ_DURATION_SECONDS = 30;

export const quizGame: GameDefinition = {
  modeId: 'quiz',
  label: 'WEB3 QUIZ',
  durationSeconds: QUIZ_DURATION_SECONDS,
  questions: [
    {
      id: 'q1',
      prompt: 'What is a Blockchain?',
      type: 'text',
      answers: [
        { id: 'a', text: 'type of cryptocurrency' },
        { id: 'b', text: 'decentralized ledger' },
        { id: 'c', text: 'centralized database' },
      ],
      correctAnswerId: 'b',
    },
    {
      id: 'q2',
      prompt: 'What is the native asset of the Stellar network?',
      type: 'text',
      answers: [
        { id: 'a', text: 'Ethereum' },
        { id: 'b', text: 'Bitcoin' },
        { id: 'c', text: 'XLM' },
      ],
      correctAnswerId: 'c',
    },
    {
      id: 'q3',
      prompt: 'Which wallet connects to Stellar apps?',
      type: 'text',
      answers: [
        { id: 'a', text: 'Freighter' },
        { id: 'b', text: 'A spreadsheet' },
        { id: 'c', text: 'My bank' },
      ],
      correctAnswerId: 'a',
    },
  ],
};