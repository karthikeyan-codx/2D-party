import http from 'http';
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { NexPlayWebSocketServer } from './websocket/server.js';
import { roomManager } from './websocket/roomManager.js';
import { matchRepository } from './repositories/matchRepository.js';
import { platformRouter } from './routes/platformRoutes.js';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Platform REST API
app.use('/api', platformRouter);

// Basic Platform Health Endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'NEX PLAY Game Server',
    environment: config.nodeEnv,
    activeRooms: roomManager.getActiveRoomCount(),
    timestamp: new Date().toISOString(),
  });
});

const server = http.createServer(app);

// Attach Server-Authoritative WebSocket Gateway
const nexPlayWs = new NexPlayWebSocketServer(server);

server.listen(config.port, config.host, () => {
  console.log(`[NEX PLAY] Game Server running at http://${config.host}:${config.port}`);
  console.log(`[NEX PLAY] WebSocket Gateway listening at ws://${config.host}:${config.port}/ws`);
});

const shutdown = async () => {
  console.log('[NEX PLAY] Shutting down gracefully...');
  nexPlayWs.getWss().close();
  await matchRepository.close();
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { server, app };
