
// RecorderManager: 管理录音、暂停/恢复录音
export default class RecorderManager {
  // 音频上下文，用于处理音频流
  private context: AudioContext | null = null;
  // 音频处理器，用于处理音频数据
  private processor: ScriptProcessorNode | null = null;
  // 媒体流，用于获取音频输入
  private stream: MediaStream | null = null;
  // 录音是否暂停
  private paused = false;

  // 开始录音
  async start(callback: (pcm: Float32Array) => void) {
    if (!this.context) {
      // 创建音频上下文，设置采样率为16000
      this.context = new AudioContext({ sampleRate: 16000 });
      // 获取音频输入流
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 创建媒体流源，将音频流连接到音频上下文
      const source = this.context.createMediaStreamSource(this.stream);

      // 创建音频处理器，缓冲区大小为512，输入通道数为1，输出通道数为1
      this.processor = this.context.createScriptProcessor(512, 1, 1);
      // 音频处理器处理音频数据
      this.processor.onaudioprocess = (event) => {
        // 如果录音未暂停，则获取音频数据
        if (!this.paused) {
          const pcm = event.inputBuffer.getChannelData(0);
          // 调用回调函数，传递音频数据
          callback(pcm);
        }
      };

      // 将媒体流源连接到音频处理器
      source.connect(this.processor);
      // 将音频处理器连接到音频上下文的输出设备
      this.processor.connect(this.context.destination);
      // 控制台输出录音启动信息
      console.log('🎙️ 录音已启动');
    }
  }

  // 暂停录音
  pause() {
    this.paused = true;
    // 控制台输出录音暂停信息
    console.log('⏸️ 录音已暂停');
  }

  // 恢复录音
  resume() {
    this.paused = false;
    // 控制台输出录音恢复信息
    console.log('▶️ 录音已恢复');
  }

  // 停止录音
  stop() {
    this.processor?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.context?.close();
    this.context = null;
    this.processor = null;
    this.stream = null;
    // 控制台输出录音停止信息
    console.log('🛑 录音已停止');
  }
}
