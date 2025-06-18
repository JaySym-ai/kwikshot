// Video Preview Player - Player with playback controls and scrubbing
// Built using AugmentCode tool - www.augmentcode.com

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { PlaybackControls } from './PlaybackControls';
import { Video, AlertCircle, Loader } from 'lucide-react';

interface VideoPreviewProps {
  className?: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });

  const {
    currentProject,
    playback,
    previewQuality,
    seek,
    play,
    pause,
    setPlaybackRate
  } = useVideoEditorStore();

  // Calculate preview dimensions based on project settings
  const getPreviewDimensions = useCallback(() => {
    if (!currentProject) return { width: 1920, height: 1080 };
    
    const { width, height } = currentProject.settings;
    const aspectRatio = width / height;
    
    // Scale based on preview quality
    let maxWidth = 1920;
    switch (previewQuality) {
      case 'low':
        maxWidth = 640;
        break;
      case 'medium':
        maxWidth = 1280;
        break;
      case 'high':
        maxWidth = 1920;
        break;
    }
    
    const previewWidth = Math.min(width, maxWidth);
    const previewHeight = previewWidth / aspectRatio;
    
    return { width: previewWidth, height: previewHeight };
  }, [currentProject, previewQuality]);

  // Update canvas size when project or quality changes
  useEffect(() => {
    const dimensions = getPreviewDimensions();
    setCanvasSize(dimensions);
    
    if (canvasRef.current) {
      canvasRef.current.width = dimensions.width;
      canvasRef.current.height = dimensions.height;
    }
  }, [getPreviewDimensions]);

  // Render current frame
  const renderFrame = useCallback(async (time: number) => {
    if (!canvasRef.current || !currentProject) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Clear canvas
      ctx.fillStyle = currentProject.settings.backgroundColor || '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Get all visible clips at current time
      const visibleClips = currentProject.tracks
        .filter(track => track.visible && track.type === 'video')
        .flatMap(track => track.clips)
        .filter(clip => time >= clip.startTime && time <= clip.endTime)
        .sort((a, b) => a.startTime - b.startTime); // Render in order
      
      // Render each clip
      for (const clip of visibleClips) {
        await renderClip(ctx, clip, time, canvas.width, canvas.height);
      }
      
      // Render overlays, effects, etc.
      renderOverlays(ctx, time, canvas.width, canvas.height);
      
    } catch (err) {
      console.error('Error rendering frame:', err);
      setError('Failed to render frame');
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  // Render individual clip
  const renderClip = async (
    ctx: CanvasRenderingContext2D,
    clip: any,
    time: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Calculate clip time offset
    const clipTime = time - clip.startTime + clip.trimStart;
    
    // Apply clip transform
    ctx.save();
    
    const transform = clip.transform || {
      x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1
    };
    
    // Apply transformations
    ctx.globalAlpha = transform.opacity;
    ctx.translate(canvasWidth / 2 + transform.x, canvasHeight / 2 + transform.y);
    ctx.rotate(transform.rotation * Math.PI / 180);
    ctx.scale(transform.scaleX, transform.scaleY);
    
    // For now, render a placeholder rectangle
    // In a real implementation, this would load and render the actual video frame
    const clipWidth = (clip.width / currentProject!.settings.width) * canvasWidth;
    const clipHeight = (clip.height / currentProject!.settings.height) * canvasHeight;
    
    // Render clip placeholder
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-clipWidth / 2, -clipHeight / 2, clipWidth, clipHeight);
    
    // Render clip name
    ctx.fillStyle = 'white';
    ctx.font = '16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(clip.name, 0, 0);
    
    // Render time indicator
    ctx.font = '12px monospace';
    ctx.fillText(formatTime(clipTime), 0, 20);
    
    ctx.restore();
  };

  // Render overlays (timecode, safe areas, etc.)
  const renderOverlays = (
    ctx: CanvasRenderingContext2D,
    time: number,
    width: number,
    height: number
  ) => {
    // Render timecode overlay
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 120, 30);
    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(formatTime(time), 15, 30);
    ctx.restore();
    
    // Render safe area guides (optional)
    if (previewQuality === 'high') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      // Title safe area (90%)
      const titleSafeWidth = width * 0.9;
      const titleSafeHeight = height * 0.9;
      const titleSafeX = (width - titleSafeWidth) / 2;
      const titleSafeY = (height - titleSafeHeight) / 2;
      
      ctx.strokeRect(titleSafeX, titleSafeY, titleSafeWidth, titleSafeHeight);
      
      // Action safe area (80%)
      const actionSafeWidth = width * 0.8;
      const actionSafeHeight = height * 0.8;
      const actionSafeX = (width - actionSafeWidth) / 2;
      const actionSafeY = (height - actionSafeHeight) / 2;
      
      ctx.strokeRect(actionSafeX, actionSafeY, actionSafeWidth, actionSafeHeight);
      
      ctx.restore();
    }
  };

  // Handle playback updates
  useEffect(() => {
    if (playback.isPlaying) {
      const interval = setInterval(() => {
        renderFrame(playback.currentTime);
      }, 1000 / 30); // 30fps preview
      
      return () => clearInterval(interval);
    } else {
      renderFrame(playback.currentTime);
    }
  }, [playback.isPlaying, playback.currentTime, renderFrame]);

  // Handle canvas click for seeking
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!currentProject) return;
    
    // For now, just toggle play/pause
    if (playback.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [currentProject, playback.isPlaying, play, pause]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  if (!currentProject) {
    return (
      <div className={`video-preview-empty ${className}`}>
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <Video size={64} className="mb-4" />
          <h3 className="text-lg font-medium mb-2">No Project Loaded</h3>
          <p className="text-sm text-center max-w-md">
            Create a new project or load an existing one to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`video-preview flex flex-col h-full ${className}`}>
      {/* Preview Area */}
      <div className="flex-1 bg-black flex items-center justify-center p-4 relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-white">
              <Loader size={20} className="animate-spin" />
              <span>Rendering...</span>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Canvas */}
        <motion.canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain cursor-pointer rounded-lg shadow-2xl"
          onClick={handleCanvasClick}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />

        {/* Preview Quality Indicator */}
        <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {previewQuality.toUpperCase()} • {canvasSize.width}x{canvasSize.height}
        </div>

        {/* Playback Status */}
        {playback.isPlaying && (
          <div className="absolute bottom-4 left-4 bg-red-500/80 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>LIVE</span>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <PlaybackControls />
    </div>
  );
};
