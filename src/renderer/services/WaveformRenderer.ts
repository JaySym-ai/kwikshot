// Waveform Renderer Service - Audio analysis and waveform generation
// Built using AugmentCode tool - www.augmentcode.com

import { WaveformData, AudioAnalysis } from '../types/videoEditorTypes';

export class WaveformRenderer {
  private audioContext: AudioContext | null = null;
  private cache: Map<string, WaveformData> = new Map();

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  /**
   * Generate waveform data from audio file
   */
  async generateWaveform(
    audioBuffer: ArrayBuffer,
    options: {
      samples?: number;
      channels?: number;
      normalize?: boolean;
    } = {}
  ): Promise<WaveformData> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const {
      samples = 1000,
      channels = 2,
      normalize = true
    } = options;

    try {
      // Decode audio data
      const decodedBuffer = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
      
      // Extract channel data
      const channelData: Float32Array[] = [];
      const numChannels = Math.min(decodedBuffer.numberOfChannels, channels);
      
      for (let channel = 0; channel < numChannels; channel++) {
        channelData.push(decodedBuffer.getChannelData(channel));
      }

      // Generate peaks for each channel
      const peaks = this.extractPeaks(channelData, samples, normalize);

      const waveformData: WaveformData = {
        peaks,
        length: decodedBuffer.length,
        sampleRate: decodedBuffer.sampleRate,
        channels: numChannels
      };

      return waveformData;
    } catch (error) {
      console.error('Error generating waveform:', error);
      throw new Error('Failed to generate waveform data');
    }
  }

  /**
   * Generate waveform from audio file path
   */
  async generateWaveformFromFile(filePath: string, options?: {
    samples?: number;
    channels?: number;
    normalize?: boolean;
  }): Promise<WaveformData> {
    // Check cache first
    const cacheKey = `${filePath}_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Load audio file
      const response = await fetch(filePath);
      const arrayBuffer = await response.arrayBuffer();
      
      // Generate waveform
      const waveformData = await this.generateWaveform(arrayBuffer, options);
      
      // Cache result
      this.cache.set(cacheKey, waveformData);
      
      return waveformData;
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw new Error('Failed to load audio file');
    }
  }

  /**
   * Extract peak values from audio channel data
   */
  private extractPeaks(
    channelData: Float32Array[],
    samples: number,
    normalize: boolean = true
  ): Float32Array {
    const peaks = new Float32Array(samples);
    const sampleSize = Math.floor(channelData[0].length / samples);
    let maxPeak = 0;

    // Extract peaks
    for (let i = 0; i < samples; i++) {
      const start = i * sampleSize;
      const end = Math.min(start + sampleSize, channelData[0].length);
      
      let peak = 0;
      
      // Find maximum absolute value across all channels in this sample
      for (let channel = 0; channel < channelData.length; channel++) {
        for (let j = start; j < end; j++) {
          const value = Math.abs(channelData[channel][j]);
          peak = Math.max(peak, value);
        }
      }
      
      peaks[i] = peak;
      maxPeak = Math.max(maxPeak, peak);
    }

    // Normalize peaks if requested
    if (normalize && maxPeak > 0) {
      for (let i = 0; i < peaks.length; i++) {
        peaks[i] = peaks[i] / maxPeak;
      }
    }

    return peaks;
  }

  /**
   * Render waveform to canvas
   */
  renderToCanvas(
    canvas: HTMLCanvasElement,
    waveformData: WaveformData,
    options: {
      color?: string;
      backgroundColor?: string;
      lineWidth?: number;
      style?: 'bars' | 'line' | 'filled';
      channel?: number;
    } = {}
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const {
      color = '#10b981',
      backgroundColor = 'transparent',
      lineWidth = 1,
      style = 'bars',
      channel = 0
    } = options;

    const { width, height } = canvas;
    const peaks = waveformData.peaks;

    // Clear canvas
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    // Set drawing style
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    const barWidth = width / peaks.length;
    const centerY = height / 2;

    switch (style) {
      case 'bars':
        this.renderBars(ctx, peaks, width, height, barWidth, centerY);
        break;
      case 'line':
        this.renderLine(ctx, peaks, width, height, centerY);
        break;
      case 'filled':
        this.renderFilled(ctx, peaks, width, height, centerY);
        break;
    }
  }

  private renderBars(
    ctx: CanvasRenderingContext2D,
    peaks: Float32Array,
    width: number,
    height: number,
    barWidth: number,
    centerY: number
  ): void {
    for (let i = 0; i < peaks.length; i++) {
      const x = i * barWidth;
      const barHeight = peaks[i] * centerY;
      
      // Draw positive bar
      ctx.fillRect(x, centerY - barHeight, Math.max(1, barWidth - 0.5), barHeight);
      
      // Draw negative bar (mirror)
      ctx.fillRect(x, centerY, Math.max(1, barWidth - 0.5), barHeight);
    }
  }

  private renderLine(
    ctx: CanvasRenderingContext2D,
    peaks: Float32Array,
    width: number,
    height: number,
    centerY: number
  ): void {
    ctx.beginPath();
    
    for (let i = 0; i < peaks.length; i++) {
      const x = (i / peaks.length) * width;
      const y = centerY - (peaks[i] * centerY);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Draw mirror line
    ctx.beginPath();
    for (let i = 0; i < peaks.length; i++) {
      const x = (i / peaks.length) * width;
      const y = centerY + (peaks[i] * centerY);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }

  private renderFilled(
    ctx: CanvasRenderingContext2D,
    peaks: Float32Array,
    width: number,
    height: number,
    centerY: number
  ): void {
    // Draw positive area
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    for (let i = 0; i < peaks.length; i++) {
      const x = (i / peaks.length) * width;
      const y = centerY - (peaks[i] * centerY);
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(width, centerY);
    ctx.closePath();
    ctx.fill();
    
    // Draw negative area
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    for (let i = 0; i < peaks.length; i++) {
      const x = (i / peaks.length) * width;
      const y = centerY + (peaks[i] * centerY);
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(width, centerY);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Analyze audio for additional metadata
   */
  async analyzeAudio(audioBuffer: ArrayBuffer): Promise<AudioAnalysis> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    try {
      const decodedBuffer = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
      const channelData = decodedBuffer.getChannelData(0); // Use first channel
      
      // Calculate RMS (Root Mean Square) values
      const rms = this.calculateRMS(channelData);
      
      // Calculate spectral centroid (brightness)
      const spectralCentroid = this.calculateSpectralCentroid(channelData, decodedBuffer.sampleRate);
      
      // Calculate zero crossing rate
      const zeroCrossingRate = this.calculateZeroCrossingRate(channelData);
      
      // Generate peaks for visualization
      const peaks = this.extractPeaks([channelData], 1000, true);

      return {
        peaks: Array.from(peaks),
        rms,
        spectralCentroid,
        zeroCrossingRate
      };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      throw new Error('Failed to analyze audio');
    }
  }

  private calculateRMS(channelData: Float32Array, windowSize: number = 1024): number[] {
    const rms: number[] = [];
    
    for (let i = 0; i < channelData.length; i += windowSize) {
      let sum = 0;
      const end = Math.min(i + windowSize, channelData.length);
      
      for (let j = i; j < end; j++) {
        sum += channelData[j] * channelData[j];
      }
      
      rms.push(Math.sqrt(sum / (end - i)));
    }
    
    return rms;
  }

  private calculateSpectralCentroid(channelData: Float32Array, sampleRate: number): number[] {
    // Simplified spectral centroid calculation
    // In a real implementation, this would use FFT
    const windowSize = 1024;
    const spectralCentroid: number[] = [];
    
    for (let i = 0; i < channelData.length; i += windowSize) {
      // Placeholder calculation
      spectralCentroid.push(sampleRate / 4); // Simplified
    }
    
    return spectralCentroid;
  }

  private calculateZeroCrossingRate(channelData: Float32Array, windowSize: number = 1024): number[] {
    const zcr: number[] = [];
    
    for (let i = 0; i < channelData.length; i += windowSize) {
      let crossings = 0;
      const end = Math.min(i + windowSize, channelData.length);
      
      for (let j = i + 1; j < end; j++) {
        if ((channelData[j] >= 0) !== (channelData[j - 1] >= 0)) {
          crossings++;
        }
      }
      
      zcr.push(crossings / (end - i));
    }
    
    return zcr;
  }

  /**
   * Clear waveform cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clearCache();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
