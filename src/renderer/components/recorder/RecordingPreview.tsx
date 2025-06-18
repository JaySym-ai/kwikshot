import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { useRecordingStore } from '../../stores/recordingStore';

export const RecordingPreview: React.FC = () => {
  const {
    settings,
    previewStream,
    cameraStream,
    isPreviewActive,
    isRecording,
    setPreviewActive,
  } = useRecordingStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewStream && mainVideoRef.current) {
      mainVideoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  useEffect(() => {
    if (cameraStream && cameraVideoRef.current && settings.cameraEnabled) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, settings.cameraEnabled]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds of inactivity
    const timer = setTimeout(() => {
      if (isRecording) {
        setShowControls(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, isRecording]);

  const togglePreview = () => {
    setPreviewActive(!isPreviewActive);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (mainVideoRef.current) {
      mainVideoRef.current.muted = !isMuted;
    }
  };

  const getCameraPositionStyles = () => {
    const baseStyles = "absolute z-10 border-2 border-white/20 rounded-lg overflow-hidden shadow-lg";
    const sizeStyles = {
      small: "w-32 h-24",
      medium: "w-48 h-36", 
      large: "w-64 h-48"
    };
    
    const positionStyles = {
      'top-left': "top-4 left-4",
      'top-right': "top-4 right-4",
      'bottom-left': "bottom-4 left-4",
      'bottom-right': "bottom-4 right-4"
    };

    return `${baseStyles} ${sizeStyles[settings.cameraSize]} ${positionStyles[settings.cameraPosition]}`;
  };

  if (!isPreviewActive) {
    return (
      <div className="recording-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-500/20 rounded-xl">
              <EyeOff size={20} className="text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-400">Preview Disabled</h3>
              <p className="text-sm text-gray-500">Enable to see real-time recording preview</p>
            </div>
          </div>

          <motion.button
            onClick={togglePreview}
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Enable Preview
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="recording-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <Eye size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Recording Preview</h3>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-400">Real-time recording preview</p>
              {isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="recording-indicator"></div>
                  <span className="text-xs text-red-400 font-medium">LIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </motion.button>
          
          <motion.button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </motion.button>
          
          <motion.button
            onClick={togglePreview}
            className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Disable
          </motion.button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden aspect-video"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isRecording && setShowControls(true)}
      >
        {previewStream ? (
          <>
            {/* Main video stream */}
            <video
              ref={mainVideoRef}
              autoPlay
              muted={isMuted}
              playsInline
              className="w-full h-full object-contain"
            />
            
            {/* Camera overlay */}
            <AnimatePresence>
              {settings.cameraEnabled && cameraStream && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={getCameraPositionStyles()}
                >
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Controls overlay */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"
                >
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center space-x-2">
                      {isRecording && (
                        <div className="flex items-center space-x-2 bg-red-600/80 px-3 py-1 rounded-lg">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-white text-sm font-medium">Recording</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={toggleMute}
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isMuted ? (
                          <VolumeX size={16} className="text-white" />
                        ) : (
                          <Volume2 size={16} className="text-white" />
                        )}
                      </motion.button>
                      
                      <motion.button
                        onClick={toggleFullscreen}
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isFullscreen ? (
                          <Minimize2 size={16} className="text-white" />
                        ) : (
                          <Maximize2 size={16} className="text-white" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <EyeOff size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Preview Available</p>
              <p className="text-sm">Start recording to see preview</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Preview Info */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-700/30 rounded-lg p-3">
          <div className="text-gray-400 mb-1">Resolution</div>
          <div className="font-medium">
            {settings.quality.resolution === 'custom' 
              ? `${settings.quality.customWidth}×${settings.quality.customHeight}`
              : settings.quality.resolution
            }
          </div>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-3">
          <div className="text-gray-400 mb-1">Frame Rate</div>
          <div className="font-medium">{settings.quality.frameRate} fps</div>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-3">
          <div className="text-gray-400 mb-1">Video Bitrate</div>
          <div className="font-medium">{settings.quality.videoBitrate} kbps</div>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-3">
          <div className="text-gray-400 mb-1">Audio</div>
          <div className="font-medium">
            {settings.includeSystemAudio && settings.includeMicrophone
              ? 'System + Mic'
              : settings.includeSystemAudio
              ? 'System Only'
              : settings.includeMicrophone
              ? 'Mic Only'
              : 'No Audio'
            }
          </div>
        </div>
      </div>
    </div>
  );
};
