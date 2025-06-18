// Smart Editing Service - AI-powered video editing automation
// Built using AugmentCode tool - www.augmentcode.com

import { MediaClip, VideoClip, AudioClip, TranscriptionSegment, SilenceSegment } from '../types/videoEditorTypes';
import { TranscriptionService, TranscriptionResult } from './TranscriptionService';
import { AIAudioProcessor } from './AIAudioProcessor';

export interface SmartCutOptions {
  removeSilence: boolean;
  silenceThreshold: number; // dB
  minSilenceDuration: number; // seconds
  keepPadding: number; // seconds to keep before/after speech
  speedUpSilence: boolean;
  silenceSpeedMultiplier: number; // 2x, 4x, etc.
}

export interface JumpCutOptions {
  enabled: boolean;
  minGapDuration: number; // seconds
  transitionDuration: number; // seconds
  preserveNaturalPauses: boolean;
}

export interface SmartEditResult {
  id: string;
  originalClips: MediaClip[];
  editedClips: MediaClip[];
  removedSegments: Array<{
    startTime: number;
    endTime: number;
    reason: 'silence' | 'filler-words' | 'long-pause' | 'noise';
  }>;
  speedAdjustments: Array<{
    startTime: number;
    endTime: number;
    speedMultiplier: number;
    reason: string;
  }>;
  timeSaved: number; // seconds
  summary: {
    originalDuration: number;
    finalDuration: number;
    silenceRemoved: number;
    fillerWordsRemoved: number;
    speedAdjustments: number;
  };
}

export class SmartEditingService {
  private transcriptionService: TranscriptionService;
  private audioProcessor: AIAudioProcessor;

  constructor() {
    this.transcriptionService = new TranscriptionService();
    this.audioProcessor = new AIAudioProcessor();
  }

  /**
   * Perform smart cutting on video clips
   */
  async performSmartCut(
    clips: MediaClip[],
    options: SmartCutOptions,
    onProgress?: (progress: number, status: string) => void
  ): Promise<SmartEditResult> {
    onProgress?.(0, 'Starting smart cut analysis...');

    const result: SmartEditResult = {
      id: crypto.randomUUID(),
      originalClips: [...clips],
      editedClips: [],
      removedSegments: [],
      speedAdjustments: [],
      timeSaved: 0,
      summary: {
        originalDuration: 0,
        finalDuration: 0,
        silenceRemoved: 0,
        fillerWordsRemoved: 0,
        speedAdjustments: 0
      }
    };

    try {
      // Process each clip
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        onProgress?.((i / clips.length) * 100, `Processing clip ${i + 1}/${clips.length}`);

        if (clip.type === 'video' || clip.type === 'audio') {
          const processedClip = await this.processClipForSmartCut(clip, options, result);
          result.editedClips.push(processedClip);
        } else {
          result.editedClips.push(clip);
        }
      }

      // Calculate summary
      result.summary.originalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
      result.summary.finalDuration = result.editedClips.reduce((sum, clip) => sum + clip.duration, 0);
      result.timeSaved = result.summary.originalDuration - result.summary.finalDuration;

      onProgress?.(100, 'Smart cut complete');
      return result;
    } catch (error) {
      console.error('Smart cut error:', error);
      throw new Error(`Smart cut failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auto-remove silence from clips
   */
  async autoRemoveSilence(
    clips: MediaClip[],
    options: {
      threshold?: number;
      minDuration?: number;
      keepPadding?: number;
    } = {},
    onProgress?: (progress: number) => void
  ): Promise<MediaClip[]> {
    const {
      threshold = -40,
      minDuration = 0.5,
      keepPadding = 0.1
    } = options;

    const processedClips: MediaClip[] = [];

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      onProgress?.((i / clips.length) * 100);

      if (clip.type === 'audio' || (clip.type === 'video' && (clip as VideoClip).hasAudio)) {
        // Detect silence segments
        const audioBuffer = await this.extractAudioFromClip(clip);
        const silenceSegments = await this.audioProcessor.detectSilence(audioBuffer, {
          threshold,
          minDuration,
          sensitivity: 70
        });

        // Create new clips excluding silence
        const newClips = this.createClipsWithoutSilence(clip, silenceSegments, keepPadding);
        processedClips.push(...newClips);
      } else {
        processedClips.push(clip);
      }
    }

    return processedClips;
  }

  /**
   * Generate jump cuts based on transcription
   */
  async generateJumpCuts(
    clips: MediaClip[],
    transcription: TranscriptionResult,
    options: JumpCutOptions,
    onProgress?: (progress: number) => void
  ): Promise<MediaClip[]> {
    const processedClips: MediaClip[] = [];

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      onProgress?.((i / clips.length) * 100);

      // Find transcription segments that overlap with this clip
      const relevantSegments = transcription.segments.filter(segment =>
        segment.startTime < clip.endTime && segment.endTime > clip.startTime
      );

      if (relevantSegments.length > 0) {
        const jumpCutClips = this.createJumpCutClips(clip, relevantSegments, options);
        processedClips.push(...jumpCutClips);
      } else {
        processedClips.push(clip);
      }
    }

    return processedClips;
  }

  /**
   * Detect and remove filler words
   */
  async removeFillerWords(
    clips: MediaClip[],
    transcription: TranscriptionResult,
    fillerWords: string[] = ['um', 'uh', 'like', 'you know', 'so', 'actually'],
    onProgress?: (progress: number) => void
  ): Promise<{ clips: MediaClip[]; removedCount: number }> {
    let removedCount = 0;
    const processedClips: MediaClip[] = [];

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      onProgress?.((i / clips.length) * 100);

      // Find filler words in transcription for this clip
      const fillerWordSegments = this.findFillerWords(clip, transcription, fillerWords);
      
      if (fillerWordSegments.length > 0) {
        const cleanedClips = this.removeSegmentsFromClip(clip, fillerWordSegments);
        processedClips.push(...cleanedClips);
        removedCount += fillerWordSegments.length;
      } else {
        processedClips.push(clip);
      }
    }

    return { clips: processedClips, removedCount };
  }

  /**
   * Apply speed ramping to improve pacing
   */
  async applySpeedRamping(
    clips: MediaClip[],
    transcription: TranscriptionResult,
    options: {
      slowSpeechMultiplier?: number;
      fastSpeechMultiplier?: number;
      silenceMultiplier?: number;
    } = {}
  ): Promise<MediaClip[]> {
    const {
      slowSpeechMultiplier = 1.2,
      fastSpeechMultiplier = 0.9,
      silenceMultiplier = 3.0
    } = options;

    return clips.map(clip => {
      if (clip.type !== 'video' && clip.type !== 'audio') return clip;

      // Analyze speech rate in transcription
      const speechRate = this.analyzeSpeechRate(clip, transcription);
      
      let speedMultiplier = 1.0;
      if (speechRate < 2.0) { // Slow speech (words per second)
        speedMultiplier = slowSpeechMultiplier;
      } else if (speechRate > 4.0) { // Fast speech
        speedMultiplier = fastSpeechMultiplier;
      }

      // Apply speed adjustment
      return {
        ...clip,
        duration: clip.duration / speedMultiplier,
        endTime: clip.startTime + (clip.duration / speedMultiplier),
        effects: [
          ...clip.effects,
          {
            id: crypto.randomUUID(),
            type: 'speed',
            name: 'Speed Adjustment',
            enabled: true,
            properties: { multiplier: speedMultiplier }
          }
        ]
      };
    });
  }

  /**
   * Process individual clip for smart cutting
   */
  private async processClipForSmartCut(
    clip: MediaClip,
    options: SmartCutOptions,
    result: SmartEditResult
  ): Promise<MediaClip> {
    // Extract audio for analysis
    const audioBuffer = await this.extractAudioFromClip(clip);
    
    // Detect silence
    const silenceSegments = await this.audioProcessor.detectSilence(audioBuffer, {
      threshold: options.silenceThreshold,
      minDuration: options.minSilenceDuration,
      sensitivity: 70
    });

    // Process based on options
    if (options.removeSilence) {
      // Remove silence segments
      silenceSegments.forEach(segment => {
        result.removedSegments.push({
          startTime: segment.startTime,
          endTime: segment.endTime,
          reason: 'silence'
        });
      });
      
      return this.createClipWithoutSilence(clip, silenceSegments, options.keepPadding);
    } else if (options.speedUpSilence) {
      // Speed up silence segments
      silenceSegments.forEach(segment => {
        result.speedAdjustments.push({
          startTime: segment.startTime,
          endTime: segment.endTime,
          speedMultiplier: options.silenceSpeedMultiplier,
          reason: 'silence-speedup'
        });
      });
      
      return this.createClipWithSpeedAdjustments(clip, silenceSegments, options.silenceSpeedMultiplier);
    }

    return clip;
  }

  /**
   * Extract audio buffer from clip
   */
  private async extractAudioFromClip(clip: MediaClip): Promise<ArrayBuffer> {
    // In a real implementation, this would extract audio from the actual file
    // For now, return a mock buffer
    return new ArrayBuffer(1024);
  }

  /**
   * Create clips without silence segments
   */
  private createClipsWithoutSilence(
    clip: MediaClip,
    silenceSegments: SilenceSegment[],
    keepPadding: number
  ): MediaClip[] {
    if (silenceSegments.length === 0) return [clip];

    const newClips: MediaClip[] = [];
    let currentTime = clip.startTime;

    for (const silence of silenceSegments) {
      // Add clip before silence (if there's content)
      if (silence.startTime > currentTime + keepPadding) {
        const beforeClip = {
          ...clip,
          id: crypto.randomUUID(),
          startTime: currentTime,
          endTime: silence.startTime - keepPadding,
          duration: (silence.startTime - keepPadding) - currentTime
        };
        newClips.push(beforeClip);
      }

      currentTime = silence.endTime + keepPadding;
    }

    // Add remaining clip after last silence
    if (currentTime < clip.endTime) {
      const afterClip = {
        ...clip,
        id: crypto.randomUUID(),
        startTime: currentTime,
        endTime: clip.endTime,
        duration: clip.endTime - currentTime
      };
      newClips.push(afterClip);
    }

    return newClips;
  }

  /**
   * Create clip without silence (single clip version)
   */
  private createClipWithoutSilence(
    clip: MediaClip,
    silenceSegments: SilenceSegment[],
    keepPadding: number
  ): MediaClip {
    const clips = this.createClipsWithoutSilence(clip, silenceSegments, keepPadding);
    
    if (clips.length === 0) return clip;
    if (clips.length === 1) return clips[0];

    // Merge multiple clips into one with cuts
    const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);
    return {
      ...clip,
      duration: totalDuration,
      endTime: clip.startTime + totalDuration,
      effects: [
        ...clip.effects,
        {
          id: crypto.randomUUID(),
          type: 'smart-cut',
          name: 'Smart Cut',
          enabled: true,
          properties: { segments: clips.map(c => ({ start: c.startTime, end: c.endTime })) }
        }
      ]
    };
  }

  /**
   * Create clip with speed adjustments
   */
  private createClipWithSpeedAdjustments(
    clip: MediaClip,
    silenceSegments: SilenceSegment[],
    speedMultiplier: number
  ): MediaClip {
    return {
      ...clip,
      effects: [
        ...clip.effects,
        {
          id: crypto.randomUUID(),
          type: 'variable-speed',
          name: 'Variable Speed',
          enabled: true,
          properties: {
            segments: silenceSegments.map(segment => ({
              start: segment.startTime,
              end: segment.endTime,
              speed: speedMultiplier
            }))
          }
        }
      ]
    };
  }

  /**
   * Create jump cut clips
   */
  private createJumpCutClips(
    clip: MediaClip,
    segments: TranscriptionSegment[],
    options: JumpCutOptions
  ): MediaClip[] {
    const newClips: MediaClip[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (segment.type === 'speech') {
        const segmentClip = {
          ...clip,
          id: crypto.randomUUID(),
          startTime: Math.max(clip.startTime, segment.startTime),
          endTime: Math.min(clip.endTime, segment.endTime),
          duration: Math.min(clip.endTime, segment.endTime) - Math.max(clip.startTime, segment.startTime)
        };
        
        if (segmentClip.duration > 0) {
          newClips.push(segmentClip);
        }
      }
    }
    
    return newClips.length > 0 ? newClips : [clip];
  }

  /**
   * Find filler words in transcription
   */
  private findFillerWords(
    clip: MediaClip,
    transcription: TranscriptionResult,
    fillerWords: string[]
  ): Array<{ startTime: number; endTime: number }> {
    const fillerSegments: Array<{ startTime: number; endTime: number }> = [];
    
    for (const segment of transcription.segments) {
      if (segment.startTime >= clip.startTime && segment.endTime <= clip.endTime) {
        for (const word of segment.words) {
          if (fillerWords.includes(word.word.toLowerCase())) {
            fillerSegments.push({
              startTime: word.startTime,
              endTime: word.endTime
            });
          }
        }
      }
    }
    
    return fillerSegments;
  }

  /**
   * Remove segments from clip
   */
  private removeSegmentsFromClip(
    clip: MediaClip,
    segments: Array<{ startTime: number; endTime: number }>
  ): MediaClip[] {
    if (segments.length === 0) return [clip];
    
    const newClips: MediaClip[] = [];
    let currentTime = clip.startTime;
    
    for (const segment of segments) {
      // Add clip before removed segment
      if (segment.startTime > currentTime) {
        newClips.push({
          ...clip,
          id: crypto.randomUUID(),
          startTime: currentTime,
          endTime: segment.startTime,
          duration: segment.startTime - currentTime
        });
      }
      
      currentTime = segment.endTime;
    }
    
    // Add remaining clip
    if (currentTime < clip.endTime) {
      newClips.push({
        ...clip,
        id: crypto.randomUUID(),
        startTime: currentTime,
        endTime: clip.endTime,
        duration: clip.endTime - currentTime
      });
    }
    
    return newClips;
  }

  /**
   * Analyze speech rate in transcription
   */
  private analyzeSpeechRate(clip: MediaClip, transcription: TranscriptionResult): number {
    const relevantSegments = transcription.segments.filter(segment =>
      segment.startTime < clip.endTime && segment.endTime > clip.startTime && segment.type === 'speech'
    );
    
    if (relevantSegments.length === 0) return 3.0; // Default speech rate
    
    const totalWords = relevantSegments.reduce((sum, segment) => sum + segment.words.length, 0);
    const totalDuration = relevantSegments.reduce((sum, segment) => sum + (segment.endTime - segment.startTime), 0);
    
    return totalWords / totalDuration; // Words per second
  }

  /**
   * Get default smart cut options
   */
  getDefaultSmartCutOptions(): SmartCutOptions {
    return {
      removeSilence: true,
      silenceThreshold: -40,
      minSilenceDuration: 0.5,
      keepPadding: 0.1,
      speedUpSilence: false,
      silenceSpeedMultiplier: 3.0
    };
  }

  /**
   * Get default jump cut options
   */
  getDefaultJumpCutOptions(): JumpCutOptions {
    return {
      enabled: true,
      minGapDuration: 0.3,
      transitionDuration: 0.1,
      preserveNaturalPauses: true
    };
  }
}
