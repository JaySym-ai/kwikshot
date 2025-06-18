// Video Clip Component - Draggable video clip with trim handles
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { VideoClip, TimelineViewport } from '../../../types/videoEditorTypes';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { Film, Volume2, VolumeX, Lock, Eye, EyeOff } from 'lucide-react';

interface VideoClipProps {
  clip: VideoClip;
  viewport: TimelineViewport;
  trackHeight: number;
  isSelected: boolean;
  className?: string;
}

export const VideoClipComponent: React.FC<VideoClipProps> = ({
  clip,
  viewport,
  trackHeight,
  isSelected,
  className = ''
}) => {
  const clipRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, time: 0 });

  const {
    updateClip,
    trimClip,
    selectClips,
    selection,
    currentTool,
    snapToGrid,
    gridSize,
    showThumbnails
  } = useVideoEditorStore();

  // Calculate clip position and dimensions
  const clipLeft = (clip.startTime - viewport.startTime) * viewport.pixelsPerSecond;
  const clipWidth = clip.duration * viewport.pixelsPerSecond;
  const isVisible = clipLeft + clipWidth >= 0 && clipLeft <= viewport.pixelsPerSecond * (viewport.endTime - viewport.startTime);

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
      className={`video-clip absolute top-1 bottom-1 rounded-lg overflow-hidden cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-900' : ''
      } ${isDragging ? 'z-50' : 'z-10'} ${className}`}
      style={{
        left: clipLeft,
        width: Math.max(20, clipWidth), // Minimum width for visibility
        backgroundColor: clip.locked ? '#6b7280' : '#3b82f6'
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
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-90" />
      
      {/* Thumbnail Background */}
      {showThumbnails && clip.thumbnail && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${clip.thumbnail})` }}
        />
      )}

      {/* Clip Content */}
      <div className="relative h-full flex items-center px-2">
        {/* Clip Icon */}
        <Film size={16} className="text-white mr-2 flex-shrink-0" />
        
        {/* Clip Name */}
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">
            {clip.name}
          </div>
          {trackHeight > 60 && (
            <div className="text-blue-200 text-xs truncate">
              {clip.width}x{clip.height} • {clip.frameRate}fps
            </div>
          )}
        </div>

        {/* Clip Status Icons */}
        <div className="flex items-center space-x-1 ml-2">
          {clip.muted && <VolumeX size={12} className="text-red-400" />}
          {!clip.muted && clip.hasAudio && <Volume2 size={12} className="text-green-400" />}
          {clip.locked && <Lock size={12} className="text-orange-400" />}
          {!clip.transform || clip.transform.opacity < 1 && (
            <EyeOff size={12} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Trim Handles */}
      {isSelected && !clip.locked && currentTool.type === 'select' && (
        <>
          {/* Left trim handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 bg-blue-300 cursor-ew-resize hover:bg-blue-200 transition-colors"
            onMouseDown={handleTrimStart}
            title="Trim start"
          />
          
          {/* Right trim handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-2 bg-blue-300 cursor-ew-resize hover:bg-blue-200 transition-colors"
            onMouseDown={handleTrimEnd}
            title="Trim end"
          />
        </>
      )}

      {/* Effects Indicator */}
      {clip.effects.length > 0 && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
      )}

      {/* Transitions Indicators */}
      {clip.transitions.in && (
        <div className="absolute left-1 top-1 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-yellow-500 border-b-4 border-b-transparent" />
      )}
      {clip.transitions.out && (
        <div className="absolute right-1 top-1 w-0 h-0 border-l-4 border-l-yellow-500 border-r-4 border-r-transparent border-b-4 border-b-transparent" />
      )}

      {/* Clip Border */}
      <div className="absolute inset-0 border border-blue-400/50 rounded-lg pointer-events-none" />
    </motion.div>
  );
};
