
// AudioManager: 集成录音和 WebSocket，暴露统一接口
import WebSocketManager from './websocket';
import RecorderManager from './recorder';
import { WebSocketCallbacks } from './callbacks';

export default class AudioManager {
  /** WebSocket 管理器实例 */
  private wsManager: WebSocketManager;
  /** 录音管理器实例 */
  private recorder: RecorderManager;
  /** 音频包自增序号 */
  private idx = 0;

  /**
   * 构造函数，初始化 AudioManager
   * @param wsUrl WebSocket 服务器地址
   * @param callbacks 回调函数集合
   */
  constructor(wsUrl: string, callbacks: WebSocketCallbacks = {}) {
    this.wsManager = new WebSocketManager(wsUrl, callbacks);
    this.recorder = new RecorderManager();
  }

  /**
   * 初始化 WebSocket 连接
   */
  init() {
    this.wsManager.connect();
  }

  /**
   * 开始录音并推送音频数据
   */
  async startRecording() {
    if (!this.wsManager.isConnected()) {
      console.log('⌛ 等待 WebSocket 连接...');
      await this.waitForWebSocket();
    }
    await this.recorder.start((pcm) => this.handleAudioProcess(pcm));
  }

  /** 暂停录音和 WebSocket 发送 */
  pauseRecording() {
    this.recorder.pause();
    this.wsManager.pause();
  }

  /** 恢复录音和 WebSocket 发送 */
  resumeRecording() {
    this.recorder.resume();
    this.wsManager.resume();
  }

  /** 停止录音和关闭 WebSocket 连接 */
  stopRecording() {
    this.recorder.stop();
    this.wsManager.close(); // 手动 stop 不触发重连
  }

  /**
   * 处理录音 PCM 数据，编码并通过 WebSocket 发送
   * @param pcm PCM 音频数据
   */
  private handleAudioProcess(pcm: Float32Array) {
    const buffer = new Uint8Array(pcm.buffer);
    const base64 = btoa(String.fromCharCode(...buffer));
    this.wsManager.send(JSON.stringify({
      data: {
        idx: this.idx++,
        status: 1,
        audio: base64
      }
    }));
  }

  /**
   * 等待 WebSocket 连接建立
   */
  private waitForWebSocket(): Promise<void> {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (this.wsManager.isConnected()) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * 安全发送数据到 WebSocket
   * @param data 字符串数据
   */
  public safeSend(data: string) {
    this.wsManager.send(data);
  }
}
