
// WebSocketManager: 管理 WebSocket 连接、心跳检测、重连机制
import { WebSocketCallbacks } from './callbacks';

export default class WebSocketManager {
  private socket: WebSocket | null = null;
  private url: string;
  private callbacks: WebSocketCallbacks;
  private heartbeatInterval = 5000; // 5秒
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private reconnectDelays = [3000, 5000, 8000];
  private messageQueue: string[] = [];
  private idx = 0;
  private manuallyClosed = false;
  private paused = false;

  constructor(url: string, callbacks: WebSocketCallbacks = {}) {
    this.url = url;
    this.callbacks = callbacks;
  }

  connect() {
    this.manuallyClosed = false;
    let url = this.url;
    if (this.reconnectAttempts > 0) {
      url += (url.includes('?') ? '&' : '?') + 'reconnect=1';
    }
    this.socket = new WebSocket(url);
    this.callbacks.onWebSocketStatusChange?.('connecting');

    this.socket.onopen = () => {
      console.log('✅ WebSocket 已连接');
      if (this.reconnectAttempts > 0) {
        console.log('【心跳】🔔 重连成功，继续心跳');
        this.reconnectAttempts = 0;
        this.callbacks.onReconnectSuccess?.();
      }
      this.callbacks.onWebSocketStatusChange?.('open');
      this.callbacks.onWebSocketOpen?.();
      this.reconnectAttempts = 0;
      this.send(JSON.stringify({ data: { status: 0 } }));
      this.flushQueue();
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      if (this.paused) {
        console.log('⏸️ WebSocket 接收已暂停');
        return;
      }
      const data = JSON.parse(event.data);
      if (data.pong && data.pong.id) {
        console.log(`【心跳】❤️ 收到心跳 pong: ${data.pong.id}`);
        clearTimeout(this.pongTimeoutTimer!);
      } else {
        this.callbacks.onWebSocketMessage?.(data);
      }
    };

    this.socket.onerror = (err) => {
      console.error('💥 WebSocket 错误:', err);
      this.callbacks.onWebSocketError?.(err);
    };

    this.socket.onclose = () => {
      console.warn('⚠️ WebSocket 已关闭');
      this.callbacks.onWebSocketStatusChange?.('closed');
      this.callbacks.onWebSocketClose?.();
      this.stopHeartbeat();
      if (!this.manuallyClosed) {
        console.log('准备自动重连...');
        this.tryReconnect();
      }
    };
  }

  send(data: string) {
    if (this.paused) {
      console.log('⏸️ WebSocket 发送已暂停');
      return;
    }
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.warn('🚨 WebSocket 未连接，缓存数据');
      this.messageQueue.push(data);
    }
  }

  close() {
    this.manuallyClosed = true;
    this.socket?.close();
    this.stopHeartbeat();
  }

  pause() {
    console.log('⏸️ WebSocket 暂停');
    this.paused = true;
  }

  resume() {
    console.log('▶️ WebSocket 恢复');
    this.paused = false;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.paused) return;
      this.idx++;
      const ping = JSON.stringify({ ping: { id: this.idx, ts: Date.now() } });
      console.log('【心跳】➡️ 发送心跳 ping');
      this.send(ping);
      this.pongTimeoutTimer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          (window as any).lastCloseReason = 'heartbeat';
        }
        console.error('【心跳】⏱️ 心跳超时，关闭连接');
        this.socket?.close();
      }, this.heartbeatInterval - 2000);
    }, this.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.pongTimeoutTimer) clearTimeout(this.pongTimeoutTimer);
    this.heartbeatTimer = null;
    this.pongTimeoutTimer = null;
  }

  private tryReconnect() {
    if (this.reconnectAttempts < this.reconnectDelays.length) {
      this.reconnectAttempts++;
      this.callbacks.onReconnect?.(this.reconnectAttempts);
      console.log(`【心跳】正在重连（第 ${this.reconnectAttempts} 次）`);
      const delay = this.reconnectDelays[this.reconnectAttempts - 1];
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ 达到最大重连次数，显示手动重连按钮');
    }
  }

  private flushQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) this.send(msg);
    }
  }
}
