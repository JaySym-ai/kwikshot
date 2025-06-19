// Multicam Preview Component - Shows multiple camera angles simultaneously
// Built using AugmentCode tool - www.augmentcode.com

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MulticamGroup } from '../../../types/videoEditorTypes';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { 
  Video, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX,
  Eye,
  EyeOff,
  Grid3X3,
  Square
} from 'lucide-react';

interface MulticamPreviewProps {
  multicamGroup: MulticamGroup;
  layout: 'grid' | 'sidebar' | 'overlay';
  onAngleSwitch: (angle: number) => void;
  className?: string;
}

export const MulticamPreview: React.FC<MulticamPreviewProps> = ({
  multicamGroup,
  layout,
  onAngleSwitch,
  className = ''
}) => {
  const canvasRefs = useRef<{ [angleId: string]: HTMLCanvasElement | null }>({});
  const [hoveredAngle, setHoveredAngle] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { playback, currentProject } = useVideoEditorStore();

  const getLayoutClasses = () => {
    switch (layout) {
      case 'grid':
        return 'grid grid-cols-2 gap-2 p-4';
      case 'sidebar':
        return 'flex flex-col space-y-2 p-2';
      case 'overlay':
        return 'grid grid-cols-2 gap-1 p-2 bg-black/80 backdrop-blur-sm rounded-lg';
      default:
        return 'grid grid-cols-2 gap-2 p-4';
    }
  };

  const getPreviewSize = () => {
    switch (layout) {
      case 'grid':
        return { width: 320, height: 180 };
      case 'sidebar':
        return { width: 240, height: 135 };
      case 'overlay':
        return { width: 160, height: 90 };
      default:
        return { width: 320, height: 180 };
    }
  };

  const renderAnglePreview = useCallback((angleIndex: number) => {
    const angle = multicamGroup.angles[angleIndex];
    if (!angle || !currentProject) return;

    const canvas = canvasRefs.current[angle.id];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Find the track for this angle
    const track = currentProject.tracks.find(t => t.id === angle.trackId);
    if (!track) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Find active clip at current time
    const activeClip = track.clips.find(clip => 
      playback.currentTime >= clip.startTime && playback.currentTime <= clip.endTime
    );

    if (activeClip) {
      // TODO: Render actual video frame
      // For now, show a placeholder with angle info
      ctx.fillStyle = angle.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(angle.name, canvas.width / 2, canvas.height / 2);
      
      // Show time indicator
      ctx.font = '12px monospace';
      ctx.fillText(
        `${Math.floor(playback.currentTime)}s`, 
        canvas.width / 2, 
        canvas.height / 2 + 20
      );
    } else {
      // No active clip - show "No Signal"
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#666666';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No Signal', canvas.width / 2, canvas.height / 2);
    }
  }, [multicamGroup, currentProject, playback.currentTime]);

  // Update previews when playback time changes
  useEffect(() => {
    multicamGroup.angles.forEach((_, index) => {
      renderAnglePreview(index);
    });
  }, [renderAnglePreview]);

  const handleAngleClick = useCallback((angleIndex: number) => {
    onAngleSwitch(angleIndex);
  }, [onAngleSwitch]);

  const { width, height } = getPreviewSize();

  return (
    <div className={`multicam-preview ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Grid3X3 size={16} className="text-blue-400" />
          <span className="text-sm font-medium">Multicam Preview</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-ghost p-1"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Preview Grid */}
      <div className={getLayoutClasses()}>
        {multicamGroup.angles.map((angle, index) => {
          const isActive = index === multicamGroup.activeAngle;
          const isHovered = index === hoveredAngle;

          return (
            <motion.div
              key={angle.id}
              className={`preview-angle relative rounded overflow-hidden cursor-pointer transition-all duration-200 ${
                isActive 
                  ? 'ring-2 ring-blue-500' 
                  : isHovered 
                  ? 'ring-2 ring-yellow-500' 
                  : 'ring-1 ring-gray-600'
              }`}
              onClick={() => handleAngleClick(index)}
              onMouseEnter={() => setHoveredAngle(index)}
              onMouseLeave={() => setHoveredAngle(null)}
              whileHover={{ scale: layout === 'overlay' ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Canvas for video preview */}
              <canvas
                ref={(el) => canvasRefs.current[angle.id] = el}
                width={width}
                height={height}
                className="w-full h-full object-cover"
                style={{ aspectRatio: '16/9' }}
              />

              {/* Overlay Info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                    LIVE
                  </div>
                )}

                {/* Angle Number */}
                <div 
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: angle.color }}
                >
                  {index + 1}
                </div>

                {/* Angle Name */}
                <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
                  {angle.name}
                </div>

                {/* Audio Indicator */}
                <div className="absolute bottom-2 right-2 flex items-center space-x-1">
                  <Volume2 size={12} className="text-white" />
                  <div className="w-8 h-1 bg-gray-600 rounded overflow-hidden">
                    <div 
                      className="h-full bg-green-400 transition-all duration-100"
                      style={{ width: `${Math.random() * 100}%` }} // TODO: Real audio level
                    />
                  </div>
                </div>
              </div>

              {/* Hover Actions */}
              {isHovered && !isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center"
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <Video size={20} className="text-white" />
                  </div>
                </motion.div>
              )}

              {/* Click Ripple Effect */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 border-2 border-blue-400 rounded"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.1, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Quick Switch Indicators */}
      {layout !== 'overlay' && (
        <div className="p-2 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xs text-gray-400">Quick Switch:</span>
            {multicamGroup.angles.map((angle, index) => (
              <button
                key={angle.id}
                className={`w-6 h-6 rounded text-xs font-mono transition-colors ${
                  index === multicamGroup.activeAngle
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={{ 
                  backgroundColor: index === multicamGroup.activeAngle ? angle.color : 'transparent',
                  border: `1px solid ${angle.color}`
                }}
                onClick={() => handleAngleClick(index)}
                title={`Switch to ${angle.name} (Key: ${index + 1})`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Mode */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="grid grid-cols-2 gap-4 max-w-6xl w-full h-full p-4">
            {multicamGroup.angles.map((angle, index) => (
              <div
                key={angle.id}
                className={`relative rounded overflow-hidden cursor-pointer ${
                  index === multicamGroup.activeAngle ? 'ring-4 ring-blue-500' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAngleClick(index);
                }}
              >
                <canvas
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 text-white text-lg font-bold">
                  {angle.name}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
