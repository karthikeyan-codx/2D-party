# Tic Tac Toe (NEX PLAY Module) ⭕❌

Isolated game domain module for the classic 2-player turn-based Tic Tac Toe game.

## Folder Structure

```text
games/tic-tac-toe/
├── assets/                     # Sound effects and game icons
├── design/                     # Visual reference mockups and aesthetic guidelines
│   ├── game-ui-reference.png   # Primary visual reference for game interface
│   └── README.md               # Design notes and styling tokens
├── logic/                      # Pure game engine (move validation, board reducer, win line detection)
│   └── engine.ts               # Fully deterministic state machine
├── types/                      # Domain types (TicTacToeState, MoveAction, CellValue)
│   └── types.ts                # Pure TypeScript domain contracts
├── tests/                      # Isolated unit test suites for game rules
│   └── engine.test.ts          # 11 comprehensive engine test cases
├── README.md                   # This specification file & database roadmap
└── game.config.ts              # Game metadata, matchmaking criteria, and player limits
```

---

## 🔒 Game Isolation Principles

- **Zero Coupling**: Contains only Tic Tac Toe domain knowledge. No dependencies on React, Vite, or Node server transports.
- **Visual Source of Truth**: The UI implementation adheres strictly to [design/game-ui-reference.png](./design/game-ui-reference.png).
- **Extensible Configuration**: Match settings (turn duration, round counts) are defined in [game.config.ts](./game.config.ts).
- **Session Abstraction**: Consumed by the frontend UI via an abstract `IGameSession` interface (`LocalGameSession` for local play, ready for `WebSocketGameSession` for multiplayer).

---

## 🗄️ Future Database Integration Roadmap

When multiplayer and backend persistence are integrated, match results will be persisted into PostgreSQL (`database/`).

### Target Entity: `tic_tac_toe_matches`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | Unique match identifier |
| `player_x_id` | `UUID (FK)` | User account ID for Player X |
| `player_o_id` | `UUID (FK)` | User account ID for Player O |
| `result` | `VARCHAR(16)` | Outcome (`PLAYER_X_WON`, `PLAYER_O_WON`, `DRAW`, `ABANDONED`) |
| `winning_line` | `SMALLINT[]` | Winning cell indices e.g. `[0, 1, 2]` |
| `moves` | `JSONB` | Chronological list of moves `[{ player: 'X', pos: 4, timestamp: 1690000000 }]` |
| `total_rounds` | `INT` | Total rounds played in the session |
| `final_score_x`| `INT` | Final series score for Player X |
| `final_score_o`| `INT` | Final series score for Player O |
| `duration_ms` | `INT` | Total match duration in milliseconds |
| `created_at` | `TIMESTAMPTZ` | Timestamp when the match started |
| `completed_at`| `TIMESTAMPTZ` | Timestamp when the match concluded |

---

## 🧪 Unit Testing

Run the isolated game engine tests from root:
```bash
npx tsx games/tic-tac-toe/tests/engine.test.ts
```

All 11 core engine scenarios are covered:
1. Initial board setup
2. Valid move placement
3. Invalid move rejection (occupied cell, out of bounds)
4. Player turn switching
5. Horizontal win detection
6. Vertical win detection
7. Diagonal win detection
8. Draw detection (board full with no winner)
9. Rejection of moves after game over
10. Reset round (score preserved) & new match reset
11. Multi-round score accumulation
