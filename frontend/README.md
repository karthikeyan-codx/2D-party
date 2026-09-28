# NEX PLAY Frontend 🎨

The client application for NEX PLAY is built using **React**, **TypeScript**, **Vite**, and **Tailwind CSS**.

## Directory Structure & Responsibilities

```text
frontend/
├── public/                 # Static assets, favicons, sounds, manifest
├── src/
│   ├── app/                # App entry point, top-level providers, router setup
│   ├── components/         # Shared, reusable UI components (Buttons, Modals, Cards, Avatars)
│   ├── features/           # Feature-sliced modules (auth, matchmaking, chat, leaderboards)
│   ├── layouts/            # Page layouts (MainLayout, GameRoomLayout, AuthLayout)
│   ├── pages/              # High-level route pages (Home, Lobby, GameRoom, Profile)
│   ├── hooks/              # Custom reusable React hooks (useSocket, useAuth, useAudio)
│   ├── services/           # Network clients (REST API client, WebSocket service)
│   ├── store/              # Global state management slices
│   ├── types/              # Frontend TypeScript definitions and interfaces
│   ├── theme/              # Color palettes, design tokens, typography definitions
│   ├── assets/             # Bundled visual assets, icons, SVG graphics
│   ├── lib/                # Third-party wrappers, utilities, and helper functions
│   └── styles/             # Global CSS stylesheets, Tailwind configurations
├── index.html              # HTML entry point
├── package.json            # Frontend package manifest and scripts
├── tsconfig.json           # TypeScript compiler configuration
└── vite.config.ts          # Vite build and dev server configuration
```

## Guiding Principles

- **No premature component bloat**: Structure is prepared for clean scaling.
- **Arcade Aesthetic**: Visual design aligns with the retro-modern arcade aesthetic (deep navy backgrounds, vibrant accents, tactile chunky controls).
- **Separation from Game Engines**: Game renderers consume domain states exported by `games/<game-id>`.
