import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Play, Square, Pause, Monitor, Camera, Mic, Radio } from 'lucide-react';
import { useRecordingStore } from '../../stores/recordingStore';
import { ScreenRecordingService } from '../../services/ScreenRecordingService';
import { MediaDeviceService } from '../../services/MediaDeviceService';
import { HotkeyService } from '../../services/HotkeyService';
import { FileManager } from '../../services/FileManager';
import { RecordingControls } from './RecordingControls';
import { SourceSelector } from './SourceSelector';
import { CameraSelector } from './CameraSelector';
import { AudioDeviceSelector } from './AudioDeviceSelector';
import { RecordingSettings } from './RecordingSettings';
import { RecordingPreview } from './RecordingPreview';
import { RecordingTimer } from './RecordingTimer';
import { RecordingTest } from './RecordingTest';

interface RecorderProps {
  onSwitchToEditor: () => void;
  onSwitchToStreaming?: () => void;
}

export const Recorder: React.FC<RecorderProps> = ({ onSwitchToEditor, onSwitchToStreaming }) => {
  const {
    isRecording,
    isPaused,
    isProcessing,
    duration,
    recordedBlob,
    settings,
    availableCameras,
    availableMicrophones,
    availableSpeakers,
    setRecording,
    setPaused,
    setProcessing,
    setDuration,
    incrementDuration,
    setRecordedBlob,
    setMediaRecorder,
    setMediaStream,
    setCameraStream,
    setPreviewStream,
    setAvailableCameras,
    setAvailableMicrophones,
    setAvailableSpeakers,
    setError,
    addWarning,
    reset,
  } = useRecordingStore();

  const recordingServiceRef = useRef<ScreenRecordingService | null>(null);
  const mediaDeviceServiceRef = useRef<MediaDeviceService>(MediaDeviceService.getInstance());
  const hotkeyServiceRef = useRef<HotkeyService>(HotkeyService.getInstance());
  const fileManagerRef = useRef<FileManager>(FileManager.getInstance());
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize recording service
        recordingServiceRef.current = new ScreenRecordingService();

        // Check capabilities on mount
        const capabilities = ScreenRecordingService.getCapabilities();
        if (!capabilities.supportsDisplayMedia) {
          setError('Screen recording is not supported in this browser');
        }

        // Initialize hotkey service
        await hotkeyServiceRef.current.initialize();

        // Register recording hotkeys
        hotkeyServiceRef.current.registerAction({
          id: 'startRecording',
          name: 'Start Recording',
          description: 'Begin a new screen recording session',
          defaultShortcut: 'Cmd+Shift+R',
          callback: handleStartRecording,
        });

        hotkeyServiceRef.current.registerAction({
          id: 'stopRecording',
          name: 'Stop Recording',
          description: 'End the current recording session',
          defaultShortcut: 'Cmd+Shift+S',
          callback: handleStopRecording,
        });

        hotkeyServiceRef.current.registerAction({
          id: 'pauseRecording',
          name: 'Pause/Resume Recording',
          description: 'Pause or resume the current recording',
          defaultShortcut: 'Cmd+Shift+P',
          callback: () => {
            if (isPaused) {
              handleResumeRecording();
            } else {
              handlePauseRecording();
            }
          },
        });

        // Load media devices
        await loadMediaDevices();

      } catch (error) {
        console.error('Failed to initialize services:', error);
        addWarning('Some features may not be available');
      }
    };

    initializeServices();

    return () => {
      if (recordingServiceRef.current) {
        recordingServiceRef.current.cleanup();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      hotkeyServiceRef.current.cleanup();
    };
  }, [setError, addWarning]);

  // Duration timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      durationIntervalRef.current = setInterval(() => {
        incrementDuration();
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording, isPaused, incrementDuration]);

  // Load media devices
  const loadMediaDevices = async () => {
    try {
      const { cameras, microphones, speakers } = await mediaDeviceServiceRef.current.getAllDevices();
      setAvailableCameras(cameras);
      setAvailableMicrophones(microphones);
      setAvailableSpeakers(speakers);
    } catch (error) {
      console.error('Failed to load media devices:', error);
      addWarning('Failed to load media devices');
    }
  };

  // Recording handlers
  const handleStartRecording = async (): Promise<void> => {
    if (!recordingServiceRef.current || !settings.selectedSource) {
      setError('No recording source selected');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Get multi-source streams (display + camera + microphone)
      const streams = await recordingServiceRef.current.getMultiSourceStreams(settings);

      setMediaStream(streams.combinedStream);
      setCameraStream(streams.cameraStream || null);
      setPreviewStream(streams.displayStream);

      // Start recording with combined stream
      await recordingServiceRef.current.startRecording(streams.combinedStream, settings, {
        onDataAvailable: (blob) => {
          // Handle data chunks if needed
        },
        onStop: async (blob) => {
          setRecordedBlob(blob);
          setProcessing(true);

          try {
            // Save recording to file
            const recordingFile = await fileManagerRef.current.saveRecording(
              blob,
              settings,
              duration,
              {
                generateThumbnail: true,
                autoOpen: false,
              }
            );

            console.log('Recording saved:', recordingFile);

            // Auto-switch to editor after recording
            setTimeout(() => {
              onSwitchToEditor();
            }, 1000);
          } catch (saveError) {
            console.error('Failed to save recording:', saveError);
            addWarning('Recording completed but failed to save to file');
          } finally {
            setProcessing(false);
          }
        },
        onError: (error) => {
          setError(error.message);
          setProcessing(false);
          setRecording(false);
        },
      });

      setRecording(true);
      setDuration(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleStopRecording = (): void => {
    if (recordingServiceRef.current) {
      setProcessing(true);
      recordingServiceRef.current.stopRecording();
      setRecording(false);
      setPaused(false);
    }
  };

  const handlePauseRecording = (): void => {
    if (recordingServiceRef.current) {
      recordingServiceRef.current.pauseRecording();
      setPaused(true);
    }
  };

  const handleResumeRecording = (): void => {
    if (recordingServiceRef.current) {
      recordingServiceRef.current.resumeRecording();
      setPaused(false);
    }
  };

  // Check recording capabilities
  const capabilities = ScreenRecordingService.getCapabilities();
  const isSupported = capabilities.supportsDisplayMedia && capabilities.supportsMediaRecorder;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-2">Screen Recorder</h1>
        <p className="text-gray-400">Capture your screen, webcam, and audio with professional quality</p>

        {/* Capability Status */}
        <div className="mt-3 flex items-center space-x-2">
          {isSupported ? (
            <>
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm text-green-400">Screen recording supported</span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} className="text-red-500" />
              <span className="text-sm text-red-400">Screen recording not supported</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Recording Timer */}
          <RecordingTimer />

          {/* Recording Controls */}
          <RecordingControls
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onPauseRecording={handlePauseRecording}
            onResumeRecording={handleResumeRecording}
          />

          {/* Recording Preview */}
          <RecordingPreview />

          {/* Go Live Button */}
          {onSwitchToStreaming && !isRecording && (
            <div className="flex justify-center">
              <motion.button
                onClick={onSwitchToStreaming}
                className="btn-secondary bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 flex items-center space-x-2 px-6 py-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Radio size={20} />
                <span>Go Live</span>
              </motion.button>
            </div>
          )}

          {/* Source Selection */}
          <SourceSelector />

          {/* Camera Selection */}
          <CameraSelector />

          {/* Audio Device Selection */}
          <AudioDeviceSelector />

          {/* Recording Settings */}
          <RecordingSettings />

          {/* Test Component (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-center">Development Test</h2>
              <RecordingTest />
            </div>
          )}

          {/* Recording Complete */}
          {recordedBlob && !isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 border-green-500/50 bg-green-900/20"
            >
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle size={24} className="text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-400">Recording Complete!</h3>
                  <p className="text-sm text-green-300">Your recording has been saved and is ready for editing.</p>
                </div>
              </div>

              <motion.button
                onClick={onSwitchToEditor}
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Open in Editor
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
