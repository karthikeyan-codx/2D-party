# Temporary ngrok Setup Guide for NEX PLAY

> **IMPORTANT ARCHITECTURAL NOTICE**:
> ngrok is for **temporary local development and remote cross-device testing ONLY**.
> The production platform, game engine, and WebSocket protocol do not have any runtime dependency on ngrok.

---

## 1. Security Guidelines

- **NEVER** commit your ngrok authtoken to version control.
- **NEVER** hardcode ngrok URLs or tokens into frontend or backend source code.
- **NEVER** commit active `.env` files containing live ngrok domains to Git.
- ngrok tunnels are ephemeral and change whenever restarted (unless using a paid reserved domain).
- Always use `.env.example` templates for Git.

---

## 2. Prerequisites

1. Ensure the **ngrok CLI** is installed on your machine.
2. Authenticate ngrok with your personal token (stored in your machine's global config, never in the repository):
   ```bash
   ngrok config add-authtoken <YOUR_AUTHTOKEN>
   ```

---

## 3. Step-by-Step Remote Testing Workflow

### Step 1: Start Backend and Frontend Locally

In separate terminal tabs:
```bash
# Terminal 1: Start backend on port 4000
npm run dev:backend

# Terminal 2: Start frontend on port 3001 (or 3000)
npm run dev:frontend
```

### Step 2: Open ngrok Tunnels

Open two new terminal tabs to expose your local ports:

```bash
# Terminal 3: Tunnel the backend (HTTP & WebSocket gateway)
ngrok http 4000
```
*Note the HTTPS forwarding URL generated (e.g. `https://abc-123.ngrok-free.app`).*

```bash
# Terminal 4: Tunnel the frontend
ngrok http 3001
```
*Note the HTTPS forwarding URL generated (e.g. `https://xyz-789.ngrok-free.app`).*

### Step 3: Configure Environment Variables

Update your local `.env` files with the temporary ngrok URLs:

1. In `frontend/.env`:
   ```env
   VITE_API_URL=https://<NGROK_BACKEND_URL>
   VITE_WS_URL=wss://<NGROK_BACKEND_URL>
   ```
   *Example:*
   ```env
   VITE_API_URL=https://abc-123.ngrok-free.app
   VITE_WS_URL=wss://abc-123.ngrok-free.app
   ```

2. In `backend/.env`:
   ```env
   PORT=4000
   HOST=0.0.0.0
   FRONTEND_ORIGIN=https://<NGROK_FRONTEND_URL>
   ```
   *Example:*
   ```env
   PORT=4000
   HOST=0.0.0.0
   FRONTEND_ORIGIN=https://xyz-789.ngrok-free.app
   ```

### Step 4: Restart Dev Servers

Restart both `npm run dev:backend` and `npm run dev:frontend` so Vite and Node pick up the updated environment variables.

### Step 5: Test Multiplayer on Two Devices

1. Open `https://<NGROK_FRONTEND_URL>` on **Device A** (e.g. PC browser).
2. Open `https://<NGROK_FRONTEND_URL>` on **Device B** (e.g. Mobile phone on cellular data).
3. On **Device A**: Click `CREATE ROOM`, enter your nickname, and copy the 6-character room code.
4. On **Device B**: Click `JOIN ROOM`, enter your nickname, enter the room code, and click `JOIN ROOM`.
5. Once both players are connected, Device A clicks `START MATCH`.
6. Play the Best-of-5 series across the internet!

---

## 4. How to Return to Normal Local Development

When you finish external testing:

1. Stop the ngrok terminal processes (`Ctrl+C`).
2. Restore local URLs in `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:4000
   VITE_WS_URL=ws://localhost:4000
   ```
3. Restore local URLs in `backend/.env`:
   ```env
   PORT=4000
   HOST=0.0.0.0
   FRONTEND_ORIGIN=http://localhost:3001
   ```
4. Restart your local dev servers.

---

## 5. How to Completely Remove ngrok Later

Because this ngrok setup is 100% environment-driven and isolated:

1. Delete this documentation file:
   ```bash
   rm docs/development/ngrok.md
   ```
2. Revert any `.env` files back to `http://localhost:4000` and `ws://localhost:4000`.
3. No game logic, engine files, WebSocket protocols, or UI components need to be changed or touched.
