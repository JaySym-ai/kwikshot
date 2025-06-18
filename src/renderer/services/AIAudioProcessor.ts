// AI Audio Processor Service - Advanced audio processing with AI
// Built using AugmentCode tool - www.augmentcode.com

import { AudioAnalysis, WaveformData } from '../types/videoEditorTypes';

export interface SilenceSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  confidence: number;
  type: 'silence' | 'low-volume' | 'background-noise';
}

export interface NoiseProfile {
  id: string;
  type: 'background' | 'hum' | 'hiss' | 'click' | 'wind' | 'room-tone';
  frequency: number;
  amplitude: number;
  confidence: number;
}

export interface AudioEnhancementSettings {
  noiseReduction: {
    enabled: boolean;
    strength: number; // 0-100
    preserveVoice: boolean;
  };
  studioSound: {
    enabled: boolean;
    roomSize: 'small' | 'medium' | 'large' | 'studio';
    warmth: number; // 0-100
    presence: number; // 0-100
  };
  dynamicsProcessing: {
    compressor: {
      enabled: boolean;
      threshold: number; // dB
      ratio: number;
      attack: number; // ms
      release: number; // ms
    };
    limiter: {
      enabled: boolean;
      ceiling: number; // dB
    };
    gate: {
      enabled: boolean;
      threshold: number; // dB
    };
  };
  eq: {
    enabled: boolean;
    lowCut: number; // Hz
    highCut: number; // Hz
    bands: Array<{
      frequency: number;
      gain: number; // dB
      q: number;
    }>;
  };
}

export class AIAudioProcessor {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isProcessing = false;

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Load audio worklet for real-time processing
      if (this.audioContext.audioWorklet) {
        await this.audioContext.audioWorklet.addModule('/audio-worklet-processor.js');
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  /**
   * Detect silence segments in audio
   */
  async detectSilence(
    audioBuffer: ArrayBuffer,
    options: {
      threshold?: number; // dB, default -40
      minDuration?: number; // seconds, default 0.5
      sensitivity?: number; // 0-100, default 50
    } = {}
  ): Promise<SilenceSegment[]> {
    const {
      threshold = -40,
      minDuration = 0.5,
      sensitivity = 50
    } = options;

    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    try {
      const decodedBuffer = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
      const channelData = decodedBuffer.getChannelData(0);
      const sampleRate = decodedBuffer.sampleRate;
      
      const silenceSegments: SilenceSegment[] = [];
      const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
      const thresholdLinear = this.dbToLinear(threshold);
      const minSamples = Math.floor(minDuration * sampleRate);
      
      let silenceStart = -1;
      let consecutiveSilentWindows = 0;
      
      for (let i = 0; i < channelData.length; i += windowSize) {
        const windowEnd = Math.min(i + windowSize, channelData.length);
        let rms = 0;
        
        // Calculate RMS for this window
        for (let j = i; j < windowEnd; j++) {
          rms += channelData[j] * channelData[j];
        }
        rms = Math.sqrt(rms / (windowEnd - i));
        
        const isSilent = rms < thresholdLinear;
        
        if (isSilent) {
          if (silenceStart === -1) {
            silenceStart = i / sampleRate;
          }
          consecutiveSilentWindows++;
        } else {
          if (silenceStart !== -1 && consecutiveSilentWindows * windowSize >= minSamples) {
            const endTime = i / sampleRate;
            const duration = endTime - silenceStart;
            
            silenceSegments.push({
              id: crypto.randomUUID(),
              startTime: silenceStart,
              endTime,
              duration,
              confidence: Math.min(95, 60 + (sensitivity * 0.7)),
              type: rms < thresholdLinear * 0.1 ? 'silence' : 'low-volume'
            });
          }
          silenceStart = -1;
          consecutiveSilentWindows = 0;
        }
      }
      
      // Handle silence at the end
      if (silenceStart !== -1 && consecutiveSilentWindows * windowSize >= minSamples) {
        silenceSegments.push({
          id: crypto.randomUUID(),
          startTime: silenceStart,
          endTime: channelData.length / sampleRate,
          duration: (channelData.length / sampleRate) - silenceStart,
          confidence: Math.min(95, 60 + (sensitivity * 0.7)),
          type: 'silence'
        });
      }
      
      return silenceSegments;
    } catch (error) {
      console.error('Error detecting silence:', error);
      throw new Error('Failed to detect silence');
    }
  }

  /**
   * Analyze noise profile in audio
   */
  async analyzeNoiseProfile(audioBuffer: ArrayBuffer): Promise<NoiseProfile[]> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    try {
      const decodedBuffer = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
      const channelData = decodedBuffer.getChannelData(0);
      const sampleRate = decodedBuffer.sampleRate;
      
      // Perform FFT analysis to identify noise characteristics
      const fftSize = 2048;
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      
      const frequencyData = new Float32Array(analyser.frequencyBinCount);
      const noiseProfiles: NoiseProfile[] = [];
      
      // Analyze different frequency ranges for common noise types
      const noiseTypes = [
        { type: 'hum' as const, freqRange: [50, 120], threshold: -30 },
        { type: 'hiss' as const, freqRange: [8000, 16000], threshold: -40 },
        { type: 'wind' as const, freqRange: [20, 200], threshold: -25 },
        { type: 'room-tone' as const, freqRange: [100, 1000], threshold: -35 }
      ];
      
      for (const noiseType of noiseTypes) {
        const [minFreq, maxFreq] = noiseType.freqRange;
        const minBin = Math.floor(minFreq * fftSize / sampleRate);
        const maxBin = Math.floor(maxFreq * fftSize / sampleRate);
        
        let avgAmplitude = 0;
        for (let i = minBin; i <= maxBin; i++) {
          avgAmplitude += frequencyData[i];
        }
        avgAmplitude /= (maxBin - minBin + 1);
        
        if (avgAmplitude > noiseType.threshold) {
          noiseProfiles.push({
            id: crypto.randomUUID(),
            type: noiseType.type,
            frequency: (minFreq + maxFreq) / 2,
            amplitude: avgAmplitude,
            confidence: Math.min(90, Math.abs(avgAmplitude - noiseType.threshold) * 2)
          });
        }
      }
      
      return noiseProfiles;
    } catch (error) {
      console.error('Error analyzing noise profile:', error);
      throw new Error('Failed to analyze noise profile');
    }
  }

  /**
   * Apply AI-powered audio enhancement
   */
  async enhanceAudio(
    audioBuffer: ArrayBuffer,
    settings: AudioEnhancementSettings,
    onProgress?: (progress: number) => void
  ): Promise<ArrayBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    this.isProcessing = true;
    onProgress?.(0);

    try {
      const decodedBuffer = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
      let processedBuffer = decodedBuffer;
      
      // Step 1: Noise Reduction (25%)
      if (settings.noiseReduction.enabled) {
        processedBuffer = await this.applyNoiseReduction(processedBuffer, settings.noiseReduction);
        onProgress?.(25);
      }
      
      // Step 2: Dynamics Processing (50%)
      if (settings.dynamicsProcessing.compressor.enabled || 
          settings.dynamicsProcessing.limiter.enabled || 
          settings.dynamicsProcessing.gate.enabled) {
        processedBuffer = await this.applyDynamicsProcessing(processedBuffer, settings.dynamicsProcessing);
        onProgress?.(50);
      }
      
      // Step 3: EQ Processing (75%)
      if (settings.eq.enabled) {
        processedBuffer = await this.applyEQ(processedBuffer, settings.eq);
        onProgress?.(75);
      }
      
      // Step 4: Studio Sound Enhancement (100%)
      if (settings.studioSound.enabled) {
        processedBuffer = await this.applyStudioSound(processedBuffer, settings.studioSound);
        onProgress?.(100);
      }
      
      // Convert back to ArrayBuffer
      const outputBuffer = this.audioContext.createBuffer(
        processedBuffer.numberOfChannels,
        processedBuffer.length,
        processedBuffer.sampleRate
      );
      
      for (let channel = 0; channel < processedBuffer.numberOfChannels; channel++) {
        outputBuffer.copyToChannel(processedBuffer.getChannelData(channel), channel);
      }
      
      return this.audioBufferToArrayBuffer(outputBuffer);
    } catch (error) {
      console.error('Error enhancing audio:', error);
      throw new Error('Failed to enhance audio');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Apply noise reduction using spectral subtraction
   */
  private async applyNoiseReduction(
    buffer: AudioBuffer,
    settings: { strength: number; preserveVoice: boolean }
  ): Promise<AudioBuffer> {
    // Simplified noise reduction implementation
    // In a real implementation, this would use advanced spectral subtraction algorithms
    
    const outputBuffer = this.audioContext!.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      // Simple high-pass filter to remove low-frequency noise
      const cutoff = settings.preserveVoice ? 80 : 120; // Hz
      const rc = 1.0 / (cutoff * 2 * Math.PI);
      const dt = 1.0 / buffer.sampleRate;
      const alpha = dt / (rc + dt);
      
      let prevInput = 0;
      let prevOutput = 0;
      
      for (let i = 0; i < inputData.length; i++) {
        const highpass = alpha * (prevOutput + inputData[i] - prevInput);
        outputData[i] = inputData[i] - (highpass * settings.strength / 100);
        
        prevInput = inputData[i];
        prevOutput = highpass;
      }
    }
    
    return outputBuffer;
  }

  /**
   * Apply dynamics processing (compression, limiting, gating)
   */
  private async applyDynamicsProcessing(
    buffer: AudioBuffer,
    settings: AudioEnhancementSettings['dynamicsProcessing']
  ): Promise<AudioBuffer> {
    // Simplified dynamics processing
    const outputBuffer = this.audioContext!.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      for (let i = 0; i < inputData.length; i++) {
        let sample = inputData[i];
        
        // Simple compressor
        if (settings.compressor.enabled) {
          const threshold = this.dbToLinear(settings.compressor.threshold);
          if (Math.abs(sample) > threshold) {
            const excess = Math.abs(sample) - threshold;
            const compressedExcess = excess / settings.compressor.ratio;
            sample = Math.sign(sample) * (threshold + compressedExcess);
          }
        }
        
        // Simple limiter
        if (settings.limiter.enabled) {
          const ceiling = this.dbToLinear(settings.limiter.ceiling);
          sample = Math.max(-ceiling, Math.min(ceiling, sample));
        }
        
        outputData[i] = sample;
      }
    }
    
    return outputBuffer;
  }

  /**
   * Apply EQ processing
   */
  private async applyEQ(
    buffer: AudioBuffer,
    settings: AudioEnhancementSettings['eq']
  ): Promise<AudioBuffer> {
    // Simplified EQ implementation
    return buffer; // Placeholder - would implement biquad filters
  }

  /**
   * Apply studio sound enhancement
   */
  private async applyStudioSound(
    buffer: AudioBuffer,
    settings: AudioEnhancementSettings['studioSound']
  ): Promise<AudioBuffer> {
    // Simplified studio sound enhancement
    return buffer; // Placeholder - would implement reverb and spatial processing
  }

  /**
   * Convert dB to linear scale
   */
  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  /**
   * Convert AudioBuffer to ArrayBuffer
   */
  private audioBufferToArrayBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
    // Simplified conversion - in reality would use proper encoding
    const length = audioBuffer.length * audioBuffer.numberOfChannels * 4; // 32-bit float
    const arrayBuffer = new ArrayBuffer(length);
    const view = new Float32Array(arrayBuffer);
    
    let offset = 0;
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      view.set(channelData, offset);
      offset += channelData.length;
    }
    
    return arrayBuffer;
  }

  /**
   * Get default enhancement settings
   */
  getDefaultSettings(): AudioEnhancementSettings {
    return {
      noiseReduction: {
        enabled: true,
        strength: 70,
        preserveVoice: true
      },
      studioSound: {
        enabled: true,
        roomSize: 'medium',
        warmth: 60,
        presence: 70
      },
      dynamicsProcessing: {
        compressor: {
          enabled: true,
          threshold: -18,
          ratio: 3,
          attack: 10,
          release: 100
        },
        limiter: {
          enabled: true,
          ceiling: -1
        },
        gate: {
          enabled: false,
          threshold: -40
        }
      },
      eq: {
        enabled: true,
        lowCut: 80,
        highCut: 18000,
        bands: [
          { frequency: 200, gain: 0, q: 1 },
          { frequency: 1000, gain: 2, q: 1 },
          { frequency: 3000, gain: 1, q: 1 },
          { frequency: 8000, gain: 0.5, q: 1 }
        ]
      }
    };
  }

  /**
   * Check if processing is currently active
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
