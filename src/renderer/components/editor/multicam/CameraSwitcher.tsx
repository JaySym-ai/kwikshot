// Camera Switcher Component - Interface for switching between camera angles
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MulticamGroup, CameraSwitchEvent } from '../../../types/videoEditorTypes';
import { 
  Video, 
  Play, 
  Square, 
  RotateCw,
  Zap,
  Clock,
  Eye,
  Mic,
  Volume2
} from 'lucide-react';

interface CameraSwitcherProps {
  multicamGroup: MulticamGroup;
  currentTime: number;
  onAngleSwitch: (angle: number) => void;
  switchEvents: CameraSwitchEvent[];
  className?: string;
}

export const CameraSwitcher: React.FC<CameraSwitcherProps> = ({
  multicamGroup,
  currentTime,
  onAngleSwitch,
  switchEvents,
  className = ''
}) => {
  const [previewAngle, setPreviewAngle] = useState<number | null>(null);
  const [transitionType, setTransitionType] = useState<'cut' | 'fade' | 'dissolve'>('cut');

  const handleAngleClick = useCallback((angle: number) => {
    if (angle === multicamGroup.activeAngle) return;
    onAngleSwitch(angle);
  }, [multicamGroup.activeAngle, onAngleSwitch]);

  const handleAnglePreview = useCallback((angle: number | null) => {
    setPreviewAngle(angle);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  const getAngleActivity = (angle: number): number => {
    // TODO: Calculate actual activity level based on audio/motion analysis
    return Math.random() * 0.8 + 0.2; // Placeholder: random activity between 0.2-1.0
  };

  const getLastSwitchTime = (angle: number): number | null => {
    const lastSwitch = switchEvents
      .filter(event => event.toAngle === angle)
      .sort((a, b) => b.time - a.time)[0];
    return lastSwitch ? lastSwitch.time : null;
  };

  return (
    <div className={`camera-switcher ${className} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Video size={20} className="text-blue-400" />
          <h4 className="font-semibold">Camera Switcher</h4>
          <span className="text-sm text-gray-400">
            {multicamGroup.angles.length} angles
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Transition Type Selector */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-gray-400">Transition:</span>
            <select
              value={transitionType}
              onChange={(e) => setTransitionType(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
            >
              <option value="cut">Cut</option>
              <option value="fade">Fade</option>
              <option value="dissolve">Dissolve</option>
            </select>
          </div>

          {/* Current Time */}
          <div className="text-sm text-gray-400 font-mono">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* Camera Angles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {multicamGroup.angles.map((angle, index) => {
          const isActive = index === multicamGroup.activeAngle;
          const isPreviewing = index === previewAngle;
          const activity = getAngleActivity(index);
          const lastSwitch = getLastSwitchTime(index);

          return (
            <motion.div
              key={angle.id}
              className={`camera-angle relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                isActive 
                  ? 'ring-2 ring-blue-500 bg-blue-500/10' 
                  : isPreviewing
                  ? 'ring-2 ring-yellow-500 bg-yellow-500/10'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
              onClick={() => handleAngleClick(index)}
              onMouseEnter={() => handleAnglePreview(index)}
              onMouseLeave={() => handleAnglePreview(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Camera Preview */}
              <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                {angle.thumbnail ? (
                  <img 
                    src={angle.thumbnail} 
                    alt={angle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Video size={24} className="text-gray-600" />
                )}

                {/* Activity Indicator */}
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: activity > 0.5 ? '#10b981' : '#6b7280',
                      opacity: activity 
                    }}
                  />
                  <Volume2 size={12} className="text-gray-400" />
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                    LIVE
                  </div>
                )}

                {/* Preview Indicator */}
                {isPreviewing && !isActive && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium">
                    PREVIEW
                  </div>
                )}

                {/* Keyboard Shortcut */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-1 py-0.5 rounded text-xs font-mono">
                  {index + 1}
                </div>
              </div>

              {/* Camera Info */}
              <div className="p-2">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-medium truncate" style={{ color: angle.color }}>
                    {angle.name}
                  </h5>
                  <span className="text-xs text-gray-400">
                    #{angle.cameraNumber}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Eye size={10} />
                      <span>{Math.round(activity * 100)}%</span>
                    </div>
                    {lastSwitch && (
                      <div className="flex items-center space-x-1">
                        <Clock size={10} />
                        <span>{formatTime(lastSwitch)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      className="p-1 hover:bg-gray-600 rounded"
                      title="Solo this angle"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement solo functionality
                      }}
                    >
                      <Square size={10} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Transition Preview */}
              {isPreviewing && !isActive && transitionType !== 'cut' && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Quick Switch Bar */}
      <div className="mt-4 flex items-center justify-center space-x-2">
        <span className="text-xs text-gray-400">Quick Switch:</span>
        {multicamGroup.angles.map((angle, index) => (
          <button
            key={angle.id}
            className={`w-8 h-8 rounded text-xs font-mono transition-colors ${
              index === multicamGroup.activeAngle
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => handleAngleClick(index)}
            title={`Switch to ${angle.name} (Key: ${index + 1})`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Recent Switches */}
      {switchEvents.length > 0 && (
        <div className="mt-4 border-t border-gray-700 pt-3">
          <h5 className="text-sm font-medium mb-2 text-gray-300">Recent Switches</h5>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {switchEvents.slice(-3).reverse().map((event) => (
              <div key={event.id} className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  Angle {event.fromAngle + 1} → Angle {event.toAngle + 1}
                </span>
                <span className="font-mono">{formatTime(event.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
