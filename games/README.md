# NEX PLAY Games Module 🎲

All games in the NEX PLAY platform reside in this directory as isolated, independent domain packages.

## Architecture & Isolation Rules

1. **Strict Decoupling**: Each subfolder represents an isolated game. Games do NOT import from each other (e.g., no Chess logic inside Tic Tac Toe, no shared monolith `games.ts`).
2. **Pure Domain Logic**: The `logic/` directory within each game must contain pure functions and state machines independent of UI rendering engines or network transports.
3. **Standard Contract**: Every game defines a `game.config.ts` adhering to the platform's game specification.
4. **Self-Contained Testing**: Game rules must be testable via standalone unit tests in `tests/`.

## Folder Blueprint for Games

```text
games/
└── <game-slug>/
    ├── assets/         # Game-specific audio, sprites, icons, and textures
    ├── design/         # UI/UX reference mocks, design tokens, style specifications
    ├── logic/          # Pure state machine, move validator, win condition checker
    ├── types/          # Domain TypeScript types (GameState, PlayerAction, Board)
    ├── tests/          # Rule validation unit tests
    ├── README.md       # Game rules, mechanics, and domain documentation
    └── game.config.ts  # Standard game metadata and room settings
```

## Active Games

- [Tic Tac Toe](./tic-tac-toe/README.md) - Classic turn-based casual game (2 Players)
