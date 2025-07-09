// Node.js WebSocket 服务，用于接收前端录音数据
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });
console.log('🌐 WebSocket 服务已启动: ws://localhost:3000');

const startTime = Date.now();
let isFault = false;

wss.on('connection', (ws: import('ws').WebSocket, req) => {
  // 判断是否为重连（通过 url 参数）
  const isReconnect = req.url?.includes('reconnect=1');
  console.log(`✅ 客户端已连接${isReconnect ? '（心跳重连）' : ''}`);

  ws.on('message', (message: import('ws').RawData) => {
    const now = Date.now();
    const msgStr = message.toString();
    try {
      const data = JSON.parse(msgStr);
      if (data.simulateFault) {
        isFault = true;
        console.log('【心跳】⚠️ 收到模拟故障指令，进入故障模式，不再回复 pong');
        ws.send(JSON.stringify({ ack: true, fault: true }));
        return;
      }
      if (data.recoverFault) {
        isFault = false;
        console.log('【心跳】✅ 收到恢复正常指令，恢复正常模式，开始回复 pong');
        ws.send(JSON.stringify({ ack: true, fault: false }));
        return;
      }
      if (data.ping) {
        console.log('【心跳】收到 ping', data.ping);
        if (isFault) {
          console.log('【心跳】⏳ 故障模式中，pong 不回复');
          // 故障模式下不回复 pong
        } else {
          ws.send(JSON.stringify({ pong: { id: data.ping.id, ts: Date.now() } }));
        }
      } else {
        ws.send(JSON.stringify({ ack: true, ts: Date.now() }));
      }
    } catch {
      ws.send(JSON.stringify({ ack: true, ts: Date.now() }));
    }
  });

  ws.on('close', () => {
    console.log('❌ 客户端已断开连接');
  });
});
