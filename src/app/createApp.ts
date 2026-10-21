import * as THREE from 'three';
import coverTextureUrl from '@/assets/cover1.png';
import { CAMERA_DRIFT, DECK_BOUNDS, DECK_FRAMING, LOADER_FALLBACK_MS, SCORING } from '@/config';
import { AssetLoader } from '@/core/AssetLoader';
import { Engine } from '@/core/Engine';
import { EventBus } from '@/core/EventBus';
import { Loop } from '@/core/Loop';
import { Viewport } from '@/core/Viewport';
import { CardTrio } from '@/entities/CardTrio';
import { FreighterWallet, PayoutService, StellarClient } from '@/stellar';
import { GameRegistry } from '@/game/GameRegistry';
import { LocalSessionStore, Leaderboard, Player, ScoringSystem } from '@/state';
import { UIRoot } from '@/ui';
import { Arena } from '@/world/Arena';
import type { AppEvents, GameModeId, Unsubscribe } from '@/types';

const HINT_TEXT = 'Select a game, then press PLAY to begin';

export interface App {
  readonly engine: Engine;
  readonly events: EventBus<AppEvents>;
  readonly viewport: Viewport;
  readonly player: Player;
  readonly leaderboard: Leaderboard;
  readonly registry: GameRegistry;
  readonly cards: CardTrio;
  readonly ui: UIRoot;
  start(): void;
  dispose(): void;
}

export function createApp(canvas: HTMLCanvasElement): App {
  const events = new EventBus<AppEvents>();
  const viewport = new Viewport();
  const engine = new Engine(canvas, viewport.getTargetPixelRatio());
  const assets = new AssetLoader(engine.maxAnisotropy);
  const loop = new Loop();
  const arena = new Arena().build();

  engine.scene.add(arena.lights.group);
  engine.scene.add(arena.shell.group);
  engine.scene.add(arena.floor.group);
  engine.scene.add(arena.particles.points);
  engine.applyViewport(viewport.getState(), viewport.getTargetPixelRatio());
  // Solve camera distance from the card cascade so cards keep the same
  // apparent size on a phone as on a desktop.
  engine.frameSubjectToViewport(DECK_BOUNDS, DECK_FRAMING.targetWidthFraction, {
    minDistance: DECK_FRAMING.minDistance,
    maxDistance: DECK_FRAMING.maxDistance,
  });

  // ---- state ----
  const store = new LocalSessionStore();
  const scoring = new ScoringSystem(events);
  const player = new Player(generateLocalId(), scoring, store, events);
  const leaderboard = new Leaderboard(store);
  void player.hydrate();

  // ---- Stellar (Phase C) ----
  const walletService = new FreighterWallet();
  const stellarClient = new StellarClient();
  const payoutService = new PayoutService(stellarClient);

  const registry = new GameRegistry(player, events);

  // ---- cards ----
  const cards = new CardTrio({ engine, events, textureUrl: coverTextureUrl, assets, viewport });
  cards.mount();

  // ---- ui ----
  const isBlocked = (): boolean => viewport.isGated;

  const ui = new UIRoot(events, player, {
    hud: {
      onConnect: () => void handleConnect(),
      onAddCash: () => {
        if (isBlocked()) return;
        player.awardCorrectAnswer();
        ui.toast.show('Demo faucet: +100 pts and +USD 50');
      },
    },
    onModeSelect: (modeId) => selectMode(modeId),
    onPlay: (modeId) => void startMode(modeId),
    onModeExit: () => void registry.stop(),
  });

  ui.loader.scheduleFallback(LOADER_FALLBACK_MS);
  ui.setHint(HINT_TEXT);
  ui.modeSelect.setActive('quiz');
  void player.enterLobby();

  events.on('card:ready', () => ui.loader.dismiss());
  let inGameScene = false;
  events.on('game:started', () => {
    ui.play.setEnabled(false);
    cards.setVisible(false);
    inGameScene = true;
  });
  events.on('game:exited', () => {
    ui.play.setEnabled(true);
    cards.setVisible(true);
    inGameScene = false;
    ui.gameLayer.innerHTML = '';
  });

  // Payout quiz earnings to the connected wallet when a round finishes.
  events.on('quiz:finished', async ({ correctCount }) => {
    if (correctCount <= 0 || !player.wallet || player.connectionState !== 'connected') {
      return;
    }
    const amountXlm = (
      correctCount * SCORING.pointsPerCorrect * SCORING.cashPerPoint
    ).toFixed(7);
    try {
      const payout = await payoutService.payout(player.wallet, amountXlm);
      ui.toast.show(
        `Paid ${amountXlm} XLM · ${payout.txHash.slice(0, 8)}…`,
      );
    } catch (error) {
      ui.toast.show(
        `Payout failed: ${(error as Error)?.message ?? String(error)}`,
      );
    }
  });

  async function handleConnect(): Promise<void> {
    if (isBlocked()) return;
    if (player.connectionState === 'connected') {
      await player.disconnect();
      ui.toast.show('Wallet disconnected');
      return;
    }
    await player.beginConnect();
    try {
      const { publicKey } = await walletService.connect();
      await player.completeConnect(publicKey);
      ui.toast.show(`Wallet connected: ${player.walletShort}`);
    } catch (error) {
      await player.cancelConnect();
      ui.toast.show(
        `Wallet connect failed: ${(error as Error)?.message ?? String(error)}`,
      );
    }
  }

  function selectMode(modeId: GameModeId): void {
    ui.setTitle(registry.has(modeId) ? modeId.toUpperCase() : modeId.toUpperCase());
    events.emit('game:changed', { modeId });
  }

  async function startMode(modeId: GameModeId): Promise<void> {
    if (isBlocked()) {
      ui.toast.show('Rotate to landscape to play');
      return;
    }
    if (!player.canEarn) {
      ui.toast.show('Connect your wallet to play');
      return;
    }
    await registry.start(modeId, ui.gameLayer, engine.scene);
  }

  // ---- viewport ----
  const offViewport: Unsubscribe = viewport.onChange((state) => {
    engine.applyViewport(state, viewport.getTargetPixelRatio());
    cards.relayout();
    ui.gate.set(state.gated);
    ui.setHint(HINT_TEXT);
    events.emit('viewport:resized', { width: state.width, height: state.height, gated: state.gated });
  });

  ui.gate.set(viewport.isGated);

  // ---- loop ----
  loop.add((_delta, elapsed) => {
    arena.update(elapsed);
    cards.update(_delta, elapsed);
    registry.activeMode?.update(_delta, elapsed);
    // Hold the camera steady during a game so the cards stay framed.
    applyCameraDrift(engine.camera, inGameScene ? 0 : elapsed);
    engine.focus();
    engine.render();
  });

  return {
    engine,
    events,
    viewport,
    player,
    leaderboard,
    registry,
    cards,
    ui,
    start: () => loop.start(),
    dispose() {
      offViewport();
      void registry.stop();
      loop.dispose();
      cards.dispose();
      arena.dispose();
      viewport.dispose();
      assets.dispose();
      ui.dispose();
      engine.dispose();
      events.clear();
    },
  };
}

function generateLocalId(): string {
  const stored = window.localStorage.getItem('p2l:localId');
  if (stored) return stored;
  const id = Math.random().toString(36).slice(2, 10);
  window.localStorage.setItem('p2l:localId', id);
  return id;
}

function applyCameraDrift(camera: THREE.PerspectiveCamera, elapsed: number): void {
  const baseY = typeof camera.userData.baseY === 'number' ? camera.userData.baseY : 2.4;
  const baseZ = typeof camera.userData.baseZ === 'number' ? camera.userData.baseZ : 9.2;
  camera.position.x = Math.sin(elapsed * CAMERA_DRIFT.speed) * CAMERA_DRIFT.amount;
  camera.position.y = baseY;
  camera.position.z = baseZ;
}