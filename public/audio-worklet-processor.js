// Audio Worklet Processor for real-time audio processing
// Built using AugmentCode tool - www.augmentcode.com

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 1024;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // Noise reduction parameters
    this.noiseThreshold = 0.01;
    this.noiseReductionStrength = 0.7;
    
    // Simple high-pass filter for noise reduction
    this.prevInput = 0;
    this.prevOutput = 0;
    this.cutoffFreq = 80; // Hz
    
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'setNoiseThreshold':
          this.noiseThreshold = data;
          break;
        case 'setNoiseReductionStrength':
          this.noiseReductionStrength = data;
          break;
        case 'setCutoffFreq':
          this.cutoffFreq = data;
          break;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (input.length > 0 && output.length > 0) {
      const inputChannel = input[0];
      const outputChannel = output[0];
      
      for (let i = 0; i < inputChannel.length; i++) {
        // Apply noise reduction
        let sample = inputChannel[i];
        
        // Simple noise gate
        if (Math.abs(sample) < this.noiseThreshold) {
          sample *= (1 - this.noiseReductionStrength);
        }
        
        // High-pass filter to remove low-frequency noise
        const rc = 1.0 / (this.cutoffFreq * 2 * Math.PI);
        const dt = 1.0 / sampleRate;
        const alpha = dt / (rc + dt);
        
        const highpass = alpha * (this.prevOutput + sample - this.prevInput);
        sample = sample - (highpass * this.noiseReductionStrength);
        
        this.prevInput = inputChannel[i];
        this.prevOutput = highpass;
        
        outputChannel[i] = sample;
        
        // Store in buffer for analysis
        this.buffer[this.bufferIndex] = sample;
        this.bufferIndex = (this.bufferIndex + 1) % this.bufferSize;
        
        // Send analysis data periodically
        if (this.bufferIndex === 0) {
          this.analyzeBuffer();
        }
      }
    }
    
    return true;
  }
  
  analyzeBuffer() {
    // Calculate RMS
    let rms = 0;
    for (let i = 0; i < this.bufferSize; i++) {
      rms += this.buffer[i] * this.buffer[i];
    }
    rms = Math.sqrt(rms / this.bufferSize);
    
    // Calculate peak
    let peak = 0;
    for (let i = 0; i < this.bufferSize; i++) {
      peak = Math.max(peak, Math.abs(this.buffer[i]));
    }
    
    // Send analysis data to main thread
    this.port.postMessage({
      type: 'analysis',
      data: {
        rms,
        peak,
        timestamp: currentTime
      }
    });
  }
}

registerProcessor('audio-processor', AudioProcessor);
