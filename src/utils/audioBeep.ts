// Web Audio API Sound Generator for POS Barcode Scanner

class AudioBeepService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Play standard scanner beep sound
   * @param type 'success' | 'error' | 'test'
   */
  public playBeep(type: 'success' | 'error' | 'test' = 'success') {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      if (type === 'success' || type === 'test') {
        // High sharp beep like supermarket POS registers (1760 Hz - A6 tone for 80ms)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'error') {
        // Low double buzz tone for item not found or out of stock (350 Hz for 150ms)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';

        osc1.frequency.setValueAtTime(300, now);
        osc2.frequency.setValueAtTime(250, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.08);

        osc2.start(now + 0.08);
        osc2.stop(now + 0.2);
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }
}

export const audioBeep = new AudioBeepService();
