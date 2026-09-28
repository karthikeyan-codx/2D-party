import { ClientMessage, ConnectionStatus, ServerMessage } from '../../types/protocol.js';
import { WS_URL } from '../../config/network.js';

type MessageHandler = (msg: ServerMessage) => void;
type StatusHandler = (status: ConnectionStatus) => void;

export class RealtimeWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private status: ConnectionStatus = 'disconnected';
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private shouldReconnect: boolean = true;
  private pendingQueue: ClientMessage[] = [];

  constructor(customUrl?: string) {
    this.url = customUrl || WS_URL;
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.shouldReconnect = true;
    this.setStatus(this.status === 'disconnected' ? 'connecting' : 'reconnecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.startHeartbeat();
        this.flushQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as ServerMessage;
          this.notifyMessage(parsed);
        } catch {
          // ignore malformed frame
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.setStatus('disconnected');
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // onerror is followed by onclose
      };
    } catch {
      this.setStatus('disconnected');
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  public send(message: ClientMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      this.pendingQueue.push(message);
      if (this.status === 'disconnected') {
        this.connect();
      }
      return false;
    }
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.status);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(status: ConnectionStatus) {
    if (this.status !== status) {
      this.status = status;
      for (const handler of this.statusHandlers) {
        handler(status);
      }
    }
  }

  private notifyMessage(msg: ServerMessage) {
    for (const handler of this.messageHandlers) {
      handler(msg);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.setStatus('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'PING', payload: { timestamp: Date.now() } });
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private flushQueue() {
    while (this.pendingQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const msg = this.pendingQueue.shift();
      if (msg) {
        this.ws.send(JSON.stringify(msg));
      }
    }
  }
}

export const realtimeWs = new RealtimeWebSocketClient();
