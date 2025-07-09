
// RecorderManager: 管理录音、暂停/恢复录音
export default class RecorderManager {
  private context: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private paused = false;

  async start(callback: (pcm: Float32Array) => void) {
    if (!this.context) {
      this.context = new AudioContext({ sampleRate: 16000 });
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.context.createMediaStreamSource(this.stream);

      this.processor = this.context.createScriptProcessor(512, 1, 1);
      this.processor.onaudioprocess = (event) => {
        if (!this.paused) {
          const pcm = event.inputBuffer.getChannelData(0);
          callback(pcm);
        }
      };

      source.connect(this.processor);
      this.processor.connect(this.context.destination);
      console.log('🎙️ 录音已启动');
    }
  }

  pause() {
    this.paused = true;
    console.log('⏸️ 录音已暂停');
  }

  resume() {
    this.paused = false;
    console.log('▶️ 录音已恢复');
  }

  stop() {
    this.processor?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.context?.close();
    this.context = null;
    this.processor = null;
    this.stream = null;
    console.log('🛑 录音已停止');
  }
}
