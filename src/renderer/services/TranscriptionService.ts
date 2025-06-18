// Transcription Service - Automatic video transcription to text
// Built using AugmentCode tool - www.augmentcode.com

export interface TranscriptionWord {
  id: string;
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
  speaker?: string;
}

export interface TranscriptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  words: TranscriptionWord[];
  speaker?: string;
  confidence: number;
  type: 'speech' | 'silence' | 'music' | 'noise';
}

export interface TranscriptionResult {
  id: string;
  segments: TranscriptionSegment[];
  language: string;
  confidence: number;
  duration: number;
  wordCount: number;
  speakers: string[];
  metadata: {
    model: string;
    processingTime: number;
    audioQuality: 'low' | 'medium' | 'high';
  };
}

export interface TranscriptionOptions {
  language?: string; // 'auto' | 'en' | 'es' | 'fr' | etc.
  model?: 'whisper-tiny' | 'whisper-base' | 'whisper-small' | 'whisper-medium' | 'whisper-large';
  enableSpeakerDiarization?: boolean;
  enablePunctuation?: boolean;
  enableTimestamps?: boolean;
  customVocabulary?: string[];
  filterProfanity?: boolean;
}

export class TranscriptionService {
  private isProcessing = false;
  private abortController: AbortController | null = null;

  /**
   * Transcribe audio from video file
   */
  async transcribeVideo(
    videoFile: File | ArrayBuffer,
    options: TranscriptionOptions = {},
    onProgress?: (progress: number, status: string) => void
  ): Promise<TranscriptionResult> {
    this.isProcessing = true;
    this.abortController = new AbortController();
    
    const startTime = Date.now();
    
    try {
      onProgress?.(0, 'Extracting audio from video...');
      
      // Step 1: Extract audio from video
      const audioBuffer = await this.extractAudioFromVideo(videoFile);
      onProgress?.(20, 'Audio extracted successfully');
      
      // Step 2: Prepare audio for transcription
      const processedAudio = await this.preprocessAudio(audioBuffer);
      onProgress?.(30, 'Audio preprocessing complete');
      
      // Step 3: Perform transcription
      const transcriptionResult = await this.performTranscription(processedAudio, options, (progress) => {
        onProgress?.(30 + (progress * 0.6), 'Transcribing audio...');
      });
      onProgress?.(90, 'Processing transcription results...');
      
      // Step 4: Post-process results
      const finalResult = await this.postProcessTranscription(transcriptionResult, options);
      onProgress?.(100, 'Transcription complete');
      
      const processingTime = Date.now() - startTime;
      finalResult.metadata.processingTime = processingTime;
      
      return finalResult;
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }

  /**
   * Extract audio from video file
   */
  private async extractAudioFromVideo(videoFile: File | ArrayBuffer): Promise<ArrayBuffer> {
    // Create audio context for processing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    try {
      let audioBuffer: ArrayBuffer;
      
      if (videoFile instanceof File) {
        // For File objects, we need to extract audio using Web APIs
        audioBuffer = await this.extractAudioFromVideoFile(videoFile);
      } else {
        // For ArrayBuffer, assume it's already audio data
        audioBuffer = videoFile;
      }
      
      return audioBuffer;
    } finally {
      await audioContext.close();
    }
  }

  /**
   * Extract audio from video file using Web APIs
   */
  private async extractAudioFromVideoFile(videoFile: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      video.onloadedmetadata = async () => {
        try {
          // Create media element source
          const source = audioContext.createMediaElementSource(video);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);
          
          // Record audio stream
          const mediaRecorder = new MediaRecorder(destination.stream, {
            mimeType: 'audio/webm;codecs=opus'
          });
          
          const chunks: Blob[] = [];
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };
          
          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            resolve(arrayBuffer);
          };
          
          mediaRecorder.start();
          video.play();
          
          video.onended = () => {
            mediaRecorder.stop();
          };
          
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = () => reject(new Error('Failed to load video file'));
      video.src = URL.createObjectURL(videoFile);
    });
  }

  /**
   * Preprocess audio for better transcription accuracy
   */
  private async preprocessAudio(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    try {
      const decodedBuffer = await audioContext.decodeAudioData(audioBuffer.slice(0));
      
      // Convert to mono if stereo
      let processedBuffer = decodedBuffer;
      if (decodedBuffer.numberOfChannels > 1) {
        processedBuffer = this.convertToMono(decodedBuffer, audioContext);
      }
      
      // Resample to 16kHz for optimal transcription
      if (decodedBuffer.sampleRate !== 16000) {
        processedBuffer = await this.resampleAudio(processedBuffer, 16000, audioContext);
      }
      
      // Apply noise reduction
      processedBuffer = this.applyBasicNoiseReduction(processedBuffer, audioContext);
      
      // Convert back to ArrayBuffer
      return this.audioBufferToArrayBuffer(processedBuffer);
    } finally {
      await audioContext.close();
    }
  }

  /**
   * Perform the actual transcription using Web Speech API or external service
   */
  private async performTranscription(
    audioBuffer: ArrayBuffer,
    options: TranscriptionOptions,
    onProgress?: (progress: number) => void
  ): Promise<TranscriptionResult> {
    const {
      language = 'auto',
      model = 'whisper-base',
      enableSpeakerDiarization = false,
      enablePunctuation = true,
      enableTimestamps = true
    } = options;

    // For demo purposes, we'll simulate transcription
    // In a real implementation, this would call OpenAI Whisper API or similar
    return this.simulateTranscription(audioBuffer, options, onProgress);
  }

  /**
   * Simulate transcription for demo purposes
   */
  private async simulateTranscription(
    audioBuffer: ArrayBuffer,
    options: TranscriptionOptions,
    onProgress?: (progress: number) => void
  ): Promise<TranscriptionResult> {
    const duration = audioBuffer.byteLength / (16000 * 2); // Approximate duration
    
    // Simulate processing time
    for (let i = 0; i <= 100; i += 10) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Transcription cancelled');
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      onProgress?.(i);
    }
    
    // Generate sample transcription
    const sampleSegments: TranscriptionSegment[] = [
      {
        id: '1',
        text: 'Welcome to this video tutorial.',
        startTime: 0,
        endTime: 2.5,
        confidence: 0.95,
        type: 'speech',
        words: [
          { id: '1-1', word: 'Welcome', startTime: 0, endTime: 0.5, confidence: 0.98 },
          { id: '1-2', word: 'to', startTime: 0.5, endTime: 0.7, confidence: 0.99 },
          { id: '1-3', word: 'this', startTime: 0.7, endTime: 1.0, confidence: 0.97 },
          { id: '1-4', word: 'video', startTime: 1.0, endTime: 1.5, confidence: 0.96 },
          { id: '1-5', word: 'tutorial', startTime: 1.5, endTime: 2.5, confidence: 0.94 }
        ]
      },
      {
        id: '2',
        text: '',
        startTime: 2.5,
        endTime: 4.0,
        confidence: 0.99,
        type: 'silence',
        words: []
      },
      {
        id: '3',
        text: 'Today we will learn about video editing.',
        startTime: 4.0,
        endTime: 7.2,
        confidence: 0.92,
        type: 'speech',
        words: [
          { id: '3-1', word: 'Today', startTime: 4.0, endTime: 4.4, confidence: 0.95 },
          { id: '3-2', word: 'we', startTime: 4.4, endTime: 4.6, confidence: 0.98 },
          { id: '3-3', word: 'will', startTime: 4.6, endTime: 4.9, confidence: 0.97 },
          { id: '3-4', word: 'learn', startTime: 4.9, endTime: 5.3, confidence: 0.93 },
          { id: '3-5', word: 'about', startTime: 5.3, endTime: 5.7, confidence: 0.96 },
          { id: '3-6', word: 'video', startTime: 5.7, endTime: 6.2, confidence: 0.94 },
          { id: '3-7', word: 'editing', startTime: 6.2, endTime: 7.2, confidence: 0.89 }
        ]
      }
    ];
    
    return {
      id: crypto.randomUUID(),
      segments: sampleSegments,
      language: 'en',
      confidence: 0.94,
      duration,
      wordCount: sampleSegments.reduce((count, segment) => count + segment.words.length, 0),
      speakers: ['Speaker 1'],
      metadata: {
        model: options.model || 'whisper-base',
        processingTime: 0, // Will be set by caller
        audioQuality: 'medium'
      }
    };
  }

  /**
   * Post-process transcription results
   */
  private async postProcessTranscription(
    result: TranscriptionResult,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    let processedResult = { ...result };
    
    // Apply custom vocabulary corrections
    if (options.customVocabulary && options.customVocabulary.length > 0) {
      processedResult = this.applyCustomVocabulary(processedResult, options.customVocabulary);
    }
    
    // Filter profanity if enabled
    if (options.filterProfanity) {
      processedResult = this.filterProfanity(processedResult);
    }
    
    // Enhance punctuation
    if (options.enablePunctuation) {
      processedResult = this.enhancePunctuation(processedResult);
    }
    
    return processedResult;
  }

  /**
   * Convert stereo to mono
   */
  private convertToMono(buffer: AudioBuffer, audioContext: AudioContext): AudioBuffer {
    const monoBuffer = audioContext.createBuffer(1, buffer.length, buffer.sampleRate);
    const monoData = monoBuffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      let sum = 0;
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        sum += buffer.getChannelData(channel)[i];
      }
      monoData[i] = sum / buffer.numberOfChannels;
    }
    
    return monoBuffer;
  }

  /**
   * Resample audio to target sample rate
   */
  private async resampleAudio(
    buffer: AudioBuffer,
    targetSampleRate: number,
    audioContext: AudioContext
  ): Promise<AudioBuffer> {
    // Simplified resampling - in reality would use proper resampling algorithms
    const ratio = targetSampleRate / buffer.sampleRate;
    const newLength = Math.floor(buffer.length * ratio);
    
    const resampledBuffer = audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      targetSampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel);
      const outputData = resampledBuffer.getChannelData(channel);
      
      for (let i = 0; i < newLength; i++) {
        const sourceIndex = i / ratio;
        const index = Math.floor(sourceIndex);
        const fraction = sourceIndex - index;
        
        if (index + 1 < inputData.length) {
          outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
        } else {
          outputData[i] = inputData[index] || 0;
        }
      }
    }
    
    return resampledBuffer;
  }

  /**
   * Apply basic noise reduction
   */
  private applyBasicNoiseReduction(buffer: AudioBuffer, audioContext: AudioContext): AudioBuffer {
    // Simplified noise reduction
    return buffer;
  }

  /**
   * Convert AudioBuffer to ArrayBuffer
   */
  private audioBufferToArrayBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
    const length = audioBuffer.length * audioBuffer.numberOfChannels * 2; // 16-bit
    const arrayBuffer = new ArrayBuffer(length);
    const view = new Int16Array(arrayBuffer);
    
    let offset = 0;
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        view[offset++] = Math.max(-32768, Math.min(32767, channelData[i] * 32768));
      }
    }
    
    return arrayBuffer;
  }

  /**
   * Apply custom vocabulary corrections
   */
  private applyCustomVocabulary(result: TranscriptionResult, vocabulary: string[]): TranscriptionResult {
    // Implementation would correct words based on custom vocabulary
    return result;
  }

  /**
   * Filter profanity from transcription
   */
  private filterProfanity(result: TranscriptionResult): TranscriptionResult {
    // Implementation would filter or replace profane words
    return result;
  }

  /**
   * Enhance punctuation in transcription
   */
  private enhancePunctuation(result: TranscriptionResult): TranscriptionResult {
    // Implementation would add proper punctuation based on speech patterns
    return result;
  }

  /**
   * Cancel ongoing transcription
   */
  cancelTranscription(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Check if transcription is in progress
   */
  isTranscribing(): boolean {
    return this.isProcessing;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'auto', name: 'Auto-detect' },
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' }
    ];
  }

  /**
   * Get available transcription models
   */
  getAvailableModels(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'whisper-tiny', name: 'Tiny', description: 'Fastest, lower accuracy' },
      { id: 'whisper-base', name: 'Base', description: 'Balanced speed and accuracy' },
      { id: 'whisper-small', name: 'Small', description: 'Good accuracy, moderate speed' },
      { id: 'whisper-medium', name: 'Medium', description: 'High accuracy, slower' },
      { id: 'whisper-large', name: 'Large', description: 'Highest accuracy, slowest' }
    ];
  }
}
