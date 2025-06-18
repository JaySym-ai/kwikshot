// Time Ruler Component - Timeline time display and markers
// Built using AugmentCode tool - www.augmentcode.com

import React from 'react';
import { TimelineViewport } from '../../../types/videoEditorTypes';

interface TimeRulerProps {
  viewport: TimelineViewport;
  width: number;
  snapToGrid: boolean;
  gridSize: number;
  className?: string;
}

export const TimeRuler: React.FC<TimeRulerProps> = ({
  viewport,
  width,
  snapToGrid,
  gridSize,
  className = ''
}) => {
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

  const getTickInterval = (): number => {
    const pixelsPerSecond = viewport.pixelsPerSecond;
    
    // Determine appropriate tick interval based on zoom level
    if (pixelsPerSecond >= 200) return 0.1; // 100ms
    if (pixelsPerSecond >= 100) return 0.5; // 500ms
    if (pixelsPerSecond >= 50) return 1;    // 1 second
    if (pixelsPerSecond >= 20) return 5;    // 5 seconds
    if (pixelsPerSecond >= 10) return 10;   // 10 seconds
    if (pixelsPerSecond >= 5) return 30;    // 30 seconds
    return 60; // 1 minute
  };

  const getSubTickInterval = (): number => {
    const mainInterval = getTickInterval();
    if (mainInterval <= 1) return mainInterval / 10;
    if (mainInterval <= 10) return mainInterval / 5;
    return mainInterval / 6;
  };

  const renderTicks = () => {
    const ticks: JSX.Element[] = [];
    const mainInterval = getTickInterval();
    const subInterval = getSubTickInterval();
    
    const startTime = Math.floor(viewport.startTime / subInterval) * subInterval;
    const endTime = viewport.endTime + subInterval;
    
    for (let time = startTime; time <= endTime; time += subInterval) {
      const x = (time - viewport.startTime) * viewport.pixelsPerSecond;
      
      if (x < -50 || x > width + 50) continue;
      
      const isMainTick = Math.abs(time % mainInterval) < 0.001;
      const isMediumTick = Math.abs(time % (mainInterval / 2)) < 0.001 && !isMainTick;
      
      let tickHeight = 4;
      let showLabel = false;
      
      if (isMainTick) {
        tickHeight = 12;
        showLabel = true;
      } else if (isMediumTick) {
        tickHeight = 8;
      }
      
      ticks.push(
        <div key={time} className="absolute flex flex-col items-center">
          <div
            className={`bg-gray-400 ${isMainTick ? 'bg-gray-300' : isMediumTick ? 'bg-gray-400' : 'bg-gray-500'}`}
            style={{
              left: x,
              width: '1px',
              height: `${tickHeight}px`,
              top: showLabel ? '20px' : `${20 - tickHeight + 12}px`
            }}
          />
          {showLabel && (
            <div
              className="absolute text-xs text-gray-300 font-mono select-none"
              style={{
                left: x - 30,
                top: '2px',
                width: '60px',
                textAlign: 'center'
              }}
            >
              {formatTime(time)}
            </div>
          )}
        </div>
      );
    }
    
    return ticks;
  };

  const renderGrid = () => {
    if (!snapToGrid) return null;
    
    const gridLines: JSX.Element[] = [];
    const gridInterval = gridSize;
    const startTime = Math.floor(viewport.startTime / gridInterval) * gridInterval;
    const endTime = viewport.endTime + gridInterval;
    
    for (let time = startTime; time <= endTime; time += gridInterval) {
      const x = (time - viewport.startTime) * viewport.pixelsPerSecond;
      
      if (x < 0 || x > width) continue;
      
      gridLines.push(
        <div
          key={`grid-${time}`}
          className="absolute bg-gray-700/30"
          style={{
            left: x,
            width: '1px',
            height: '100%',
            top: '32px'
          }}
        />
      );
    }
    
    return gridLines;
  };

  return (
    <div 
      className={`time-ruler relative bg-gray-800 border-b border-gray-700 ${className}`}
      style={{ width, height: '48px' }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-850" />
      
      {/* Grid lines */}
      {renderGrid()}
      
      {/* Time ticks and labels */}
      <div className="relative h-full">
        {renderTicks()}
      </div>
      
      {/* Ruler border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-600" />
    </div>
  );
};
