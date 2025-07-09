
// 定义 WebSocket 和 AudioManager 的回调类型
export type WebSocketCallbacks = {
  /**
   * WebSocket 连接成功时触发
   */
  onWebSocketOpen?: () => void;
  /**
   * 收到 WebSocket 消息时触发
   * @param data 服务器推送的数据
   */
  onWebSocketMessage?: (data: any) => void;
  /**
   * WebSocket 连接关闭时触发
   */
  onWebSocketClose?: () => void;
  /**
   * WebSocket 发生错误时触发
   * @param err 错误事件对象
   */
  onWebSocketError?: (err: Event) => void;
  /**
   * WebSocket 状态变化时触发
   * @param status 当前状态字符串（如 connecting/open/closed）
   */
  onWebSocketStatusChange?: (status: string) => void;
  /**
   * WebSocket 自动重连时触发
   * @param attempt 当前重连的尝试次数
   */
  onReconnect?: (attempt: number) => void;
  /**
   * WebSocket 重连成功时触发
   */
  onReconnectSuccess?: () => void;
};
