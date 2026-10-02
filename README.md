# Play2Learn Games

**Play to earn, by learning.** A Unity WebGL platform that turns Stellar ecosystem education into short, interactive mini-games.

[![Unity](https://img.shields.io/badge/Unity-6000.6.4f1-000000?logo=unity&logoColor=white)](https://unity.com)
[![Platform](https://img.shields.io/badge/platform-WebGL-0075DA)](https://docs.unity3d.com/6000.0/Documentation/Manual/webgl.html)
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

This repository is currently at the **starting point**: a fresh Unity 2D template with
the project structure and settings committed. Nothing has been built yet — see
[Core Features](#core-features-mvp-scope) below.

| | |
|---|---|
| Unity version | 6000.6.4f1 |
| Render pipeline | Universal Render Pipeline (URP 17.6.0) |
| Target platform | WebGL |
| Current scene | `Assets/Scenes/SampleScene.unity` |
| Network | Stellar Testnet |

---

## Core Features (MVP scope)

### 1. Core Unity WebGL Engine & Framework
WebGL platform architecture built around a unified **main menu hub** and a clean scene
architecture:

| Scene | Purpose |
|---|---|
| Menu | Main hub, navigation to all games and screens |
| Quiz Container | Loads and hosts a game session |
| Profile | Wallet address, XLM balance, stats |
| Leaderboard | Local scores (future: on-chain) |

Backed by a central **GameManager** handling scoring, countdown timers, and state flow, and a
**data-driven question bank schema** so new content can be added without code changes.

### 2. Stellar Wallet Integration
Freighter wallet as **player identity**, via the `StellarUnityDevToolkit` and a WebGL
`.jslib` bridge:

- Detect, connect, and disconnect Freighter
- Wallet address bound as the profile ID
- Live XLM balance shown on the profile HUD
- Testnet reward payout flow, verifiable by tx hash on the Stellar explorer

### 3. Quiz Mini-Game *(optional in SOW)*
The first end-to-end playable loop: multi-choice gameplay, immediate visual/audio
feedback for right and wrong answers, an authored Stellar-focused question bank, and
end-of-game score summary screens.

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
- **Ambassador chapter:** Nigeria
- **Chapter lead:** David Ogoegbunem

### Funding

This project is supported by a **$5,000 Stellar Instaward** — a program funding
short, clearly-scoped, execution-focused work that builds on Stellar. Work is funded to
deliver specific, demonstrable outcomes within 30 days.

---

## Project Structure

```
Play2Earn/
├── Assets/
│   ├── Scenes/          # Scene architecture (Menu, Quiz, Profile, Leaderboard)
│   ├── Settings/        # URP, input actions, scene templates
│   └── Welcome/         # Unity 2D template assets
├── Packages/
│   └── manifest.json    # Package dependencies
├── ProjectSettings/     # Unity project configuration
└── .gitignore           # Excludes Library/, Temp/, Logs/, UserSettings/
```

> Unity-generated folders (`Library/`, `Temp/`, `Logs/`, `UserSettings/`, `obj/`) are
> git-ignored. Never commit them — `Library/` alone is ~1.5 GB. Asset `.meta` files
> **must** be committed; they carry the GUIDs Unity uses to reference assets.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Engine | Unity 6000.6.4f1 (WebGL) |
| Rendering | Universal Render Pipeline (URP) 17.6.0 |
| Input | Unity Input System 1.20.0 |
| Wallet | Freighter via `StellarUnityDevToolkit` |
| Web bridge | JavaScript `.jslib` plugin |
| Network | Stellar Testnet |
| Version control | Git |

---

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Play2EarnGame/Unity-Web.git
   ```

2. **Open in Unity Hub** with version `6000.6.4f1`.

3. **Let the project resolve.** The first import generates `Library/` and takes several
   minutes. Do not commit the result.

4. **Stellar testnet setup** — install the [Freighter browser extension](https://www.freighter.app/),
   switch it to **Testnet**, and fund the account with test XLM from the
   [Stellar Friendbot](https://friendbot.stellar.org/).

---

## Contributing

1. Branch off `main` with a descriptive name.
2. Commit Unity `.meta` files alongside their assets — never selectively drop them.
3. Verify the WebGL build still compiles before opening a pull request.

---

## Links

- **Repository:** https://github.com/Play2EarnGame/Unity-Web
- **Stellar:** https://stellar.org
- **Stellar Testnet Explorer:** https://stellar.expert/explorer/testnet
- **Freighter:** https://www.freighter.app/

---

## License

See [LICENSE](LICENSE).
