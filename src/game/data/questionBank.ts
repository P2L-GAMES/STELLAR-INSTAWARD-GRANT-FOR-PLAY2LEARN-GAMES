import type { GameDefinition } from '@/types';

/** Total round time in seconds, shared across every question. */
export const QUIZ_DURATION_SECONDS = 80;

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
    {
      id: 'q4',
      prompt: "What is Stellar's consensus protocol called?",
      type: 'text',
      answers: [
        { id: 'a', text: 'Proof of Work' },
        { id: 'b', text: 'Stellar Consensus Protocol' },
        { id: 'c', text: 'Proof of Stake' },
      ],
      correctAnswerId: 'b',
    },
    {
      id: 'q5',
      prompt: 'What is a trustline used for on Stellar?',
      type: 'text',
      answers: [
        { id: 'a', text: 'Holding non-native assets' },
        { id: 'b', text: 'Storing passwords' },
        { id: 'c', text: 'Mining XLM' },
      ],
      correctAnswerId: 'a',
    },
    {
      id: 'q6',
      prompt: 'What is the small fee paid per Stellar transaction called?',
      type: 'text',
      answers: [
        { id: 'a', text: 'Base fee' },
        { id: 'b', text: 'Gas fee' },
        { id: 'c', text: 'Mining reward' },
      ],
      correctAnswerId: 'a',
    },
    {
      id: 'q7',
      prompt: 'What does Friendbot do on Stellar testnet?',
      type: 'text',
      answers: [
        { id: 'a', text: 'Funds test accounts with free XLM' },
        { id: 'b', text: 'Trades tokens for profit' },
        { id: 'c', text: 'Mints NFTs' },
      ],
      correctAnswerId: 'a',
    },
    {
      id: 'q8',
      prompt: 'Which Stellar feature swaps assets directly on-chain?',
      type: 'text',
      answers: [
        { id: 'a', text: 'Path payments' },
        { id: 'b', text: 'Smart contracts' },
        { id: 'c', text: 'Staking pools' },
      ],
      correctAnswerId: 'a',
    },
  ],
};