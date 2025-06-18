// Playhead Component - Timeline playback position indicator
// Built using AugmentCode tool - www.augmentcode.com

import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TimelineViewport } from '../../../types/videoEditorTypes';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';

interface PlayheadProps {
  currentTime: number;
  viewport: TimelineViewport;
  height: number;
  className?: string;
}

export const Playhead: React.FC<PlayheadProps> = ({
  currentTime,
  viewport,
  height,
  className = ''
}) => {
  const playheadRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const { seek, playback } = useVideoEditorStore();

  // Calculate playhead position
  const playheadX = (currentTime - viewport.startTime) * viewport.pixelsPerSecond;
  const isVisible = playheadX >= -10 && playheadX <= viewport.pixelsPerSecond * (viewport.endTime - viewport.startTime) + 10;

  // Handle playhead dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    
    if (playheadRef.current) {
      const rect = playheadRef.current.getBoundingClientRect();
      setDragOffset(e.clientX - rect.left);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const timelineElement = document.querySelector('.timeline-tracks');
    if (!timelineElement) return;
    
    const rect = timelineElement.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset + viewport.scrollLeft;
    const newTime = viewport.startTime + (x / viewport.pixelsPerSecond);
    
    seek(Math.max(0, newTime));
  }, [isDragging, dragOffset, viewport, seek]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
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

  if (!isVisible) return null;

  return (
    <motion.div
      ref={playheadRef}
      className={`playhead absolute top-0 pointer-events-none z-20 ${className}`}
      style={{
        left: playheadX,
        height: height
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Playhead Line */}
      <div className="playhead-line absolute w-0.5 h-full bg-red-500 shadow-lg shadow-red-500/50" />
      
      {/* Playhead Handle */}
      <div
        className="playhead-handle absolute -top-1 -left-2 w-4 h-6 bg-red-500 rounded-sm cursor-grab active:cursor-grabbing pointer-events-auto shadow-lg hover:bg-red-400 transition-colors"
        onMouseDown={handleMouseDown}
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)'
        }}
      >
        {/* Handle grip lines */}
        <div className="absolute inset-x-0 top-1 flex flex-col items-center space-y-0.5">
          <div className="w-2 h-0.5 bg-white/60 rounded-full" />
          <div className="w-2 h-0.5 bg-white/60 rounded-full" />
        </div>
      </div>
      
      {/* Time Display */}
      {isDragging && (
        <motion.div
          className="absolute -top-8 -left-8 bg-gray-900 text-white text-xs font-mono px-2 py-1 rounded shadow-lg border border-gray-600"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
        >
          {formatTime(currentTime)}
        </motion.div>
      )}
      
      {/* Playing indicator */}
      {playback.isPlaying && (
        <motion.div
          className="absolute -left-1 top-6 w-2 h-2 bg-red-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
};

// Helper function to format time
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
};
