
// WebSocketManager: 管理 WebSocket 连接、心跳检测、重连机制
import { WebSocketCallbacks } from './callbacks';

/**
 * WebSocketManager
 * 用于管理 WebSocket 连接、心跳检测、自动/手动重连等功能
 */
export default class WebSocketManager {
  /** WebSocket 实例 */
  private socket: WebSocket | null = null;
  /** WebSocket 服务器地址 */
  private url: string;
  /** 回调函数集合 */
  private callbacks: WebSocketCallbacks;
  /** 心跳间隔（毫秒） */
  private heartbeatInterval = 5000; // 5秒
  /** 心跳定时器 */
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  /** pong 超时定时器 */
  private pongTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  /** 当前重连次数 */
  private reconnectAttempts = 0;
  /** 每次重连的延迟（毫秒） */
  private reconnectDelays = [3000, 5000, 8000];
  /** 发送消息队列（断线期间缓存） */
  private messageQueue: string[] = [];
  /** 心跳 ping 的自增 id */
  private idx = 0;
  /** 是否为手动关闭连接 */
  private manuallyClosed = false;
  /** 是否暂停消息收发 */
  private paused = false;

  /**
   * 构造函数
   * @param url WebSocket 服务器地址
   * @param callbacks 回调函数集合
   */
  constructor(url: string, callbacks: WebSocketCallbacks = {}) {
    this.url = url;
    this.callbacks = callbacks;
  }

  /**
   * 建立 WebSocket 连接
   */
  connect() {
    this.manuallyClosed = false;
    let url = this.url;
    if (this.reconnectAttempts > 0) {
      url += (url.includes('?') ? '&' : '?') + 'reconnect=1';
    }
    this.socket = new WebSocket(url);
    this.callbacks.onWebSocketStatusChange?.('connecting');

    // 连接成功回调
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

    // 收到消息回调
    this.socket.onmessage = (event) => {
      if (this.paused) {
        console.log('⏸️ WebSocket 接收已暂停');
        return;
      }
      const data = JSON.parse(event.data);
      // 处理心跳 pong
      if (data.pong && data.pong.id) {
        console.log(`【心跳】❤️ 收到心跳 pong: ${data.pong.id}`);
        clearTimeout(this.pongTimeoutTimer!);
      } else {
        this.callbacks.onWebSocketMessage?.(data);
      }
    };

    // 连接错误回调
    this.socket.onerror = (err) => {
      console.error('💥 WebSocket 错误:', err);
      this.callbacks.onWebSocketError?.(err);
    };

    // 连接关闭回调
    this.socket.onclose = () => {
      console.warn('⚠️ WebSocket 已关闭');
      this.callbacks.onWebSocketStatusChange?.('closed');
      this.callbacks.onWebSocketClose?.();
      this.stopHeartbeat();
      // 非手动关闭时自动重连
      if (!this.manuallyClosed) {
        console.log('准备自动重连...');
        this.tryReconnect();
      }
    };
  }

  /**
   * 发送消息
   * @param data 要发送的数据（字符串）
   */
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

  /**
   * 主动关闭 WebSocket 连接
   */
  close() {
    this.manuallyClosed = true;
    this.socket?.close();
    this.stopHeartbeat();
  }

  /**
   * 暂停消息收发
   */
  pause() {
    console.log('⏸️ WebSocket 暂停');
    this.paused = true;
  }

  /**
   * 恢复消息收发
   */
  resume() {
    console.log('▶️ WebSocket 恢复');
    this.paused = false;
  }

  /**
   * 判断当前 WebSocket 是否已连接
   * @returns 是否已连接
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * 启动心跳检测，定时发送 ping 并检测 pong 超时
   * @private
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.paused) return;
      this.idx++;
      const ping = JSON.stringify({ ping: { id: this.idx, ts: Date.now() } });
      console.log('【心跳】➡️ 发送心跳 ping');
      this.send(ping);
      this.pongTimeoutTimer = setTimeout(() => {
        console.error('【心跳】⏱️ 心跳超时，关闭连接');
        this.socket?.close();
      }, this.heartbeatInterval - 2000);
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳检测
   * @private
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.pongTimeoutTimer) clearTimeout(this.pongTimeoutTimer);
    this.heartbeatTimer = null;
    this.pongTimeoutTimer = null;
  }

  /**
   * 自动重连逻辑，最多尝试指定次数
   * @private
   */
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

  /**
   * 发送缓存队列中的所有消息
   * @private
   */
  private flushQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) this.send(msg);
    }
  }
}
