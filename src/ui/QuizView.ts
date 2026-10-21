import resultCardUrl from '@/assets/Frame 37.png';
import type { EventBus } from '@/core/EventBus';
import type { QuizGame } from '@/game/quiz/QuizGame';
import type { AnswerResult, AppEvents, Answer, Question, Unsubscribe } from '@/types';

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
    private readonly resultsTitle: HTMLDivElement;
    private readonly resultsScore: HTMLDivElement;
    private readonly resultsCorrect: HTMLDivElement;
    private readonly resultsWrong: HTMLDivElement;
    private lastTimerText = '';
    private answeredIds: HTMLButtonElement[] = [];

  constructor(
    private readonly host: HTMLElement,
    private readonly game: QuizGame,
    events: EventBus<AppEvents>,
    private readonly getPoints: () => number,
    private readonly onExit: () => void,
    private readonly onReplay: () => void,
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
    this.resultsPanel.style.setProperty('--result-card-bg', `url("${resultCardUrl}")`);
    this.resultsTitle = must(root, '.quiz-results-title');
    this.resultsScore = must(root, '.quiz-results-score');
    this.resultsCorrect = must(root, '.quiz-results-correct');
    this.resultsWrong = must(root, '.quiz-results-wrong');

    this.nextButton.addEventListener('click', this.handleNext);
    root.querySelector('.quiz-exit')?.addEventListener('click', this.handleExit);
    root.querySelector('.quiz-continue')?.addEventListener('click', this.handleExit);
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
      events.on('quiz:finished', ({ results, reason }) => {
        this.renderResults(results, reason === 'timeup');
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
    this.onReplay();
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

  private renderResults(results: readonly AnswerResult[], timeUp: boolean): void {
    this.resultsPanel.classList.remove('hidden');
    const correctCount = results.filter((result) => result.correct).length;
    this.resultsTitle.textContent = timeUp
      ? 'TIME UP'
      : correctCount === results.length
        ? 'PERFECT RUN'
        : 'VICTORY';
    this.resultsScore.textContent = `SCORE: ${this.getPoints()}`;

    this.resultsCorrect.innerHTML = '';
    this.resultsWrong.innerHTML = '';

    for (const result of results) {
      const question = this.game.questions.find((entry) => entry.id === result.questionId);
      if (!question) continue;

      // Correct cards always echo the right option; wrong cards show what was picked.
      const answerId = result.correct ? question.correctAnswerId : result.selectedAnswerId;
      const answer = answerId
        ? question.answers.find((entry) => entry.id === answerId)
        : undefined;

      const card = this.createResultCard(
        question.prompt,
        answer?.text ?? 'Not answered',
        result.correct,
      );

      (result.correct ? this.resultsCorrect : this.resultsWrong).append(card);
    }

    if (!this.resultsCorrect.childElementCount) {
      this.resultsCorrect.append(this.createEmptyCard('No correct answers'));
    }
    if (!this.resultsWrong.childElementCount) {
      this.resultsWrong.append(this.createEmptyCard('No wrong answers'));
    }

    this.nextButton.classList.add('hidden');
  }

  private createResultCard(
    prompt: string,
    answerText: string,
    correct: boolean,
  ): HTMLElement {
    const card = document.createElement('article');
    card.className = `quiz-result-card ${correct ? 'is-correct' : 'is-wrong'}`;

    const question = document.createElement('p');
    question.className = 'quiz-result-question';
    question.textContent = prompt;

    const answer = document.createElement('p');
    answer.className = 'quiz-result-answer';
    answer.textContent = answerText;

    card.append(question, answer);
    return card;
  }

  private createEmptyCard(label: string): HTMLElement {
    const card = document.createElement('p');
    card.className = 'quiz-result-empty';
    card.textContent = label;
    return card;
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
    <div class="quiz-results-inner">
      <div class="quiz-results-title">VICTORY</div>
      <div class="quiz-results-score"></div>
      <div class="quiz-results-columns">
        <section class="quiz-results-col">
          <h3 class="quiz-results-col-title">Correct Answers</h3>
          <div class="quiz-results-list quiz-results-correct"></div>
        </section>
        <section class="quiz-results-col">
          <h3 class="quiz-results-col-title">Wrong Answers</h3>
          <div class="quiz-results-list quiz-results-wrong"></div>
        </section>
      </div>
      <div class="quiz-results-footer">
        <button class="quiz-replay" type="button">Replay</button>
        <button class="quiz-continue" type="button">Continue</button>
      </div>
    </div>
  </div>

  <button class="quiz-next" type="button">Next</button>
</div>`;