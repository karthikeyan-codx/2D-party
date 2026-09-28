# NEX PLAY Architecture & Design System

## 1. High-Level System Architecture

```text
       +------------------------------------------------------+
       |                   NEX PLAY Client                    |
       |                (frontend/ - React + Vite)            |
       |                                                      |
       |  +--------------------+      +--------------------+  |
       |  | Platform Shell UI  | <--> |  Active Game UI    |  |
       |  | (Lobby/Rooms/Chat) |      | (HUD, Board, SFX)  |  |
       |  +--------------------+      +--------------------+  |
       +-----------------------------------------^------------+
                         |                       |
            REST API     |                       |  WebSocket
        (Auth/Profiles)  |                       | (Realtime Events)
                         v                       v
       +------------------------------------------------------+
       |                   NEX PLAY Server                    |
       |               (backend/ - Node + TS)                 |
       |                                                      |
       |  +-------------------+        +-------------------+  |
       |  |  Session Manager  | <----> | Matchmaking/Rooms |  |
       |  +-------------------+        +-------------------+  |
       |            |                            |            |
       |            v                            v            |
       |  +------------------------------------------------+  |
       |  |         Game Logic Validator / Runner          |  |
       |  |             (imports from games/)              |  |
       |  +------------------------------------------------+  |
       +-------------------------^----------------------------+
                                 |
                                 v
                       +--------------------+
                       | PostgreSQL Database|
                       |    (database/)     |
                       +--------------------+
```

---

## 2. Domain Isolation Principle

```text
games/
├── tic-tac-toe/  <-- Self-contained domain (Rules, Types, Validation, Assets, Config)
├── chess/        <-- Pure domain logic (isolated)
└── ludo/         <-- Pure domain logic (isolated)
```

- Games are decoupled from network transports and rendering engines.
- Input actions are represented as pure data structures (e.g. `{ type: 'MAKE_MOVE', position: 4 }`).
- Game states are deterministic transitions: `nextState = reduce(currentState, action)`.
