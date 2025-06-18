import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, RefreshCw, Play, Square } from 'lucide-react';
import { useRecordingStore, MediaDevice } from '../../stores/recordingStore';
import { MediaDeviceService } from '../../services/MediaDeviceService';

export const AudioDeviceSelector: React.FC = () => {
  const {
    settings,
    availableMicrophones,
    availableSpeakers,
    isRecording,
    updateSettings,
    setAvailableMicrophones,
    setAvailableSpeakers,
    addWarning,
  } = useRecordingStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [testStream, setTestStream] = useState<MediaStream | null>(null);
  const mediaDeviceService = MediaDeviceService.getInstance();

  useEffect(() => {
    loadAudioDevices();
    
    // Listen for device changes
    const handleDeviceChange = () => {
      loadAudioDevices();
    };
    
    mediaDeviceService.addDeviceChangeListener(handleDeviceChange);
    
    return () => {
      mediaDeviceService.removeDeviceChangeListener(handleDeviceChange);
      stopMicTest();
    };
  }, []);

  const loadAudioDevices = async () => {
    setIsLoading(true);
    try {
      const { microphones, speakers } = await mediaDeviceService.getAllDevices();
      setAvailableMicrophones(microphones);
      setAvailableSpeakers(speakers);
    } catch (error) {
      console.error('Failed to load audio devices:', error);
      addWarning('Failed to load audio devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemAudioToggle = () => {
    if (isRecording) return;
    updateSettings({ includeSystemAudio: !settings.includeSystemAudio });
  };

  const handleMicrophoneToggle = () => {
    if (isRecording) return;
    const newEnabled = !settings.includeMicrophone;
    updateSettings({ includeMicrophone: newEnabled });
    
    if (!newEnabled) {
      stopMicTest();
    }
  };

  const handleMicrophoneSelect = (microphone: MediaDevice) => {
    if (isRecording) return;
    updateSettings({ selectedMicrophone: microphone });
  };

  const handleSpeakerSelect = (speaker: MediaDevice) => {
    if (isRecording) return;
    updateSettings({ selectedSpeaker: speaker });
  };

  const handleMicrophoneGainChange = (gain: number) => {
    if (isRecording) return;
    updateSettings({ microphoneGain: gain });
  };

  const handleSystemAudioGainChange = (gain: number) => {
    if (isRecording) return;
    updateSettings({ systemAudioGain: gain });
  };

  const startMicTest = async (microphone: MediaDevice) => {
    try {
      setIsTestingMic(true);
      stopMicTest(); // Stop any existing test
      
      const stream = await mediaDeviceService.getMicrophoneStream(microphone.deviceId);
      setTestStream(stream);
      
      // Set up audio level monitoring
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone_source = audioContext.createMediaStreamSource(stream);
      
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      
      microphone_source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!testStream) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicLevel(Math.min(100, (average / 255) * 100));
        
        requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
      
    } catch (error) {
      console.error('Failed to start microphone test:', error);
      addWarning(`Failed to test microphone: ${error}`);
    } finally {
      setIsTestingMic(false);
    }
  };

  const stopMicTest = () => {
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop());
      setTestStream(null);
    }
    setMicLevel(0);
  };

  const testMicrophone = async (microphone: MediaDevice) => {
    if (isTestingMic) {
      stopMicTest();
      return;
    }
    
    try {
      const isWorking = await mediaDeviceService.testMicrophone(microphone.deviceId);
      
      if (isWorking) {
        startMicTest(microphone);
      } else {
        addWarning(`Microphone ${microphone.label} is not working properly`);
      }
    } catch (error) {
      console.error('Microphone test failed:', error);
      addWarning(`Microphone test failed: ${error}`);
    }
  };

  return (
    <div className="recording-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/20 rounded-xl">
            <Volume2 size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Audio Devices</h3>
            <p className="text-sm text-gray-400">Configure microphone and system audio</p>
          </div>
        </div>
        
        <motion.button
          onClick={loadAudioDevices}
          disabled={isLoading || isRecording}
          className="p-2 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-300 disabled:opacity-50 hover:shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      <div className="space-y-6">
        {/* System Audio */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Volume2 size={16} className="text-blue-400" />
              <span className="text-sm font-medium">System Audio</span>
            </div>
            
            <motion.button
              onClick={handleSystemAudioToggle}
              disabled={isRecording}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                settings.includeSystemAudio
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={!isRecording ? { scale: 1.05 } : {}}
              whileTap={!isRecording ? { scale: 0.95 } : {}}
            >
              {settings.includeSystemAudio ? 'Enabled' : 'Disabled'}
            </motion.button>
          </div>
          
          <AnimatePresence>
            {settings.includeSystemAudio && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="space-y-2">
                  <label className="block text-xs text-gray-400">Volume: {settings.systemAudioGain}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.systemAudioGain}
                    onChange={(e) => handleSystemAudioGainChange(Number(e.target.value))}
                    disabled={isRecording}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Microphone */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Mic size={16} className="text-red-400" />
              <span className="text-sm font-medium">Microphone</span>
            </div>
            
            <motion.button
              onClick={handleMicrophoneToggle}
              disabled={isRecording}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                settings.includeMicrophone
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={!isRecording ? { scale: 1.05 } : {}}
              whileTap={!isRecording ? { scale: 0.95 } : {}}
            >
              {settings.includeMicrophone ? 'Enabled' : 'Disabled'}
            </motion.button>
          </div>
          
          <AnimatePresence>
            {settings.includeMicrophone && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Microphone Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Microphone</label>
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-12 bg-gray-700/50 rounded-lg shimmer"></div>
                      ))}
                    </div>
                  ) : availableMicrophones.length > 0 ? (
                    <div className="space-y-2">
                      {availableMicrophones.map((microphone) => (
                        <motion.div
                          key={microphone.deviceId}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            settings.selectedMicrophone?.deviceId === microphone.deviceId
                              ? 'border-red-500 bg-red-900/30'
                              : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                          } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => !isRecording && handleMicrophoneSelect(microphone)}
                          whileHover={!isRecording ? { scale: 1.02 } : {}}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Mic size={16} className="text-red-400" />
                              <span className="text-sm font-medium">{microphone.label}</span>
                            </div>
                            
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                testMicrophone(microphone);
                              }}
                              disabled={isRecording}
                              className="p-1 rounded bg-gray-600/50 hover:bg-gray-500/50 transition-colors disabled:opacity-50"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {testStream && settings.selectedMicrophone?.deviceId === microphone.deviceId ? (
                                <Square size={14} />
                              ) : (
                                <Play size={14} />
                              )}
                            </motion.button>
                          </div>
                          
                          {/* Microphone Level Indicator */}
                          {testStream && settings.selectedMicrophone?.deviceId === microphone.deviceId && (
                            <div className="mt-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-400">Level:</span>
                                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-green-500 to-red-500"
                                    style={{ width: `${micLevel}%` }}
                                    animate={{ width: `${micLevel}%` }}
                                    transition={{ duration: 0.1 }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 w-8">{Math.round(micLevel)}%</span>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <MicOff size={24} className="mx-auto mb-2" />
                      <p className="text-sm">No microphones found</p>
                    </div>
                  )}
                </div>

                {/* Microphone Gain */}
                <div className="space-y-2">
                  <label className="block text-xs text-gray-400">Microphone Gain: {settings.microphoneGain}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.microphoneGain}
                    onChange={(e) => handleMicrophoneGainChange(Number(e.target.value))}
                    disabled={isRecording}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
