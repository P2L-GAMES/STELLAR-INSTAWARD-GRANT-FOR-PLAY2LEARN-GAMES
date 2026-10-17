import type { EventBus } from '@/core/EventBus';
import type { QuizGame } from '@/game/quiz/QuizGame';
import type { AppEvents, Answer, Question, Unsubscribe } from '@/types';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export class QuizView {
  private readonly subscriptions: Unsubscribe[] = [];
  private readonly root: HTMLDivElement;
  private readonly timerValue: HTMLSpanElement;
  private readonly timerFill: HTMLDivElement;
  private readonly progressText: HTMLSpanElement;
  private readonly scoreText: HTMLSpanElement;
  private readonly promptText: HTMLSpanElement;
  private readonly answersHost: HTMLDivElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly resultsPanel: HTMLDivElement;
  private lastTimerText = '';
  private answeredIds: HTMLButtonElement[] = [];

  constructor(
    private readonly host: HTMLElement,
    private readonly game: QuizGame,
    events: EventBus<AppEvents>,
    private readonly getPoints: () => number,
    private readonly onExit: () => void,
  ) {
    this.host.innerHTML = TEMPLATE;
    const root = this.host.querySelector<HTMLDivElement>('.quiz');
    if (!root) throw new Error('Quiz template root missing');
    this.root = root;

    this.timerValue = must(root, '.quiz-timer-value');
    this.timerFill = must(root, '.quiz-timer-fill');
    this.progressText = must(root, '.quiz-progress-text');
    this.scoreText = must(root, '.quiz-score');
    this.promptText = must(root, '.quiz-prompt-sr');
    this.answersHost = must(root, '.quiz-answers');
    this.nextButton = must(root, '.quiz-next');
    this.resultsPanel = must(root, '.quiz-results');

    this.nextButton.addEventListener('click', this.handleNext);
    root.querySelector('.quiz-exit')?.addEventListener('click', this.handleExit);
    root.querySelector('.quiz-replay')?.addEventListener('click', this.handleReplay);

    this.subscriptions.push(
      events.on('quiz:question', ({ index, total, question }) => {
        this.renderQuestion(question);
        this.progressText.textContent = `Question ${index + 1} of ${total}`;
        this.setAnswersLocked(false);
        this.resultsPanel.classList.add('hidden');
        this.nextButton.classList.add('hidden');
      }),
      events.on('quiz:reveal', ({ correctAnswerId, selectedAnswerId }) => {
        this.revealAnswers(correctAnswerId, selectedAnswerId);
        this.nextButton.classList.remove('hidden');
      }),
      events.on('quiz:finished', ({ correctCount, total, reason }) => {
        this.renderResults(correctCount, total, reason === 'timeup');
      }),
      events.on('player:points', ({ total: points }) => {
        this.scoreText.textContent = `${points} pts`;
      }),
    );
  }

  /** Round clock. Only touches the DOM when the visible second changes. */
  sync(): void {
    const text = String(this.game.remainingSeconds);
    if (text !== this.lastTimerText) {
      this.lastTimerText = text;
      this.timerValue.textContent = text;
      this.timerFill.style.width = `${this.game.remainingRatio * 100}%`;
    }
    this.timerValue.classList.toggle('urgent', this.game.remainingSeconds <= 10);
  }

  dispose(): void {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe();
    this.nextButton.removeEventListener('click', this.handleNext);
    this.host.innerHTML = '';
  }

  private readonly handleNext = (): void => {
    this.game.advance();
  };

  private readonly handleExit = (): void => {
    this.onExit();
  };

  private readonly handleReplay = (): void => {
    this.game.start();
  };

  private renderQuestion(question: Question): void {
    this.promptText.textContent = question.prompt;

    this.answersHost.innerHTML = '';
    this.answeredIds = [];
    question.answers.forEach((answer, index) => {
      const button = this.createAnswerButton(answer, index);
      this.answersHost.append(button);
      this.answeredIds.push(button);
    });
  }

  private createAnswerButton(answer: Answer, index: number): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz-answer';
    button.dataset.answerId = answer.id;

    const key = document.createElement('span');
    key.className = 'quiz-answer-key';
    key.textContent = `${LETTERS[index] ?? index + 1}.`;

    const label = document.createElement('span');
    label.className = 'quiz-answer-label';
    label.textContent = answer.text;

    button.append(key, label);
    button.addEventListener('click', () => {
      if (this.game.currentPhase !== 'question') return;
      this.game.selectAnswer(answer.id);
    });
    return button;
  }

  private revealAnswers(correctAnswerId: string, selectedAnswerId: string | null): void {
    this.setAnswersLocked(true);
    for (const button of this.answeredIds) {
      const id = button.dataset.answerId;
      if (id === correctAnswerId) button.classList.add('correct');
      else if (id === selectedAnswerId) button.classList.add('incorrect');
      else button.classList.add('dimmed');
    }
  }

  private setAnswersLocked(locked: boolean): void {
    for (const button of this.answeredIds) {
      button.disabled = locked;
      if (!locked) button.classList.remove('correct', 'incorrect', 'dimmed');
    }
  }

  private renderResults(
    correctCount: number,
    total: number,
    timeUp: boolean,
  ): void {
    this.resultsPanel.classList.remove('hidden');
    const heading = this.resultsPanel.querySelector('.quiz-results-title');
    const detail = this.resultsPanel.querySelector('.quiz-results-detail');
    if (heading) {
      heading.textContent = timeUp
        ? 'TIME UP'
        : correctCount === total
          ? 'PERFECT RUN'
          : 'ROUND COMPLETE';
    }
    if (detail) {
      detail.textContent = `${correctCount} of ${total} correct · ${this.getPoints()} pts`;
    }
    this.nextButton.classList.add('hidden');
  }

  get element(): HTMLDivElement {
    return this.root;
  }
}

function must<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing quiz element: ${selector}`);
  return element;
}

const TEMPLATE = `
<div class="quiz">
  <div class="quiz-topbar">
    <div class="quiz-topbar-left">
      <button class="quiz-exit" type="button">Exit</button>
      <div class="quiz-progress">
        <span class="quiz-progress-text">Question 1</span>
        <span class="quiz-score">0 pts</span>
      </div>
    </div>
    <div class="quiz-timer">
      <span class="quiz-timer-value">30</span>
      <div class="quiz-timer-track"><div class="quiz-timer-fill"></div></div>
    </div>
  </div>

  <article class="quiz-card-sr">
    <span class="quiz-prompt-sr"></span>
  </article>

  <div class="quiz-answer-scrim"></div>
  <div class="quiz-answers"></div>

  <div class="quiz-results hidden">
    <div class="quiz-results-title">ROUND COMPLETE</div>
    <div class="quiz-results-detail"></div>
    <div class="quiz-results-actions">
      <button class="quiz-replay" type="button">Play Again</button>
    </div>
  </div>

  <button class="quiz-next" type="button">Next</button>
</div>`;