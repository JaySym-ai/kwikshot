import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Youtube,
  Twitch,
  Facebook,
  Server,
  Monitor,
  Mic,
  Camera,
  Settings,
  Zap,
  Shield,
  Wifi,
  HardDrive
} from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

interface StreamingSetupWizardProps {
  onComplete: (config: any) => void;
  onClose: () => void;
}

export const StreamingSetupWizard: React.FC<StreamingSetupWizardProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<any>({
    platform: null,
    streamSettings: {},
    audioSettings: {},
    hardwareSettings: {},
    overlaySettings: {}
  });
  const [isLoading, setIsLoading] = useState(false);

  const steps: SetupStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Live Streaming',
      description: 'Let\'s set up your professional streaming experience',
      icon: Zap,
      component: WelcomeStep
    },
    {
      id: 'platform',
      title: 'Choose Your Platform',
      description: 'Select where you want to stream',
      icon: Youtube,
      component: PlatformStep
    },
    {
      id: 'hardware',
      title: 'Hardware Detection',
      description: 'Optimize settings for your hardware',
      icon: HardDrive,
      component: HardwareStep
    },
    {
      id: 'quality',
      title: 'Stream Quality',
      description: 'Configure video and audio quality',
      icon: Settings,
      component: QualityStep
    },
    {
      id: 'sources',
      title: 'Setup Sources',
      description: 'Configure your video and audio sources',
      icon: Camera,
      component: SourcesStep
    },
    {
      id: 'complete',
      title: 'Ready to Stream!',
      description: 'Your streaming setup is complete',
      icon: Check,
      component: CompleteStep
    }
  ];

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(setupData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateSetupData = (stepData: any) => {
    setSetupData(prev => ({ ...prev, ...stepData }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Streaming Setup</h1>
              <p className="text-blue-100 mt-1">Step {currentStep + 1} of {steps.length}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center space-x-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <React.Fragment key={step.id}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-white text-blue-600'
                        : 'bg-blue-400 text-blue-100'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 rounded transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-blue-400'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {currentStepData.title}
                </h2>
                <p className="text-gray-400 text-lg">
                  {currentStepData.description}
                </p>
              </div>

              <StepComponent
                data={setupData}
                onUpdate={updateSetupData}
                onNext={handleNext}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 p-6 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>{currentStep + 1} of {steps.length}</span>
          </div>

          <button
            onClick={handleNext}
            disabled={isLoading}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <span>{currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Welcome Step Component
const WelcomeStep: React.FC<any> = ({ onNext }) => {
  return (
    <div className="text-center space-y-8">
      <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <Zap className="w-16 h-16 text-white" />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl text-white">
          Welcome to Professional Live Streaming
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto">
          This wizard will help you set up everything you need for professional live streaming.
          We'll configure your platform, optimize your hardware settings, and ensure the best
          possible streaming experience.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {[
          { icon: Youtube, label: 'Platform Integration' },
          { icon: HardDrive, label: 'Hardware Optimization' },
          { icon: Settings, label: 'Quality Settings' },
          { icon: Shield, label: 'Secure Authentication' }
        ].map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="bg-gray-800 rounded-lg p-4 text-center">
              <Icon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-300">{feature.label}</p>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="btn-primary text-lg px-8 py-3"
      >
        Get Started
      </button>
    </div>
  );
};

// Platform Selection Step
const PlatformStep: React.FC<any> = ({ data, onUpdate, onNext }) => {
  const [selectedPlatform, setSelectedPlatform] = useState(data.platform);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const platforms = [
    {
      id: 'youtube',
      name: 'YouTube Live',
      icon: Youtube,
      color: 'from-red-500 to-red-600',
      description: 'Stream to the world\'s largest video platform',
      features: ['Unlimited streaming', 'Chat integration', 'Analytics']
    },
    {
      id: 'twitch',
      name: 'Twitch',
      icon: Twitch,
      color: 'from-purple-500 to-purple-600',
      description: 'Connect with the gaming community',
      features: ['Gaming focused', 'Interactive chat', 'Clips & highlights']
    },
    {
      id: 'facebook',
      name: 'Facebook Live',
      icon: Facebook,
      color: 'from-blue-500 to-blue-600',
      description: 'Reach your Facebook audience',
      features: ['Social integration', 'Event streaming', 'Page broadcasting']
    },
    {
      id: 'custom',
      name: 'Custom RTMP',
      icon: Server,
      color: 'from-gray-500 to-gray-600',
      description: 'Use any RTMP-compatible service',
      features: ['Full control', 'Any platform', 'Custom settings']
    }
  ];

  const handlePlatformSelect = async (platform: any) => {
    setSelectedPlatform(platform);
    onUpdate({ platform });

    if (platform.id !== 'custom') {
      setIsAuthenticating(true);
      try {
        // Simulate authentication
        await new Promise(resolve => setTimeout(resolve, 2000));
        onNext();
      } catch (error) {
        console.error('Authentication failed:', error);
      } finally {
        setIsAuthenticating(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isSelected = selectedPlatform?.id === platform.id;

          return (
            <motion.div
              key={platform.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePlatformSelect(platform)}
              className={`relative bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border-2 ${
                isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-gray-600'
              }`}
            >
              <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center mb-4`}>
                <Icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">{platform.name}</h3>
              <p className="text-gray-400 mb-4">{platform.description}</p>

              <ul className="space-y-1">
                {platform.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-4 right-4"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {isAuthenticating && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-3 text-blue-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span>Authenticating with {selectedPlatform?.name}...</span>
          </div>
        </div>
      )}

      {selectedPlatform?.id === 'custom' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4">RTMP Configuration</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">RTMP URL</label>
              <input
                type="text"
                placeholder="rtmp://your-server.com/live"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stream Key</label>
              <input
                type="password"
                placeholder="Your stream key"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Hardware Detection Step
const HardwareStep: React.FC<any> = ({ data, onUpdate, setIsLoading }) => {
  const [hardwareInfo, setHardwareInfo] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    detectHardware();
  }, []);

  const detectHardware = async () => {
    setIsDetecting(true);
    setIsLoading(true);

    try {
      // Simulate hardware detection
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockHardware = {
        gpu: 'NVIDIA GeForce RTX 4070',
        encoders: {
          nvenc: true,
          quicksync: false,
          vce: false,
          videotoolbox: false
        },
        memory: '16 GB',
        cpu: 'Intel Core i7-12700K',
        recommendedSettings: {
          encoder: 'nvenc',
          preset: 'p4',
          bitrate: 6000
        }
      };

      setHardwareInfo(mockHardware);
      onUpdate({ hardwareSettings: mockHardware });
    } catch (error) {
      console.error('Hardware detection failed:', error);
    } finally {
      setIsDetecting(false);
      setIsLoading(false);
    }
  };

  if (isDetecting) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-6 relative">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
          <div className="absolute inset-2 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
          <HardDrive className="absolute inset-0 m-auto w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-xl text-white mb-2">Detecting Hardware</h3>
        <p className="text-gray-400">Analyzing your system for optimal streaming settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          Hardware Detection Complete
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Graphics Card</label>
              <p className="text-white font-medium">{hardwareInfo?.gpu}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">CPU</label>
              <p className="text-white font-medium">{hardwareInfo?.cpu}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Memory</label>
              <p className="text-white font-medium">{hardwareInfo?.memory}</p>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-3 block">Available Encoders</label>
            <div className="space-y-2">
              {Object.entries(hardwareInfo?.encoders || {}).map(([encoder, available]) => (
                <div key={encoder} className="flex items-center justify-between">
                  <span className="text-white capitalize">{encoder}</span>
                  <div className={`w-3 h-3 rounded-full ${available ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Zap className="w-5 h-5 text-green-500 mr-2" />
          Recommended Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-400">Encoder</p>
            <p className="text-white font-semibold">{hardwareInfo?.recommendedSettings?.encoder?.toUpperCase()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Preset</p>
            <p className="text-white font-semibold">{hardwareInfo?.recommendedSettings?.preset?.toUpperCase()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Bitrate</p>
            <p className="text-white font-semibold">{hardwareInfo?.recommendedSettings?.bitrate} kbps</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quality Settings Step
const QualityStep: React.FC<any> = ({ data, onUpdate }) => {
  const [settings, setSettings] = useState({
    resolution: '1080p',
    frameRate: 30,
    bitrate: 6000,
    audioQuality: 'high',
    ...data.streamSettings
  });

  const resolutions = [
    { value: '720p', label: '720p (1280x720)', description: 'Good for slower connections' },
    { value: '1080p', label: '1080p (1920x1080)', description: 'Standard HD quality' },
    { value: '1440p', label: '1440p (2560x1440)', description: 'High quality (requires fast connection)' }
  ];

  const frameRates = [30, 60];
  const audioQualities = [
    { value: 'medium', label: 'Medium (128 kbps)', bitrate: 128 },
    { value: 'high', label: 'High (192 kbps)', bitrate: 192 },
    { value: 'highest', label: 'Highest (320 kbps)', bitrate: 320 }
  ];

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdate({ streamSettings: newSettings });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Settings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Monitor className="w-5 h-5 text-blue-500 mr-2" />
            Video Quality
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
              <div className="space-y-2">
                {resolutions.map((res) => (
                  <label key={res.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="resolution"
                      value={res.value}
                      checked={settings.resolution === res.value}
                      onChange={(e) => updateSetting('resolution', e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="text-white">{res.label}</p>
                      <p className="text-sm text-gray-400">{res.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Frame Rate</label>
              <div className="flex space-x-4">
                {frameRates.map((fps) => (
                  <label key={fps} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="frameRate"
                      value={fps}
                      checked={settings.frameRate === fps}
                      onChange={(e) => updateSetting('frameRate', parseInt(e.target.value))}
                      className="mr-2"
                    />
                    <span className="text-white">{fps} FPS</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bitrate: {settings.bitrate} kbps
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={settings.bitrate}
                onChange={(e) => updateSetting('bitrate', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 Mbps</span>
                <span>10 Mbps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Mic className="w-5 h-5 text-green-500 mr-2" />
            Audio Quality
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quality</label>
              <div className="space-y-2">
                {audioQualities.map((quality) => (
                  <label key={quality.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="audioQuality"
                      value={quality.value}
                      checked={settings.audioQuality === quality.value}
                      onChange={(e) => updateSetting('audioQuality', e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-white">{quality.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-3">Stream Preview</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-400">Resolution</p>
            <p className="text-white font-semibold">{settings.resolution}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Frame Rate</p>
            <p className="text-white font-semibold">{settings.frameRate} FPS</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Video Bitrate</p>
            <p className="text-white font-semibold">{settings.bitrate} kbps</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Audio Quality</p>
            <p className="text-white font-semibold">{settings.audioQuality}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sources Setup Step
const SourcesStep: React.FC<any> = ({ data, onUpdate }) => {
  const [sources, setSources] = useState({
    video: 'screen',
    audio: 'microphone',
    ...data.sourceSettings
  });

  const videoSources = [
    { value: 'screen', label: 'Screen Capture', icon: Monitor, description: 'Capture your entire screen or a window' },
    { value: 'webcam', label: 'Webcam', icon: Camera, description: 'Use your camera for face cam' },
    { value: 'both', label: 'Screen + Webcam', icon: Monitor, description: 'Combine screen capture with webcam overlay' }
  ];

  const audioSources = [
    { value: 'microphone', label: 'Microphone Only', icon: Mic, description: 'Just your voice' },
    { value: 'desktop', label: 'Desktop Audio Only', icon: Monitor, description: 'System sounds and music' },
    { value: 'both', label: 'Microphone + Desktop', icon: Mic, description: 'Voice and system audio' }
  ];

  const updateSource = (type: string, value: string) => {
    const newSources = { ...sources, [type]: value };
    setSources(newSources);
    onUpdate({ sourceSettings: newSources });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Sources */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Camera className="w-5 h-5 text-blue-500 mr-2" />
            Video Source
          </h3>

          <div className="space-y-3">
            {videoSources.map((source) => {
              const Icon = source.icon;
              const isSelected = sources.video === source.value;

              return (
                <motion.div
                  key={source.value}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => updateSource('video', source.value)}
                  className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                    isSelected ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-white font-medium">{source.label}</p>
                      <p className="text-sm text-gray-400">{source.description}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-blue-500 ml-auto" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Audio Sources */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Mic className="w-5 h-5 text-green-500 mr-2" />
            Audio Source
          </h3>

          <div className="space-y-3">
            {audioSources.map((source) => {
              const Icon = source.icon;
              const isSelected = sources.audio === source.value;

              return (
                <motion.div
                  key={source.value}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => updateSource('audio', source.value)}
                  className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                    isSelected ? 'border-green-500 bg-green-900/20' : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-green-500' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-white font-medium">{source.label}</p>
                      <p className="text-sm text-gray-400">{source.description}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Source Preview</h4>
        <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Monitor className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400">Preview will show here</p>
            <p className="text-sm text-gray-500">
              {videoSources.find(s => s.value === sources.video)?.label} + {' '}
              {audioSources.find(s => s.value === sources.audio)?.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Complete Step
const CompleteStep: React.FC<any> = ({ data, onNext }) => {
  return (
    <div className="text-center space-y-8">
      <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
        <Check className="w-16 h-16 text-white" />
      </div>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">
          🎉 Setup Complete!
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Your streaming setup is ready! You can now start streaming with optimized settings
          tailored to your hardware and preferences.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
        <h4 className="text-lg font-semibold text-white mb-4">Setup Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div>
            <p className="text-sm text-gray-400">Platform</p>
            <p className="text-white font-medium">{data.platform?.name || 'Not selected'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Video Quality</p>
            <p className="text-white font-medium">
              {data.streamSettings?.resolution} @ {data.streamSettings?.frameRate}fps
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Encoder</p>
            <p className="text-white font-medium">
              {data.hardwareSettings?.recommendedSettings?.encoder?.toUpperCase() || 'Auto'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Bitrate</p>
            <p className="text-white font-medium">{data.streamSettings?.bitrate} kbps</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onNext}
          className="btn-primary text-lg px-8 py-3"
        >
          Start Streaming
        </button>
        <button className="btn-secondary text-lg px-8 py-3">
          Test Settings
        </button>
      </div>
    </div>
  );
};