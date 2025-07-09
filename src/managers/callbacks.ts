
// 定义 WebSocket 和 AudioManager 的回调类型
export type WebSocketCallbacks = {
  onWebSocketOpen?: () => void;
  onWebSocketMessage?: (data: any) => void;
  onWebSocketClose?: () => void;
  onWebSocketError?: (err: Event) => void;
  onWebSocketStatusChange?: (status: string) => void;
  onReconnect?: (attempt: number) => void;
  onReconnectSuccess?: () => void;
};
