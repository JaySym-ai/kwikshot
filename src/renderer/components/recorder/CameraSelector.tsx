import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Settings, RefreshCw, Play, Square } from 'lucide-react';
import { useRecordingStore, MediaDevice } from '../../stores/recordingStore';
import { MediaDeviceService } from '../../services/MediaDeviceService';

export const CameraSelector: React.FC = () => {
  const {
    settings,
    availableCameras,
    isRecording,
    updateSettings,
    setAvailableCameras,
    addWarning,
  } = useRecordingStore();

  const [isLoading, setIsLoading] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaDeviceService = MediaDeviceService.getInstance();

  useEffect(() => {
    loadCameras();
    
    // Listen for device changes
    const handleDeviceChange = () => {
      loadCameras();
    };
    
    mediaDeviceService.addDeviceChangeListener(handleDeviceChange);
    
    return () => {
      mediaDeviceService.removeDeviceChangeListener(handleDeviceChange);
      stopPreview();
    };
  }, []);

  const loadCameras = async () => {
    setIsLoading(true);
    try {
      const { cameras } = await mediaDeviceService.getAllDevices();
      setAvailableCameras(cameras);
    } catch (error) {
      console.error('Failed to load cameras:', error);
      addWarning('Failed to load camera devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraToggle = () => {
    if (isRecording) return;
    
    const newEnabled = !settings.cameraEnabled;
    updateSettings({ cameraEnabled: newEnabled });
    
    if (!newEnabled) {
      stopPreview();
    }
  };

  const handleCameraSelect = (camera: MediaDevice) => {
    if (isRecording) return;
    
    updateSettings({ selectedCamera: camera });
    
    if (settings.cameraEnabled) {
      startPreview(camera);
    }
  };

  const handlePositionChange = (position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
    if (isRecording) return;
    updateSettings({ cameraPosition: position });
  };

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    if (isRecording) return;
    updateSettings({ cameraSize: size });
  };

  const startPreview = async (camera: MediaDevice) => {
    try {
      setIsTestingCamera(true);
      stopPreview(); // Stop any existing preview
      
      const stream = await mediaDeviceService.getCameraStream(camera.deviceId);
      setPreviewStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to start camera preview:', error);
      addWarning(`Failed to start camera preview: ${error}`);
    } finally {
      setIsTestingCamera(false);
    }
  };

  const stopPreview = () => {
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
      setPreviewStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const testCamera = async (camera: MediaDevice) => {
    if (isTestingCamera) return;
    
    try {
      setIsTestingCamera(true);
      const isWorking = await mediaDeviceService.testCamera(camera.deviceId);
      
      if (isWorking) {
        startPreview(camera);
      } else {
        addWarning(`Camera ${camera.label} is not working properly`);
      }
    } catch (error) {
      console.error('Camera test failed:', error);
      addWarning(`Camera test failed: ${error}`);
    } finally {
      setIsTestingCamera(false);
    }
  };

  const positionOptions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
  ] as const;

  const sizeOptions = [
    { value: 'small', label: 'Small (320×240)' },
    { value: 'medium', label: 'Medium (640×480)' },
    { value: 'large', label: 'Large (1280×720)' },
  ] as const;

  return (
    <div className="recording-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <Camera size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Camera</h3>
            <p className="text-sm text-gray-400">Add webcam overlay to your recording</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={loadCameras}
            disabled={isLoading || isRecording}
            className="p-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-300 disabled:opacity-50 hover:shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </motion.button>

          <motion.button
            onClick={handleCameraToggle}
            disabled={isRecording}
            className={`toggle ${settings.cameraEnabled ? 'toggle-active' : ''} ${
              isRecording ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            whileHover={!isRecording ? { scale: 1.05 } : {}}
            whileTap={!isRecording ? { scale: 0.95 } : {}}
          >
            <div className={`toggle-thumb ${settings.cameraEnabled ? 'toggle-thumb-active' : ''}`} />
          </motion.button>

          <span className={`text-sm font-medium ${
            settings.cameraEnabled ? 'text-purple-400' : 'text-gray-400'
          }`}>
            {settings.cameraEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {settings.cameraEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Camera Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Camera</label>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 bg-gray-700/50 rounded-lg shimmer"></div>
                  ))}
                </div>
              ) : availableCameras.length > 0 ? (
                <div className="space-y-2">
                  {availableCameras.map((camera) => (
                    <motion.div
                      key={camera.deviceId}
                      className={`device-card ${
                        settings.selectedCamera?.deviceId === camera.deviceId
                          ? 'device-card-selected'
                          : ''
                      } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => !isRecording && handleCameraSelect(camera)}
                      whileHover={!isRecording ? {
                        scale: 1.02,
                        boxShadow: '0 8px 32px rgba(147, 51, 234, 0.2)'
                      } : {}}
                      layout
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Camera size={16} className="text-purple-400" />
                          <span className="text-sm font-medium">{camera.label}</span>
                        </div>
                        
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            testCamera(camera);
                          }}
                          disabled={isTestingCamera || isRecording}
                          className="p-1 rounded bg-gray-600/50 hover:bg-gray-500/50 transition-colors disabled:opacity-50"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {isTestingCamera ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Play size={14} />
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <CameraOff size={24} className="mx-auto mb-2" />
                  <p className="text-sm">No cameras found</p>
                </div>
              )}
            </div>

            {/* Camera Preview */}
            {previewStream && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <label className="block text-sm font-medium text-purple-400">Live Preview</label>
                <div className="device-preview group">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.button
                      onClick={stopPreview}
                      className="absolute top-3 right-3 p-2 bg-red-600/90 hover:bg-red-600 rounded-xl transition-colors shadow-lg"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Square size={16} />
                    </motion.button>
                  </div>
                  <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white">
                    Live Preview
                  </div>
                </div>
              </motion.div>
            )}

            {/* Position Settings */}
            <div>
              <label className="block text-sm font-medium mb-3 text-purple-400">Camera Position</label>
              <div className="grid grid-cols-2 gap-3">
                {positionOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handlePositionChange(option.value)}
                    disabled={isRecording}
                    className={`quality-option ${
                      settings.cameraPosition === option.value
                        ? 'quality-option-selected border-purple-500 bg-purple-900/20'
                        : 'quality-option-unselected'
                    } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                    whileHover={!isRecording ? {
                      scale: 1.02,
                      boxShadow: '0 4px 20px rgba(147, 51, 234, 0.2)'
                    } : {}}
                    whileTap={!isRecording ? { scale: 0.98 } : {}}
                  >
                    <div className="font-medium">{option.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Size Settings */}
            <div>
              <label className="block text-sm font-medium mb-3 text-purple-400">Camera Size</label>
              <div className="space-y-3">
                {sizeOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleSizeChange(option.value)}
                    disabled={isRecording}
                    className={`quality-option w-full text-left ${
                      settings.cameraSize === option.value
                        ? 'quality-option-selected border-purple-500 bg-purple-900/20'
                        : 'quality-option-unselected'
                    } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                    whileHover={!isRecording ? {
                      scale: 1.02,
                      boxShadow: '0 4px 20px rgba(147, 51, 234, 0.2)'
                    } : {}}
                    whileTap={!isRecording ? { scale: 0.98 } : {}}
                  >
                    <div className="font-medium">{option.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
