import { useState, useEffect } from 'react';

export interface StreamingMetrics {
  uptime: number;
  viewerCount: number;
  bitrate: number;
  fps: number;
  droppedFrames: number;
  cpuUsage: number;
  gpuUsage: number;
  connectionQuality: string;
}

export interface NetworkStats {
  uploadSpeed: number;
  latency: number;
  packetLoss: number;
  connectionQuality: string;
}

export interface StreamingState {
  isStreaming: boolean;
  isPaused: boolean;
  isConnecting: boolean;
  isConfigured: boolean;
  platform: any;
  metrics: StreamingMetrics;
  networkStats: NetworkStats;
}

export const useStreamingManager = () => {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    isPaused: false,
    isConnecting: false,
    isConfigured: false,
    platform: null,
    metrics: {
      uptime: 0,
      viewerCount: 0,
      bitrate: 0,
      fps: 0,
      droppedFrames: 0,
      cpuUsage: 45,
      gpuUsage: 32,
      connectionQuality: 'excellent'
    },
    networkStats: {
      uploadSpeed: 12.5,
      latency: 25,
      packetLoss: 0.1,
      connectionQuality: 'excellent'
    }
  });

  const [scenes, setScenes] = useState([]);
  const [audioSources, setAudioSources] = useState([]);
  const [overlays, setOverlays] = useState([]);
  const [isFirstTime, setIsFirstTime] = useState(true);

  useEffect(() => {
    // Check if user has completed setup before
    const hasCompletedSetup = localStorage.getItem('streaming-setup-completed');
    if (!hasCompletedSetup) {
      setIsFirstTime(true);
    } else {
      setIsFirstTime(false);
    }

    // Simulate metrics updates
    const interval = setInterval(() => {
      if (streamingState.isStreaming) {
        setStreamingState(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            uptime: prev.metrics.uptime + 1,
            viewerCount: Math.max(0, prev.metrics.viewerCount + Math.floor(Math.random() * 3) - 1),
            bitrate: 4500 + Math.floor(Math.random() * 1000),
            fps: 30 + Math.floor(Math.random() * 5),
            cpuUsage: Math.max(20, Math.min(80, prev.metrics.cpuUsage + Math.floor(Math.random() * 10) - 5)),
            gpuUsage: Math.max(10, Math.min(70, prev.metrics.gpuUsage + Math.floor(Math.random() * 8) - 4))
          }
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [streamingState.isStreaming]);

  const handleSetupComplete = (config: any) => {
    console.log('Setup completed with config:', config);
    localStorage.setItem('streaming-setup-completed', 'true');
    setStreamingState(prev => ({ ...prev, isConfigured: true, platform: config.platform }));
    setIsFirstTime(false);
  };

  const handleStartStream = () => {
    if (!streamingState.isConfigured) {
      return false; // Indicate setup is needed
    }
    
    setStreamingState(prev => ({ ...prev, isConnecting: true }));
    
    // Simulate connection process
    setTimeout(() => {
      setStreamingState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        isStreaming: true,
        metrics: { ...prev.metrics, uptime: 0, viewerCount: 1 }
      }));
    }, 2000);

    return true;
  };

  const handleStopStream = () => {
    setStreamingState(prev => ({ 
      ...prev, 
      isStreaming: false, 
      isPaused: false,
      metrics: { ...prev.metrics, uptime: 0, viewerCount: 0 }
    }));
  };

  const handlePauseStream = () => {
    setStreamingState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  return {
    streamingState,
    scenes,
    setScenes,
    audioSources,
    setAudioSources,
    overlays,
    setOverlays,
    isFirstTime,
    handleSetupComplete,
    handleStartStream,
    handleStopStream,
    handlePauseStream
  };
};
