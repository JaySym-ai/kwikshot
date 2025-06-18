import { useEffect, useRef } from 'react';
import { useRecordingStore } from '../stores/recordingStore';
import { ScreenRecordingService } from '../services/ScreenRecordingService';
import { MediaDeviceService } from '../services/MediaDeviceService';
import { HotkeyService } from '../services/HotkeyService';
import { FileManager } from '../services/FileManager';

export const useRecordingManager = (onSwitchToEditor: () => void) => {
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

  return {
    isRecording,
    isPaused,
    isProcessing,
    duration,
    recordedBlob,
    settings,
    availableCameras,
    availableMicrophones,
    availableSpeakers,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording
  };
};
