<template>
  <div style="text-align: center; margin-top: 50px;">
    <div style="margin-bottom: 20px;">
      <button v-if="showReconnectBtn" @click="manualReconnect">请手动重连</button>
      <!-- <button @click="simulateFault">模拟故障</button>
      <button @click="recoverFault">恢复正常</button> -->
    </div>
    <h1>🎙️ Cus Audio Upload Demo</h1>
    <div>
      <button @click="start()">开始录音</button>
      <button @click="pause()">暂停录音</button>
      <button @click="resume()">恢复录音</button>
      <button @click="stop()">结束录音</button>
      <p>状态: {{ wsStatus }}</p>
      <p v-if="reconnectAttempt > 0">🔄 正在重连（第 {{ reconnectAttempt }} 次）</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AudioManager from '../src/managers/audioManager';

const wsStatus = ref('未连接');
const reconnectAttempt = ref(0);
const showReconnectBtn = ref(false);
const wsUrl = '/ws'; // 使用 Vite Proxy
let audioManager: AudioManager | null = null;
let controlWs: WebSocket | null = null;
let lastCloseReason = '';
// 删除 heartbeatReconnectAttempt

function setupAudioManager() {
  if (!audioManager) {
    audioManager = new AudioManager(wsUrl, {
      onWebSocketOpen: () => {
        console.log('【心跳】WebSocket 已连接');
        wsStatus.value = 'WebSocket 已连接';
        reconnectAttempt.value = 0;
        showReconnectBtn.value = false;
      },
      onWebSocketMessage: (data) => {
        // console.log('【心跳】收到了后端返回的信息')
        console.log('收到消息:', data)
      },
      onWebSocketClose: () => {
        console.log('WebSocket 已关闭')
        wsStatus.value = 'WebSocket 已关闭';
      },
      onWebSocketError: (err) => {
        console.log('【心跳】WebSocket 错误进入此处')
        console.error('【心跳】WebSocket 错误:', err)
        console.log('【心跳】重连次数', reconnectAttempt.value)
        if (reconnectAttempt.value >= 3) {
          console.log('【心跳】重连次数达到3次，显示重连按钮')
          showReconnectBtn.value = true;
        }
      },
      onWebSocketStatusChange: (s) => {
        console.log('【心跳】WebSocket 状态变化进入此处')
        wsStatus.value = s;
        console.log('【心跳】WebSocket 状态变化', s)
        if (s === 'closed' && reconnectAttempt.value >= 3) {
          showReconnectBtn.value = true;
        }
      },
      onReconnect: (attempt) => {
        console.log('【心跳】重连进入此处')
        console.log('【心跳】重连次数', attempt)
        reconnectAttempt.value = attempt;
        if (attempt >= 3) {
          showReconnectBtn.value = true;
        }
        console.log(`【心跳】正在重连（第${attempt}次）`);
      },
      onReconnectSuccess: () => {
        console.log('【心跳】重连成功进入此处')
        wsStatus.value = '重连成功，继续心跳';
        showReconnectBtn.value = false;
        console.log('【心跳】🔔 重连成功，继续心跳');
      },
    });
  }
}

// 控制通道，专门用于发送模拟故障/恢复正常指令
function sendControlMsg(msg: object) {
  if (!controlWs || controlWs.readyState !== 1) {
    controlWs = new WebSocket(wsUrl + '?control=1');
    controlWs.onopen = () => controlWs!.send(JSON.stringify(msg));
  } else {
    controlWs.send(JSON.stringify(msg));
  }
}

function simulateFault() {
  console.log('心跳已发送模拟故障指令');
  sendControlMsg({ simulateFault: true });
}
function recoverFault() {
  console.log('心跳已发送恢复正常指令');
  sendControlMsg({ recoverFault: true });
}

const start = (manual = false) => {
  setupAudioManager();
  if (audioManager) {
    // 重置重连原因
    lastCloseReason = '';
    audioManager.init();
    audioManager.startRecording();
    if (manual) {
      audioManager.safeSend(JSON.stringify({ data: { manualReconnect: true } }));
    }
  }
};

const pause = () => {
  audioManager?.pauseRecording();
  wsStatus.value = '已暂停';
};

const resume = () => {
  audioManager?.resumeRecording();
  wsStatus.value = '已恢复';
};

const stop = () => {
  audioManager?.stopRecording();
  wsStatus.value = '已停止';
};

function manualReconnect() {
  showReconnectBtn.value = false;
  start(true);
}

onMounted(() => {
  setupAudioManager();
});
</script>
