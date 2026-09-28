# NEX PLAY 🎮

**NEX PLAY** is a social multiplayer gaming platform designed to host a growing library of modular multiplayer and single-player casual games (such as Tic Tac Toe, Chess, Ludo, Connect 4, 2D Racing, Word Battle, and more).

---

## 🏗️ Root Architecture Overview

```text
NEX-PLAY/
│
├── frontend/     # React + TypeScript + Vite client application
├── backend/      # Node.js + TypeScript server (REST, WebSockets, Matchmaking)
├── database/     # PostgreSQL schemas, migrations, seeds, and administration
├── games/        # Modular, isolated game engines, configs, and rule sets
├── docs/         # Architecture guides, API specifications, and platform documentation
├── .gitignore    # Monorepo version control exclusions
├── README.md     # Project root documentation
└── package.json  # Monorepo workspace configuration
```

---

## 🎯 Architecture Principles

1. **Strict Separation of Concerns**:
   - `frontend/` handles presentation, UI components, audio, and user interaction.
   - `backend/` handles authentication, sessions, room management, matchmaking, leaderboards, and realtime WebSocket synchronization.
   - `database/` manages relational persistence (PostgreSQL) for user accounts, stats, match histories, and rankings.
   - `games/` houses isolated domain logic, game state engines, rules, configs, and assets decoupled from platform infrastructure.

2. **Game Isolation & Modularity**:
   - Every game lives inside its own dedicated directory under `games/<game-id>/`.
   - Games must not import or leak logic into unrelated games (e.g., no Chess code inside Tic Tac Toe).
   - Core game rules and turn logic remain pure and unit-testable independently of UI or transport frameworks.
   - New games can be registered into the platform shell seamlessly without modifying existing game logic.

3. **Pragmatic & Clean**:
   - No unnecessary microservices or dependency bloat.
   - Intuitive, scalable architecture built for fast developer velocity.

---

## 🚀 Root Directories & Responsibilities

| Directory | Responsibility | Primary Tech Stack |
| :--- | :--- | :--- |
| **`frontend/`** | Web application client, UI shell, game HUDs, and lobby interactions | React, TypeScript, Vite, Tailwind CSS |
| **`backend/`** | Platform API, auth, matchmaking queues, room coordination, WebSocket broker | Node.js, TypeScript, REST, WebSockets |
| **`database/`** | Persistence layer, database migrations, data schemas, seed scripts | PostgreSQL |
| **`games/`** | Isolated game domains (rules, engine logic, contracts, assets, designs) | TypeScript (Pure Domain Logic) |
| **`docs/`** | Technical documentation, design guidelines, and system diagrams | Markdown |

---

## 🧩 Adding Future Games

To introduce a new game to the NEX PLAY platform:
1. Create a directory under `games/<new-game-id>/`.
2. Implement isolated rules, state validation, and configuration conforming to the standard `game.config.ts` contract.
3. Plug into the `frontend` UI shell and `backend` session manager without modifying existing games.
