// Timeline Component - Foundation timeline with track management
// Built using AugmentCode tool - www.augmentcode.com

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { TimeRuler } from './TimeRuler';
import { VideoTrack } from './VideoTrack';
import { AudioTrack } from './AudioTrack';
import { Playhead } from './Playhead';
import { TrackHeader } from './TrackHeader';
import { Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface TimelineProps {
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ className = '' }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const {
    currentProject,
    viewport,
    playback,
    selection,
    currentTool,
    snapToGrid,
    gridSize,
    setViewport,
    seek,
    addTrack,
    zoomIn,
    zoomOut,
    zoomToFit,
    selectTimeRange,
    clearSelection
  } = useVideoEditorStore();

  // Calculate timeline dimensions
  const timelineWidth = viewport.pixelsPerSecond * (viewport.endTime - viewport.startTime);
  const trackHeaderWidth = 200;

  // Handle timeline scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    setViewport({ scrollLeft });
  }, [setViewport]);

  // Handle playhead click/drag
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - trackHeaderWidth + viewport.scrollLeft;
    const time = viewport.startTime + (x / viewport.pixelsPerSecond);
    
    if (currentTool.type === 'select') {
      seek(Math.max(0, time));
    }
  }, [seek, viewport, currentTool, trackHeaderWidth]);

  // Handle timeline drag for selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentTool.type !== 'select') return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    clearSelection();
  }, [currentTool, clearSelection]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const startX = dragStart.x - rect.left - trackHeaderWidth + viewport.scrollLeft;
    const endX = e.clientX - rect.left - trackHeaderWidth + viewport.scrollLeft;
    
    const startTime = viewport.startTime + (Math.min(startX, endX) / viewport.pixelsPerSecond);
    const endTime = viewport.startTime + (Math.max(startX, endX) / viewport.pixelsPerSecond);
    
    if (Math.abs(endX - startX) > 5) {
      selectTimeRange(Math.max(0, startTime), endTime);
    }
  }, [isDragging, dragStart, viewport, selectTimeRange, trackHeaderWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          // Toggle play/pause (handled by parent)
          break;
        case 'Home':
          seek(0);
          break;
        case 'End':
          if (currentProject) {
            seek(currentProject.settings.duration);
          }
          break;
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomToFit();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [seek, currentProject, zoomIn, zoomOut, zoomToFit]);

  if (!currentProject) {
    return (
      <div className={`timeline-empty ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-gray-400 mb-4">No project loaded</div>
            <button
              onClick={() => addTrack('video')}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Add Video Track</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`timeline ${className}`}>
      {/* Timeline Header */}
      <div className="timeline-header flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Timeline</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => addTrack('video')}
              className="btn-ghost text-sm flex items-center space-x-1"
              title="Add Video Track"
            >
              <Plus size={16} />
              <span>Video</span>
            </button>
            <button
              onClick={() => addTrack('audio')}
              className="btn-ghost text-sm flex items-center space-x-1"
              title="Add Audio Track"
            >
              <Plus size={16} />
              <span>Audio</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="btn-ghost p-2"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={zoomIn}
            className="btn-ghost p-2"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={zoomToFit}
            className="btn-ghost p-2"
            title="Zoom to Fit"
          >
            <Maximize2 size={16} />
          </button>
          <div className="text-sm text-gray-400">
            {Math.round(viewport.pixelsPerSecond)}px/s
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="timeline-content flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div 
          className="track-headers bg-gray-800 border-r border-gray-700"
          style={{ width: trackHeaderWidth }}
        >
          <div className="h-12 border-b border-gray-700 flex items-center px-4">
            <span className="text-sm font-medium text-gray-400">Tracks</span>
          </div>
          
          {currentProject.tracks.map((track) => (
            <TrackHeader
              key={track.id}
              track={track}
              height={track.height}
            />
          ))}
        </div>

        {/* Timeline Tracks */}
        <div 
          ref={timelineRef}
          className="timeline-tracks flex-1 overflow-auto custom-scrollbar"
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onClick={handleTimelineClick}
        >
          {/* Time Ruler */}
          <TimeRuler
            viewport={viewport}
            width={timelineWidth}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
          />

          {/* Tracks */}
          <div className="tracks-container relative">
            {currentProject.tracks.map((track, index) => (
              <div key={track.id} className="track-row relative">
                {track.type === 'video' ? (
                  <VideoTrack
                    track={track}
                    viewport={viewport}
                    width={timelineWidth}
                    height={track.height}
                    isSelected={selection.tracks.includes(track.id)}
                  />
                ) : (
                  <AudioTrack
                    track={track}
                    viewport={viewport}
                    width={timelineWidth}
                    height={track.height}
                    isSelected={selection.tracks.includes(track.id)}
                  />
                )}
              </div>
            ))}

            {/* Playhead */}
            <Playhead
              currentTime={playback.currentTime}
              viewport={viewport}
              height={currentProject.tracks.reduce((sum, track) => sum + track.height, 0) + 48} // +48 for ruler
            />

            {/* Selection Overlay */}
            {selection.timeRange && (
              <motion.div
                className="selection-overlay absolute top-12 bg-blue-500/20 border-l-2 border-r-2 border-blue-500 pointer-events-none"
                style={{
                  left: (selection.timeRange.start - viewport.startTime) * viewport.pixelsPerSecond,
                  width: (selection.timeRange.end - selection.timeRange.start) * viewport.pixelsPerSecond,
                  height: currentProject.tracks.reduce((sum, track) => sum + track.height, 0)
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Timeline-specific styles
const timelineStyles = `
  .timeline {
    @apply flex flex-col h-full bg-gray-900;
  }

  .timeline-empty {
    @apply flex items-center justify-center h-full bg-gray-900;
  }

  .timeline-header {
    @apply flex-shrink-0;
  }

  .timeline-content {
    @apply flex flex-1 overflow-hidden;
  }

  .track-headers {
    @apply flex-shrink-0 overflow-y-auto custom-scrollbar;
  }

  .timeline-tracks {
    @apply flex-1 relative;
    cursor: ${currentTool?.type === 'select' ? 'crosshair' : 'default'};
  }

  .tracks-container {
    @apply relative;
    min-width: 100%;
  }

  .track-row {
    @apply border-b border-gray-700/50;
  }

  .selection-overlay {
    z-index: 10;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = timelineStyles;
  document.head.appendChild(styleElement);
}
