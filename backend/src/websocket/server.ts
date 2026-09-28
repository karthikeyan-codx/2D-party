import { Server as HttpServer } from 'http';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { ClientMessage } from '../types/protocol.js';
import { roomManager } from './roomManager.js';
import { platformStore } from '../repositories/platformStore.js';

interface RateLimitTracker {
  count: number;
  lastReset: number;
}

export class NexPlayWebSocketServer {
  private wss: WebSocketServer;
  private rateLimits: Map<WebSocket, RateLimitTracker> = new Map();
  private userSockets: Map<string, WebSocket> = new Map(); // userId -> WebSocket
  private socketUsers: Map<WebSocket, string> = new Map(); // WebSocket -> userId
  private roomSockets: Map<string, Set<WebSocket>> = new Map(); // partyRoomId -> Set<WebSocket>

  private static MAX_MESSAGE_SIZE = 8192;
  private static MAX_MSGS_PER_SEC = 30;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      maxPayload: NexPlayWebSocketServer.MAX_MESSAGE_SIZE,
    });

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });
  }

  private isRateLimited(ws: WebSocket): boolean {
    const now = Date.now();
    let tracker = this.rateLimits.get(ws);
    if (!tracker || now - tracker.lastReset > 1000) {
      tracker = { count: 1, lastReset: now };
      this.rateLimits.set(ws, tracker);
      return false;
    }

    tracker.count++;
    return tracker.count > NexPlayWebSocketServer.MAX_MSGS_PER_SEC;
  }

  private handleConnection(ws: WebSocket) {
    ws.on('message', (data: RawData) => {
      if (this.isRateLimited(ws)) {
        ws.send(
          JSON.stringify({
            type: 'ERROR',
            payload: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
          })
        );
        return;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        ws.send(
          JSON.stringify({
            type: 'ERROR',
            payload: { code: 'MALFORMED_JSON', message: 'Invalid JSON payload received.' },
          })
        );
        return;
      }

      if (!parsed || typeof parsed !== 'object' || !parsed.type) {
        ws.send(
          JSON.stringify({
            type: 'ERROR',
            payload: { code: 'INVALID_MESSAGE', message: 'Message must contain a valid "type" field.' },
          })
        );
        return;
      }

      this.routeMessage(ws, parsed);
    });

    const cleanup = () => {
      this.rateLimits.delete(ws);
      roomManager.handleDisconnect(ws);

      const userId = this.socketUsers.get(ws);
      if (userId) {
        this.userSockets.delete(userId);
        this.socketUsers.delete(ws);
        platformStore.updateUserStatus(userId, 'OFFLINE');
        this.broadcastAll({
          type: 'PRESENCE_UPDATED',
          payload: { userId, status: 'OFFLINE' },
        });
      }

      // Cleanup room subscriptions
      for (const [roomId, sockets] of this.roomSockets.entries()) {
        if (sockets.has(ws)) {
          sockets.delete(ws);
          if (sockets.size === 0) {
            this.roomSockets.delete(roomId);
          }
        }
      }
    };

    ws.on('close', cleanup);
    ws.on('error', cleanup);
  }

  private routeMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      // ==========================================
      // Existing Tic Tac Toe Game Protocol (Untouched)
      // ==========================================
      case 'CREATE_ROOM':
        roomManager.createRoom(ws, message.payload?.displayName);
        break;

      case 'JOIN_ROOM':
        if (!message.payload?.roomId) {
          ws.send(
            JSON.stringify({
              type: 'ERROR',
              payload: { code: 'MISSING_ROOM_ID', message: 'roomId is required to join.' },
            })
          );
          return;
        }
        roomManager.joinRoom(
          ws,
          message.payload.roomId,
          message.payload.displayName,
          message.payload.playerId
        );
        break;

      case 'START_GAME':
        if (message.payload?.roomId && message.payload?.playerId) {
          roomManager.startGame(ws, message.payload.roomId, message.payload.playerId);
        }
        break;

      case 'MAKE_MOVE':
        if (
          !message.payload?.roomId ||
          !message.payload?.playerId ||
          message.payload.position === undefined
        ) {
          ws.send(
            JSON.stringify({
              type: 'MOVE_REJECTED',
              payload: {
                code: 'MALFORMED_PAYLOAD',
                reason: 'Missing roomId, playerId, or position.',
              },
            })
          );
          return;
        }
        roomManager.handleMove(
          ws,
          message.payload.roomId,
          message.payload.playerId,
          message.payload.position
        );
        break;

      case 'NEXT_ROUND_READY':
        if (message.payload?.roomId && message.payload?.playerId) {
          roomManager.handleNextRoundReady(ws, message.payload.roomId, message.payload.playerId);
        }
        break;

      case 'PLAY_AGAIN':
        if (message.payload?.roomId && message.payload?.playerId) {
          roomManager.playAgain(ws, message.payload.roomId, message.payload.playerId);
        }
        break;

      case 'LEAVE_ROOM':
        roomManager.leaveRoom(ws);
        break;

      case 'PING':
        ws.send(JSON.stringify({ type: 'PONG', payload: { timestamp: Date.now() } }));
        break;

      // ==========================================
      // Platform Realtime: Presence, Chat, Party Rooms
      // ==========================================

      case 'USER_IDENTIFY': {
        const { userId, status = 'ONLINE' } = message.payload || {};
        if (userId) {
          this.userSockets.set(userId, ws);
          this.socketUsers.set(ws, userId);
          platformStore.updateUserStatus(userId, status);
          this.broadcastAll({
            type: 'PRESENCE_UPDATED',
            payload: { userId, status },
          });
          ws.send(
            JSON.stringify({
              type: 'IDENTIFY_SUCCESS',
              payload: { userId, status },
            })
          );
        }
        break;
      }

      case 'PRESENCE_SET': {
        const userId = this.socketUsers.get(ws) || message.payload?.userId;
        const status = message.payload?.status || 'ONLINE';
        if (userId) {
          platformStore.updateUserStatus(userId, status);
          this.broadcastAll({
            type: 'PRESENCE_UPDATED',
            payload: { userId, status },
          });
        }
        break;
      }

      case 'DIRECT_CHAT_SEND': {
        const senderId = this.socketUsers.get(ws) || message.payload?.senderId;
        const { conversationId, content, targetUserId, clientMessageId } = message.payload || {};
        if (senderId && conversationId && content) {
          const msg = platformStore.addMessage(conversationId, senderId, content, clientMessageId);
          if (msg) {
            const payload = { conversationId, message: msg };
            // Echo back to sender
            ws.send(JSON.stringify({ type: 'DIRECT_CHAT_RECEIVED', payload }));
            // Send to recipient if connected
            if (targetUserId) {
              const targetWs = this.userSockets.get(targetUserId);
              if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify({ type: 'DIRECT_CHAT_RECEIVED', payload }));
              }
            }
          }
        }
        break;
      }

      case 'DIRECT_CHAT_TYPING': {
        const senderId = this.socketUsers.get(ws) || message.payload?.senderId;
        const { conversationId, targetUserId, isTyping } = message.payload || {};
        if (targetUserId) {
          const targetWs = this.userSockets.get(targetUserId);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(
              JSON.stringify({
                type: 'DIRECT_CHAT_TYPING',
                payload: { conversationId, senderId, isTyping },
              })
            );
          }
        }
        break;
      }

      case 'PARTY_ROOM_SUBSCRIBE': {
        const { roomId } = message.payload || {};
        if (roomId) {
          if (!this.roomSockets.has(roomId)) {
            this.roomSockets.set(roomId, new Set());
          }
          this.roomSockets.get(roomId)?.add(ws);
        }
        break;
      }

      case 'PARTY_ROOM_UNSUBSCRIBE': {
        const { roomId } = message.payload || {};
        if (roomId && this.roomSockets.has(roomId)) {
          this.roomSockets.get(roomId)?.delete(ws);
        }
        break;
      }

      case 'PARTY_ROOM_CHAT_SEND': {
        const userId = this.socketUsers.get(ws) || message.payload?.userId;
        const { roomId, content, clientMessageId } = message.payload || {};
        if (userId && roomId && content) {
          const updated = platformStore.addRoomMessage(roomId, userId, content, clientMessageId);
          if (updated) {
            const lastMsg = updated.messages[updated.messages.length - 1];
            this.broadcastToRoom(roomId, {
              type: 'PARTY_ROOM_CHAT_MESSAGE',
              payload: { roomId, message: lastMsg },
            });
          }
        }
        break;
      }

      case 'PARTY_ROOM_READY_TOGGLE': {
        const userId = this.socketUsers.get(ws) || message.payload?.userId;
        const { roomId, isReady } = message.payload || {};
        if (userId && roomId) {
          const updated = platformStore.setReady(roomId, userId, isReady);
          if (updated) {
            this.broadcastToRoom(roomId, {
              type: 'PARTY_ROOM_STATE_UPDATED',
              payload: { room: updated },
            });
          }
        }
        break;
      }

      case 'PARTY_ROOM_START_GAME': {
        const userId = this.socketUsers.get(ws) || message.payload?.userId;
        const { roomId } = message.payload || {};
        if (userId && roomId) {
          const result = platformStore.startRoomGame(roomId, userId);
          if ('error' in result) {
            ws.send(
              JSON.stringify({
                type: 'GAME_START_REJECTED',
                payload: { roomId, error: result.error, code: result.code },
              })
            );
          } else {
            const { room, gameSession } = result;
            if (room.gameId === 'tic-tac-toe' && gameSession) {
              const playerX = gameSession.players.find((p) => p.symbol === 'X') || gameSession.players[0];
              const playerO = gameSession.players.find((p) => p.symbol === 'O') || gameSession.players[1];
              roomManager.createPartyGame(gameSession.gameSessionId, playerX, playerO);
            }

            this.broadcastToRoom(roomId, {
              type: 'PARTY_ROOM_GAME_LAUNCH',
              payload: {
                roomId,
                gameId: room.gameId,
                gameSessionId: gameSession.gameSessionId,
                source: 'party-room',
                players: gameSession.players,
                route: `/tic-tac-toe?source=party-room&partyRoomId=${roomId}&gameSessionId=${gameSession.gameSessionId}`,
              },
            });
          }
        }
        break;
      }

      default:
        ws.send(
          JSON.stringify({
            type: 'ERROR',
            payload: { code: 'UNKNOWN_EVENT', message: `Unknown event type: ${message.type}` },
          })
        );
        break;
    }
  }

  public broadcastAll(message: any) {
    const raw = JSON.stringify(message);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  }

  public broadcastToRoom(roomId: string, message: any) {
    const raw = JSON.stringify(message);
    const sockets = this.roomSockets.get(roomId);
    if (sockets) {
      for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(raw);
        }
      }
    }
  }

  public sendToUser(userId: string, message: any) {
    const ws = this.userSockets.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public getWss(): WebSocketServer {
    return this.wss;
  }
}
