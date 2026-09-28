# NEX PLAY Backend ⚡

The backend service for NEX PLAY is built with **Node.js** and **TypeScript**, responsible for platform APIs, realtime gameplay synchronization, match coordination, and persistence interfaces.

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Communication Protocols**:
  - **REST API**: Authentication, user profiles, game catalogs, leaderboards
  - **WebSockets**: Low-latency multiplayer room events, matchmaking updates, turn broadcasts, and in-game chat

## Directory Structure & Responsibilities

```text
backend/
├── src/
│   ├── config/         # Environment variables, database configs, server options
│   ├── routes/         # Express / HTTP route declarations
│   ├── controllers/    # Request handlers translating HTTP inputs to service calls
│   ├── services/       # Core business logic (Auth, Matchmaking, Rooms, Sessions)
│   ├── repositories/   # Data access layer interfacing PostgreSQL
│   ├── middleware/     # Auth verification, rate limiting, error handling, validation
│   ├── websocket/      # WebSocket connection lifecycle, event router, room channels
│   ├── modules/        # Modular domains (Auth, Users, Rooms, Friends, Chat, Leaderboards)
│   ├── types/          # Shared server-side TypeScript interfaces and event contracts
│   └── utils/          # Generic helper functions, logger, crypto utilities
├── tests/              # Unit, integration, and socket lifecycle tests
├── package.json        # Backend package definition and scripts
├── tsconfig.json       # TypeScript configuration for Node.js
└── README.md           # Backend documentation
```

## Core Platform Capabilities Prepared

1. **Authentication**: User registration, session tokens / JWTs, guest sessions.
2. **Realtime WebSocket Gateway**: Room creation, join/leave lifecycle, heartbeat, presence.
3. **Matchmaking Engine**: Queue handling, player pairing based on skill/game mode.
4. **Game Session Manager**: Validating moves against pure game domain engines (`games/<game-id>`).
5. **Social Features**: Friends list, direct/room chat, global & per-game leaderboards.
