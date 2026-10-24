# Play2Learn Games

**Play to earn, by learning.** A Web3 quiz game for the Stellar ecosystem that turns
Stellar education into short, interactive challenges.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Three.js](https://img.shields.io/badge/three.js-r160-000000?logo=three.js&logoColor=white)](https://threejs.org/)
[![Network](https://img.shields.io/badge/network-Stellar%20Testnet-000000?logo=stellar&logoColor=white)](https://stellar.org)

---

## The Problem

Stellar ecosystem products need simple, engaging ways to onboard new users and explain
the basics — wallets, transactions, and ecosystem utility. Conventional onboarding
(documentation, static tutorials) creates a **knowledge and engagement gap**, especially
for users new to Web3. Most people will not read a doc page; they will play a game.

## The Solution

Play2Learn closes that gap by turning ecosystem education into **short interactive
challenges**. Users learn Stellar concepts by playing, while performing real wallet
interactions in the same session. Learning is not a separate onboarding step — it *is*
the gameplay.

## Target Audience

- New crypto/Web3 users onboarding to Stellar-based products
- Students and developers entering the Stellar ecosystem
- Partner Stellar ecosystem products that want embeddable educational games

---

## Project Status

The project was originally built on **Unity WebGL**. It has since been rebuilt on
**Three.js + TypeScript**, which removes the multi-gigabyte Unity toolchain, produces a
static site that deploys to ordinary shared hosting, and integrates with the Freighter
wallet natively instead of through a `.jslib` bridge.

**What works today:** a playable lobby and a complete 8-question quiz round — an
arena scene with a real mirror floor, floating card cascade, a two-faced question card
deck, a single total-time countdown, answer locking with correct/incorrect reveal, and
scoring that persists across reloads.

| | |
|---|---|
| Engine | Three.js (WebGL), no game engine |
| Language | TypeScript 5.9, `strict` |
| Build | Vite 8 |
| Network | Stellar Testnet |
| Wallet | Freighter extension + WalletConnect (Freighter Mobile) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v22.19.0, npm 10.9.3 |
| Build / Dev | Vite 8.3.4 (dev server, HMR, production build) |
| Language | TypeScript 5.9.3 (`strict`, `noUncheckedIndexedAccess`) |
| 3D | three 0.160.1 |
| Type defs | @types/three 0.160.0 |
| UI | Vanilla DOM + CSS (no framework) |
| Fonts | Orbitron (display), Inter (body) |
| Module system | ESM (`"type": "module"`) |
| Path alias | `@/*` → `src/*` |
| Network | Stellar Testnet |
| Wallets | `@stellar/freighter-api` (desktop), Stellar Wallets Kit + WalletConnect (mobile) |

### Architecture

Source is layered so each layer depends only on those above it. `ui/` and `state/`
never import Three.js; `world/` and `entities/` never touch the DOM;
`app/createApp.ts` is the only module aware of every layer.

| Principle | Where it shows |
|---|---|
| Composition over inheritance | `CardTrio` *has* card meshes; nothing subclasses Three.js types |
| Single responsibility | `Arena` never hears about cards; `HudView` never imports Three.js |
| Dependency injection | `createApp()` constructs and passes every dependency — no imported singletons |
| Encapsulation | `Player` exposes `points`/`cash` as read-only getters |
| Interface contracts | `SessionStore`, `GameMode`, `EventBus<T>` allow drop-in replacements |
| Explicit lifecycle | Every class exposes `dispose()`; switching modes tears the old one down |
| Event-driven | Systems communicate through `EventBus<AppEvents>`, not direct references |
| Configuration over literals | Timing, colours, layout tiers and camera presets live in `config/index.ts` |

---

## Project Structure

```
src/
  main.ts                  Entry point. Boots the app, wires HMR disposal.
  app/createApp.ts         Composition root — constructs and injects all subsystems.
  core/                    Engine.ts (renderer/scene/camera), Loop.ts, EventBus.ts,
                           Viewport.ts, AssetLoader.ts
  world/                   Arena environment: Arena.ts, ArenaLights.ts, ArenaShell.ts
  entities/                CardTrio.ts (lobby cards), QuestionDeck.ts (in-game cards)
  state/                   Player.ts, StateMachines.ts, SessionStore.ts,
                           LocalSessionStore.ts, ScoringSystem.ts, Leaderboard.ts
  game/                    GameMode.ts, GameRegistry.ts, modes/QuizMode.ts,
                           quiz/QuizGame.ts, data/questionBank.ts
  ui/                      UIRoot.ts (sole owner of DOM refs), HudView.ts,
                           GameSelectView.ts, PlayButtonView.ts, QuizView.ts,
                           ToastView.ts, LoaderView.ts
  config/index.ts          All tunables: camera, layout tiers, timing, colours
  types/index.ts           Shared contracts: AppEvents, snapshots, scoring rules
  assets/                  Card artwork used by the build
  style.css                All styles
art/                       Source art carried over from the Unity build (unused)
public/.htaccess           Copied into dist/ on build; Apache config for hosting
```

---

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/P2L-GAMES/STELLAR-INSTAWARD-GRANT-FOR-PLAY2LEARN-GAMES.git
   cd STELLAR-INSTAWARD-GRANT-FOR-PLAY2LEARN-GAMES
   ```

2. **Install and run**
   ```bash
   npm install
   npm run dev        # http://localhost:5179
   ```

3. **Build for production**
   ```bash
   npm run build      # typecheck + build → dist/
   npm run preview    # serve the production build
   ```

4. **Play.** Press **Connect**, then **PLAY**, and answer the eight questions before
   the round timer runs out.

5. **Wallet setup** — install the [Freighter browser extension](https://www.freighter.app/),
   switch it to **Testnet**, and fund the account with test XLM from the
   [Stellar Friendbot](https://friendbot.stellar.org/).

   Phones cannot use the extension. Mobile connects through **WalletConnect**
   (Freighter Mobile, LOBSTR, Scopuly — the desktop list is filtered to wallets
   that can sign Stellar transactions):
   1. Create a free project at [dashboard.reown.com](https://dashboard.reown.com).
   2. Copy `.env.example` to `.env.local` and set
      `VITE_WALLETCONNECT_PROJECT_ID=<your id>`.
   3. Serve over **HTTPS** — WalletConnect deep links and WebCrypto do not work
      on `http://` LAN addresses. Use a tunnel (e.g. `ngrok http 5179` or
      `cloudflared tunnel --url http://localhost:5179`) or a deployed URL.

   Vite inlines the project ID at build time, so set it in the hosting
   environment as well before `npm run build`.

### Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with HMR → http://localhost:5179 |
| `npm run build` | Typecheck, then production build → `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | Types only |

> **Port conflict warning:** if `npm run dev` reports a different port, a stale server
> is already bound to 5179. Vite will silently fall back to the next port while the old
> server keeps serving uncompiled files, which produces a white page with unstyled
> text. Free the port first:
> `Get-NetTCPConnection -State Listen -LocalPort 5179 | % { Stop-Process -Id $_.OwningProcess -Force }`

---

## Plan

### Phase A — State + UI *(complete)*
`state/` and `ui/` layers. Player entity, persistence seam, scoring rules, and all HUD
controls wired to real behaviour.

### Phase B — Quiz Mode *(complete)*
Playable quiz round. `QuizGame` holds the round logic with no DOM dependency;
`QuizView` renders the HUD layer; `QuestionDeck` renders the cards in 3D; `QuizMode`
composes the three.

**Question cards render in 3D.** `QuestionDeck` builds one card per question as a thin
box with two faces: the question template on the front and `cover1.png` on the back.
Each prompt is drawn onto a canvas texture at runtime (word-wrapped, auto-shrinking
font so long questions still fit).

Cards sit in a carousel whose active card always rotates into the **middle** slot, with
its neighbours fanned out left and right and the rest waiting off to the sides. Advancing
flips the finished card *closed* while the next card rotates into the middle and flips
*open* to show its prompt. Only the open card has its prompt painted, so a player cannot
read questions ahead.

**Answering does not flip anything.** Selecting an answer only reveals correctness in
the answer row. **Only `Next` flips cards** — it closes the finished card and flips the
next one open.

Round rules:
- The round is **8 questions**
- `durationSeconds` is the **total round time**, shared across every question — it does
  not reset per question. One countdown with a progress bar, red in the last 10 seconds
- When time runs out the round ends immediately, every card flips closed, and the
  results show `TIME UP`
- A correct answer awards 100 pts and +USD 50
- Pressing `Next` without answering records the question as passed
- The lobby card trio is hidden during a round, and camera drift is disabled

Question schema (`src/types/index.ts`):

```ts
interface GameDefinition {
  modeId: GameModeId;
  label: string;
  durationSeconds: number;      // TOTAL round time, not per question
  questions: Question[];
}

interface Question {
  id: string;
  prompt: string;
  type: 'text' | 'image';       // 'image' reserved for a future media type
  mediaUrl?: string;            // used when type === 'image'
  answers: Answer[];
  correctAnswerId: string;      // references an Answer.id
}
```

`type === 'image'` is already supported by `QuizView`; no image questions are authored
yet. Adding one is a data change only.

### Phase C — Stellar Integration
Web-native wallet integration against **Stellar testnet**.

```
src/stellar/
  NetworkConfig.ts        Testnet passphrase, Horizon URL, explorer link builder
  distributor.config.ts   Testnet distributor key, hard mainnet guard
  WalletService.ts        Freighter extension + lazy WalletConnect router
  StellarClient.ts        Horizon: getBalance(), submitTx()
  PayoutService.ts        Quiz completion → reward payment → tx hash
```

Dependencies: `@stellar/stellar-sdk` (17.2.1), `@stellar/freighter-api` (6.0.1,
note the `-api` suffix), and `@creit.tech/stellar-wallets-kit` (2.7.1) for the
WalletConnect path. The kit is dynamically imported so desktop play never pays
for the mobile dependency graph.

Horizon testnet serves CORS headers, so the browser queries it directly and **no
backend is required**. Player profiles, scores, and the leaderboard live client-side
behind the `SessionStore` interface, so an HTTP-backed implementation can be swapped
in later without touching game or state code.

### Phase D — Deployment *(deploy prep complete)*
- Source maps disabled — `vite.config.ts` sets `sourcemap: false`
- `public/.htaccess` is copied into `dist/` on every build. It pins JS/CSS MIME types
  (some shared hosts serve `.js` as `text/plain`, which makes browsers reject the
  module script and render the page unstyled), enables compression, sets long cache
  headers on the content-hashed `/assets/*`, forces `no-store` on `index.html`, and
  blocks access to source files
- Production output verified by serving `dist/` as plain static files and playing a
  full round with zero console errors
- Remaining: confirm HTTPS on the host, which Freighter and WalletConnect need
- Set `VITE_WALLETCONNECT_PROJECT_ID` in the hosting environment before building

---

## Deployment

The game deploys as a **static site**. No Node.js runtime, backend, or database is
required — ordinary cPanel shared hosting is sufficient.

```bash
npm run build      # produces dist/
```

Upload the **contents** of `dist/` (not the project folder) into `public_html/game/`.
Relative asset paths are configured via `base: './'` in `vite.config.ts`, so a
subdirectory deployment needs no rebuild.

```
dist/
├── .htaccess                  Apache config, copied from public/ on build
├── index.html
└── assets/
    ├── index-<hash>.js        application + Three.js
    ├── index-<hash>.css
    ├── cover1-<hash>.png      lobby card artwork
    └── quiz-chain-card-<hash>.png   in-game question card artwork
```

Upload it as a ZIP and use **Extract** in the cPanel File Manager. Make sure
`index.html` lands directly in `game/`, not in a nested `game/dist/`.

Do not upload `node_modules/`, `src/`, or any config file — browsers cannot execute the
TypeScript sources. Fonts load from the Google Fonts CDN, so nothing extra needs
hosting.

### Security note

The distributor key for testnet reward payouts is expected to ship in the client
bundle, which means it is extractable via devtools. This is acceptable for a
testnet-only demonstration with no real value at stake, and it must never be reused
for mainnet. Testnet XLM is distributed by Friendbot, which funds newly created
accounts — a drained distributor account may need to be recreated rather than topped
up.

---

## Responsive Behaviour

Phones play in **either orientation** — there is no rotate gate.

**Portrait** uses a dedicated vertical layout rather than shrinking the desktop one:
the HUD becomes an identity row plus a full-width wallet strip, the lobby cards fan
into a tight hand, the title/perks/game-select/PLAY stack into a bottom dock, answers
become full-width touch rows above a full-width **Next**, and results collapse to one
scrolling column with a pinned footer. The 3D question deck swaps to a portrait
carousel where the active card sits square-on with its neighbours peeking behind.

**Landscape** keeps the original desktop composition. The CSS only shrinks text and
padding; on short landscape screens the answer row is stacked above **Next** so both
stay clear of each other.

Camera distance is solved on every resize so the card cascade keeps a constant
apparent size instead of shrinking on a pulled-back mobile camera. Landscape frames by
width (`DECK_FRAMING`); portrait frames the active card by height (46% of the viewport)
so it leaves room for the answer stack (`DECK_FRAMING_PORTRAIT`). Both live in
`config/index.ts`.

---

## Team

Built by **Play2Learn Games**:

| Role | Name |
|---|---|
| Builder | David Onyilimba |
| Builder | Temitope Gideon |
| Builder | Innocent Odoh |
| Builder | Marshal Onah |

- **Primary contact:** David Onyilimba — `onyilimbadavid@gmail.com`

---

## Contributing

1. Branch off `main` with a descriptive name.
2. Run `npm run typecheck` before opening a pull request — the build typechecks too.
3. Keep new gameplay inside the existing layers (`ui/`, `state/`, `game/`,
   `entities/`, `world/`). Put tunables in `config/index.ts`, not inline in modules.
4. Every new entity, view, or mode needs a `dispose()`.

---

## Links

- **Repository:** https://github.com/P2L-GAMES/STELLAR-INSTAWARD-GRANT-FOR-PLAY2LEARN-GAMES
- **Stellar:** https://stellar.org
- **Stellar Testnet Explorer:** https://stellar.expert/explorer/testnet
- **Freighter:** https://www.freighter.app/
- **Friendbot (testnet faucet):** https://friendbot.stellar.org/

---

## License

MIT — see [LICENSE](LICENSE).