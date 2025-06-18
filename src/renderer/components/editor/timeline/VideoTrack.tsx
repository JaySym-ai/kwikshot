// Video Track Component - Video track with clip visualization
// Built using AugmentCode tool - www.augmentcode.com

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Track, TimelineViewport, VideoClip } from '../../../types/videoEditorTypes';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { VideoClipComponent } from './VideoClip';

interface VideoTrackProps {
  track: Track;
  viewport: TimelineViewport;
  width: number;
  height: number;
  isSelected: boolean;
  className?: string;
}

export const VideoTrack: React.FC<VideoTrackProps> = ({
  track,
  viewport,
  width,
  height,
  isSelected,
  className = ''
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [dropPosition, setDropPosition] = useState<number | null>(null);

  const {
    addClip,
    moveClip,
    selection,
    selectClips,
    currentTool,
    snapToGrid,
    gridSize
  } = useVideoEditorStore();

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    if (!dragOver) setDragOver(true);
    
    // Calculate drop position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + viewport.scrollLeft;
    const time = viewport.startTime + (x / viewport.pixelsPerSecond);
    
    // Snap to grid if enabled
    const snappedTime = snapToGrid 
      ? Math.round(time / gridSize) * gridSize 
      : time;
    
    setDropPosition(Math.max(0, snappedTime));
  }, [dragOver, viewport, snapToGrid, gridSize]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only hide drag indicator if leaving the track entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(false);
      setDropPosition(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setDropPosition(null);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (dragData.type === 'file' && dragData.data.type.startsWith('video/')) {
        // Handle video file drop
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + viewport.scrollLeft;
        const time = viewport.startTime + (x / viewport.pixelsPerSecond);
        
        const snappedTime = snapToGrid 
          ? Math.round(time / gridSize) * gridSize 
          : time;
        
        // Create new video clip
        const newClip: VideoClip = {
          id: crypto.randomUUID(),
          name: dragData.data.name,
          type: 'video',
          filePath: dragData.data.path,
          duration: dragData.data.duration || 10, // Default duration
          startTime: Math.max(0, snappedTime),
          endTime: Math.max(0, snappedTime) + (dragData.data.duration || 10),
          trimStart: 0,
          trimEnd: dragData.data.duration || 10,
          trackId: track.id,
          locked: false,
          muted: false,
          volume: 1,
          effects: [],
          transitions: {},
          width: dragData.data.width || 1920,
          height: dragData.data.height || 1080,
          frameRate: dragData.data.frameRate || 30,
          codec: dragData.data.codec || 'h264',
          hasAudio: dragData.data.hasAudio || false,
          thumbnail: dragData.data.thumbnail,
          transform: {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            opacity: 1
          }
        };
        
        addClip(newClip, track.id);
      } else if (dragData.type === 'clip') {
        // Handle clip move from another track
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + viewport.scrollLeft;
        const time = viewport.startTime + (x / viewport.pixelsPerSecond);
        
        const snappedTime = snapToGrid 
          ? Math.round(time / gridSize) * gridSize 
          : time;
        
        moveClip(dragData.data.id, track.id, Math.max(0, snappedTime));
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [addClip, moveClip, track.id, viewport, snapToGrid, gridSize]);

  // Handle track click for selection
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (currentTool.type !== 'select') return;
    
    // Clear clip selection when clicking empty track area
    const target = e.target as HTMLElement;
    if (target.classList.contains('video-track-content')) {
      selectClips([]);
    }
  }, [currentTool, selectClips]);

  // Calculate visible clips
  const visibleClips = track.clips.filter(clip => {
    const clipEnd = clip.startTime + clip.duration;
    return clipEnd >= viewport.startTime && clip.startTime <= viewport.endTime;
  });

  return (
    <div
      className={`video-track relative ${isSelected ? 'bg-blue-900/20' : 'bg-gray-900'} ${className}`}
      style={{ width, height }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Track Background */}
      <div 
        className="video-track-content absolute inset-0 border-b border-gray-700/50"
        onClick={handleTrackClick}
      >
        {/* Track Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="video-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#video-pattern)" />
          </svg>
        </div>
      </div>

      {/* Drop Indicator */}
      {dragOver && dropPosition !== null && (
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
          style={{
            left: (dropPosition - viewport.startTime) * viewport.pixelsPerSecond
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
        />
      )}

      {/* Video Clips */}
      {visibleClips.map((clip) => (
        <VideoClipComponent
          key={clip.id}
          clip={clip as VideoClip}
          viewport={viewport}
          trackHeight={height}
          isSelected={selection.clips.includes(clip.id)}
        />
      ))}

      {/* Track Overlay Effects */}
      {!track.visible && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
          <div className="text-gray-500 text-sm font-medium">Hidden</div>
        </div>
      )}
      
      {track.locked && (
        <div className="absolute top-1 right-1 bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">
          Locked
        </div>
      )}
    </div>
  );
};
