// Audio Clip Component - Audio clip with waveform visualization
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AudioClip, TimelineViewport } from '../../../types/videoEditorTypes';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { Volume2, VolumeX, Lock, Music } from 'lucide-react';

interface AudioClipProps {
  clip: AudioClip;
  viewport: TimelineViewport;
  trackHeight: number;
  isSelected: boolean;
  showWaveform: boolean;
  className?: string;
}

export const AudioClipComponent: React.FC<AudioClipProps> = ({
  clip,
  viewport,
  trackHeight,
  isSelected,
  showWaveform,
  className = ''
}) => {
  const clipRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, time: 0 });

  const {
    updateClip,
    selectClips,
    selection,
    currentTool,
    snapToGrid,
    gridSize
  } = useVideoEditorStore();

  // Calculate clip position and dimensions
  const clipLeft = (clip.startTime - viewport.startTime) * viewport.pixelsPerSecond;
  const clipWidth = clip.duration * viewport.pixelsPerSecond;
  const isVisible = clipLeft + clipWidth >= 0 && clipLeft <= viewport.pixelsPerSecond * (viewport.endTime - viewport.startTime);

  // Generate waveform data
  const waveformPoints = useMemo(() => {
    if (!showWaveform || !clip.waveformData || clipWidth < 10) return '';
    
    const points: string[] = [];
    const samples = Math.min(Math.floor(clipWidth / 2), clip.waveformData[0]?.length || 0);
    
    if (samples === 0) return '';
    
    const channelData = clip.waveformData[0]; // Use first channel
    const step = channelData.length / samples;
    
    for (let i = 0; i < samples; i++) {
      const sampleIndex = Math.floor(i * step);
      const amplitude = channelData[sampleIndex] || 0;
      const x = (i / samples) * clipWidth;
      const y = trackHeight / 2 + amplitude * (trackHeight / 4) * clip.volume;
      points.push(`${x},${y}`);
    }
    
    return points.join(' ');
  }, [showWaveform, clip.waveformData, clipWidth, trackHeight, clip.volume]);

  // Generate simplified waveform for performance
  const generateSimpleWaveform = () => {
    if (!showWaveform || clipWidth < 10) return null;
    
    const bars: JSX.Element[] = [];
    const barCount = Math.min(Math.floor(clipWidth / 3), 100);
    const barWidth = clipWidth / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const amplitude = Math.random() * 0.8 + 0.2; // Random amplitude for demo
      const height = amplitude * (trackHeight - 8) * clip.volume;
      const x = i * barWidth;
      const y = (trackHeight - height) / 2;
      
      bars.push(
        <rect
          key={i}
          x={x}
          y={y}
          width={Math.max(1, barWidth - 0.5)}
          height={height}
          fill="currentColor"
          className="text-green-400"
          opacity={0.7}
        />
      );
    }
    
    return bars;
  };

  // Handle clip selection
  const handleClipClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      const newSelection = isSelected 
        ? selection.clips.filter(id => id !== clip.id)
        : [...selection.clips, clip.id];
      selectClips(newSelection);
    } else {
      // Single select
      selectClips([clip.id]);
    }
  }, [clip.id, isSelected, selection.clips, selectClips]);

  // Handle clip dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentTool.type !== 'select' || clip.locked) return;
    
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      time: clip.startTime
    });
  }, [currentTool, clip.locked, clip.startTime]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaTime = deltaX / viewport.pixelsPerSecond;
    let newStartTime = dragStart.time + deltaTime;
    
    // Snap to grid if enabled
    if (snapToGrid) {
      newStartTime = Math.round(newStartTime / gridSize) * gridSize;
    }
    
    // Ensure clip doesn't go negative
    newStartTime = Math.max(0, newStartTime);
    
    updateClip(clip.id, {
      startTime: newStartTime,
      endTime: newStartTime + clip.duration
    });
  }, [isDragging, dragStart, viewport.pixelsPerSecond, snapToGrid, gridSize, updateClip, clip.id, clip.duration]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle trim handles
  const handleTrimStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (clip.locked) return;
    
    setIsResizing('left');
    setDragStart({
      x: e.clientX,
      time: clip.trimStart
    });
  }, [clip.locked, clip.trimStart]);

  const handleTrimEnd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (clip.locked) return;
    
    setIsResizing('right');
    setDragStart({
      x: e.clientX,
      time: clip.trimEnd
    });
  }, [clip.locked, clip.trimEnd]);

  const handleTrimMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaTime = deltaX / viewport.pixelsPerSecond;
    
    if (isResizing === 'left') {
      let newTrimStart = dragStart.time + deltaTime;
      
      // Snap to grid if enabled
      if (snapToGrid) {
        newTrimStart = Math.round(newTrimStart / gridSize) * gridSize;
      }
      
      // Ensure trim doesn't exceed clip bounds
      newTrimStart = Math.max(0, Math.min(newTrimStart, clip.trimEnd - 0.1));
      
      const newDuration = clip.trimEnd - newTrimStart;
      const newStartTime = clip.startTime + (newTrimStart - clip.trimStart);
      
      updateClip(clip.id, {
        trimStart: newTrimStart,
        duration: newDuration,
        startTime: newStartTime,
        endTime: newStartTime + newDuration
      });
    } else if (isResizing === 'right') {
      let newTrimEnd = dragStart.time + deltaTime;
      
      // Snap to grid if enabled
      if (snapToGrid) {
        newTrimEnd = Math.round(newTrimEnd / gridSize) * gridSize;
      }
      
      // Ensure trim doesn't exceed clip bounds
      newTrimEnd = Math.max(clip.trimStart + 0.1, newTrimEnd);
      
      const newDuration = newTrimEnd - clip.trimStart;
      
      updateClip(clip.id, {
        trimEnd: newTrimEnd,
        duration: newDuration,
        endTime: clip.startTime + newDuration
      });
    }
  }, [isResizing, dragStart, viewport.pixelsPerSecond, snapToGrid, gridSize, updateClip, clip]);

  const handleTrimUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  // Mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleTrimMove);
      document.addEventListener('mouseup', handleTrimUp);
      
      return () => {
        document.removeEventListener('mousemove', handleTrimMove);
        document.removeEventListener('mouseup', handleTrimUp);
      };
    }
  }, [isResizing, handleTrimMove, handleTrimUp]);

  // Handle drag start for moving to other tracks
  const handleDragStart = useCallback((e: React.DragEvent) => {
    const dragData = {
      type: 'clip',
      data: clip
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  }, [clip]);

  if (!isVisible) return null;

  return (
    <motion.div
      ref={clipRef}
      className={`audio-clip absolute top-1 bottom-1 rounded-lg overflow-hidden cursor-pointer ${
        isSelected ? 'ring-2 ring-green-500 ring-offset-1 ring-offset-gray-900' : ''
      } ${isDragging ? 'z-50' : 'z-10'} ${className}`}
      style={{
        left: clipLeft,
        width: Math.max(20, clipWidth), // Minimum width for visibility
        backgroundColor: clip.locked ? '#6b7280' : '#10b981'
      }}
      onClick={handleClipClick}
      onMouseDown={handleMouseDown}
      draggable={!clip.locked && currentTool.type === 'select'}
      onDragStart={handleDragStart}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: isSelected ? 1 : 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Clip Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-90" />
      
      {/* Waveform Visualization */}
      {showWaveform && (
        <div className="absolute inset-0 overflow-hidden">
          <svg width="100%" height="100%" className="absolute inset-0">
            {/* Waveform bars */}
            {generateSimpleWaveform()}
            
            {/* Center line */}
            <line
              x1="0"
              y1={trackHeight / 2}
              x2={clipWidth}
              y2={trackHeight / 2}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-green-300"
              opacity={0.5}
            />
          </svg>
        </div>
      )}

      {/* Clip Content */}
      <div className="relative h-full flex items-center px-2 z-10">
        {/* Clip Icon */}
        <Music size={16} className="text-white mr-2 flex-shrink-0" />
        
        {/* Clip Name */}
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">
            {clip.name}
          </div>
          {trackHeight > 40 && (
            <div className="text-green-200 text-xs truncate">
              {clip.channels}ch • {clip.sampleRate}Hz
            </div>
          )}
        </div>

        {/* Volume Indicator */}
        <div className="flex items-center space-x-1 ml-2">
          {clip.muted ? (
            <VolumeX size={12} className="text-red-400" />
          ) : (
            <Volume2 size={12} className="text-green-400" />
          )}
          {clip.locked && <Lock size={12} className="text-orange-400" />}
        </div>
      </div>

      {/* Volume Level Indicator */}
      {!clip.muted && trackHeight > 50 && (
        <div className="absolute bottom-1 left-2 right-2 h-1 bg-green-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all duration-200"
            style={{ width: `${clip.volume * 100}%` }}
          />
        </div>
      )}

      {/* Trim Handles */}
      {isSelected && !clip.locked && currentTool.type === 'select' && (
        <>
          {/* Left trim handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 bg-green-300 cursor-ew-resize hover:bg-green-200 transition-colors"
            onMouseDown={handleTrimStart}
            title="Trim start"
          />
          
          {/* Right trim handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-2 bg-green-300 cursor-ew-resize hover:bg-green-200 transition-colors"
            onMouseDown={handleTrimEnd}
            title="Trim end"
          />
        </>
      )}

      {/* Effects Indicator */}
      {clip.effects.length > 0 && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
      )}

      {/* Audio Gain Indicator */}
      {clip.audioGain !== 0 && (
        <div className={`absolute top-1 left-1 text-xs px-1 rounded ${
          clip.audioGain > 0 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
        }`}>
          {clip.audioGain > 0 ? '+' : ''}{clip.audioGain.toFixed(1)}dB
        </div>
      )}

      {/* Clip Border */}
      <div className="absolute inset-0 border border-green-400/50 rounded-lg pointer-events-none" />
    </motion.div>
  );
};
