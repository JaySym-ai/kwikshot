// Audio Track Component - Audio track with waveform visualization
// Built using AugmentCode tool - www.augmentcode.com

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Track, TimelineViewport, AudioClip } from '../../../types/videoEditorTypes';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { AudioClipComponent } from './AudioClip';

interface AudioTrackProps {
  track: Track;
  viewport: TimelineViewport;
  width: number;
  height: number;
  isSelected: boolean;
  className?: string;
}

export const AudioTrack: React.FC<AudioTrackProps> = ({
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
    gridSize,
    showWaveforms
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
      
      if (dragData.type === 'file' && dragData.data.type.startsWith('audio/')) {
        // Handle audio file drop
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + viewport.scrollLeft;
        const time = viewport.startTime + (x / viewport.pixelsPerSecond);
        
        const snappedTime = snapToGrid 
          ? Math.round(time / gridSize) * gridSize 
          : time;
        
        // Create new audio clip
        const newClip: AudioClip = {
          id: crypto.randomUUID(),
          name: dragData.data.name,
          type: 'audio',
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
          sampleRate: dragData.data.sampleRate || 48000,
          channels: dragData.data.channels || 2,
          bitRate: dragData.data.bitRate || 320,
          waveformData: dragData.data.waveformData,
          audioGain: 0
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
    if (target.classList.contains('audio-track-content')) {
      selectClips([]);
    }
  }, [currentTool, selectClips]);

  // Calculate visible clips
  const visibleClips = track.clips.filter(clip => {
    const clipEnd = clip.startTime + clip.duration;
    return clipEnd >= viewport.startTime && clip.startTime <= viewport.endTime;
  });

  // Generate background waveform pattern
  const generateWaveformPattern = () => {
    if (!showWaveforms) return null;
    
    const points: string[] = [];
    const samples = Math.floor(width / 2);
    
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * width;
      const amplitude = Math.sin(i * 0.1) * 0.3 + Math.sin(i * 0.05) * 0.2;
      const y = height / 2 + amplitude * (height / 4);
      points.push(`${x},${y}`);
    }
    
    return points.join(' ');
  };

  return (
    <div
      className={`audio-track relative ${isSelected ? 'bg-green-900/20' : 'bg-gray-900'} ${className}`}
      style={{ width, height }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Track Background */}
      <div 
        className="audio-track-content absolute inset-0 border-b border-gray-700/50"
        onClick={handleTrackClick}
      >
        {/* Background Waveform Pattern */}
        {showWaveforms && (
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <polyline
                points={generateWaveformPattern() || ''}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-green-400"
              />
              {/* Center line */}
              <line
                x1="0"
                y1={height / 2}
                x2={width}
                y2={height / 2}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-gray-600"
              />
            </svg>
          </div>
        )}

        {/* Track Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="audio-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#audio-pattern)" />
          </svg>
        </div>
      </div>

      {/* Drop Indicator */}
      {dragOver && dropPosition !== null && (
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10"
          style={{
            left: (dropPosition - viewport.startTime) * viewport.pixelsPerSecond
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
        />
      )}

      {/* Audio Clips */}
      {visibleClips.map((clip) => (
        <AudioClipComponent
          key={clip.id}
          clip={clip as AudioClip}
          viewport={viewport}
          trackHeight={height}
          isSelected={selection.clips.includes(clip.id)}
          showWaveform={showWaveforms}
        />
      ))}

      {/* Track Status Overlays */}
      {track.muted && (
        <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center">
          <div className="text-red-400 text-sm font-medium">Muted</div>
        </div>
      )}
      
      {track.solo && (
        <div className="absolute top-1 left-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
          Solo
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
