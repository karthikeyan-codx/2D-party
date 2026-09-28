# NEX PLAY Database 🗄️

This directory houses the persistence management files for the NEX PLAY platform using **PostgreSQL**.

## Directory Structure & Responsibilities

```text
database/
├── migrations/   # Incremental SQL migration scripts (version-controlled schema alterations)
├── seeds/        # Initial seed datasets (default game configurations, achievement templates, roles)
├── schemas/      # High-level declarative schema definitions / entity relationship models
├── scripts/      # Database backup, restore, reset, and health-check management scripts
└── README.md     # Database architecture and migration guidelines
```

## Strategy

- **Incremental Schema Evolution**: Tables will be introduced gradually as corresponding platform features (Auth, Rooms, Match History, Leaderboards) are implemented.
- **Strict Data Integrity**: Foreign key constraints, indexed lookups for matchmaking history, and transaction-safe match records.
