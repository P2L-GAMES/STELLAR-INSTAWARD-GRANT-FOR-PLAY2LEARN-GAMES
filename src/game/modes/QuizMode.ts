import coverUrl from '@/assets/cover1.png';
import questionUrl from '@/assets/quiz-chain-card.png';
import type { GameMode, GameModeContext } from '../GameMode';
import { QuizGame } from '../quiz/QuizGame';
import { quizGame } from '../data/questionBank';
import { QuizView } from '@/ui/QuizView';
import { QuestionDeck } from '@/entities/QuestionDeck';
import type { EventBus } from '@/core/EventBus';
import type { Player } from '@/state/Player';
import type { AppEvents } from '@/types';

export class QuizMode implements GameMode {
  readonly modeId = 'quiz' as const;
  readonly label = 'WEB3 QUIZ';

  private readonly game: QuizGame;
  private readonly view: QuizView;
  private readonly deck: QuestionDeck;
  private readonly subscriptions: Array<() => void> = [];

  constructor(
    private readonly context: GameModeContext,
    private readonly player: Player,
    private readonly events: EventBus<AppEvents>,
  ) {
    this.game = new QuizGame(quizGame, events, {
      onCorrectAnswer: () => {
        this.player.awardCorrectAnswer();
        void this.player.persist();
      },
      onFinish: () => {
        // Every card flips closed once the round is over.
        this.deck.closeAll();
      },
    });

    this.deck = new QuestionDeck(context.scene, context.viewport);

    this.view = new QuizView(
      context.layer,
      this.game,
      events,
      () => this.player.points,
      () => this.context.requestExit(),
      () => this.game.start(),
    );

    // A card only flips when a new question is presented, i.e. on Next.
    // Answering reveals correctness in the answer row and leaves the card open.
    this.subscriptions.push(
      events.on('quiz:question', ({ index, question }) => {
        this.deck.setActive(index, question);
      }),
    );
  }

  async enter(): Promise<void> {
    if (!this.player.enterGame()) {
      this.events.emit('game:exited', { modeId: this.modeId });
      return;
    }
    document.body.classList.add('in-game');
    await this.deck.init(questionUrl, coverUrl, this.game.questions);
    this.game.start();
    this.events.emit('game:started', { modeId: this.modeId });
  }

  async exit(): Promise<void> {
    document.body.classList.remove('in-game');
    if (this.player.activityState === 'inGame') this.player.leaveGame();
    this.events.emit('game:exited', { modeId: this.modeId });
  }

  update(delta: number, elapsed: number): void {
    this.game.update(delta);
    this.view.sync();
    this.deck.update(delta, elapsed);
  }

  dispose(): void {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe();
    this.game.dispose();
    this.view.dispose();
    this.deck.dispose();
    this.context.layer.innerHTML = '';
  }
}