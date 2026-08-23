import { WebSocketEvent, EventType } from '../types/events';

export type ConnectionState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed' | 'failed';

export type EventHandler = (event: WebSocketEvent) => void;
export type StateHandler = (state: ConnectionState) => void;

export class ReconnectingSocket {
  private url: string;
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'idle';
  private reconnectAttempts = 0;
  private maxBackoffMs = 10000;
  private heartbeatIntervalMs = 20000;
  private pingTimer: number | null = null;
  private pongTimeoutTimer: number | null = null;
  private reconnectTimer: number | null = null;

  // Bounded buffer dropping oldest events at 500
  private buffer: WebSocketEvent[] = [];
  private maxBufferSize = 500;

  // Event handlers subscription map
  private eventListeners: Map<EventType | '*', Set<EventHandler>> = new Map();
  private stateListeners: Set<StateHandler> = new Set();

  constructor(url: string = 'ws://localhost:8000/ws/live') {
    this.url = url;
  }

  public connect(): void {
    if (this.state === 'open' || this.state === 'connecting') return;
    this.setState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState('open');
        this.startHeartbeat();
        this.flushBuffer();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data) as WebSocketEvent;
          if (parsed.type === ('PONG' as unknown)) {
            this.handlePong();
            return;
          }
          this.handleInboundEvent(parsed);
        } catch (e) {
          console.warn('Failed to parse WebSocket message', e);
        }
      };

      this.ws.onerror = () => {
        // Socket errors trigger close automatically in browsers
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (this.state !== 'closed') {
          this.scheduleReconnect();
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.setState('closed');
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public send(data: unknown): void {
    if (this.ws && this.state === 'open') {
      this.ws.send(JSON.stringify(data));
    }
  }

  public on(type: EventType | '*', handler: EventHandler): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(handler);

    return () => {
      const set = this.eventListeners.get(type);
      if (set) {
        set.delete(handler);
      }
    };
  }

  public onStateChange(handler: StateHandler): () => void {
    this.stateListeners.add(handler);
    handler(this.state);
    return () => {
      this.stateListeners.delete(handler);
    };
  }

  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Internal mechanism to simulate/inject events directly (used by mockServer & unit tests)
   */
  public emitMockEvent(event: WebSocketEvent): void {
    this.handleInboundEvent(event);
  }

  private handleInboundEvent(event: WebSocketEvent): void {
    // Add to bounded ring buffer, dropping oldest if overflow
    if (this.buffer.length >= this.maxBufferSize) {
      this.buffer.shift();
    }
    this.buffer.push(event);

    // Notify specific type listeners
    const specificHandlers = this.eventListeners.get(event.type);
    if (specificHandlers) {
      specificHandlers.forEach((fn) => fn(event));
    }

    // Notify wildcard listeners
    const wildcardHandlers = this.eventListeners.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((fn) => fn(event));
    }
  }

  private flushBuffer(): void {
    // Retain buffer for history if needed
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= 8) {
      this.setState('failed');
      return;
    }

    this.setState('reconnecting');
    this.reconnectAttempts++;

    // Exponential backoff with random jitter: min(10s, 1000 * 2^attempts + jitter)
    const base = Math.min(this.maxBackoffMs, 1000 * Math.pow(2, this.reconnectAttempts));
    const jitter = Math.floor(Math.random() * 500);
    const delay = base + jitter;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingTimer = window.setInterval(() => {
      if (this.ws && this.state === 'open') {
        this.ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
        
        this.pongTimeoutTimer = window.setTimeout(() => {
          console.warn('Missed pong heartbeat timeout from backend websocket');
          this.ws?.close();
        }, 5000);
      }
    }, this.heartbeatIntervalMs);
  }

  private handlePong(): void {
    if (this.pongTimeoutTimer) {
      clearTimeout(this.pongTimeoutTimer);
      this.pongTimeoutTimer = null;
    }
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pongTimeoutTimer) {
      clearTimeout(this.pongTimeoutTimer);
      this.pongTimeoutTimer = null;
    }
  }

  private setState(newState: ConnectionState): void {
    this.state = newState;
    this.stateListeners.forEach((fn) => fn(newState));
  }
}

// Global socket singleton instance for backend/mock connections
export const globalSocket = new ReconnectingSocket();
