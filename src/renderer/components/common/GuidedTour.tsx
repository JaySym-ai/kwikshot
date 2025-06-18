import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Play, Target, Lightbulb } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  isActive,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const target = document.querySelector(steps[currentStep].target) as HTMLElement;
    if (target) {
      setTargetElement(target);
      
      // Scroll target into view
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Calculate tooltip position
      const rect = target.getBoundingClientRect();
      const position = steps[currentStep].position;
      
      let x = 0, y = 0;
      
      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top - 20;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom + 20;
          break;
        case 'left':
          x = rect.left - 20;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right + 20;
          y = rect.top + rect.height / 2;
          break;
      }
      
      setTooltipPosition({ x, y });
    }
  }, [currentStep, isActive, steps]);

  const handleNext = () => {
    const step = steps[currentStep];
    if (step.action) {
      step.action();
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isActive || !steps[currentStep]) return null;

  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-60"
        />

        {/* Spotlight */}
        {targetElement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none"
            style={{
              left: targetElement.getBoundingClientRect().left - 8,
              top: targetElement.getBoundingClientRect().top - 8,
              width: targetElement.getBoundingClientRect().width + 16,
              height: targetElement.getBoundingClientRect().height + 16,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              borderRadius: '12px',
              border: '3px solid #3B82F6',
              animation: 'pulse 2s infinite'
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute pointer-events-auto"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-400">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {currentStepData.content}
              </p>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex space-x-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded ${
                      index <= currentStep ? 'bg-blue-500' : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center space-x-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Skip Tour
              </button>

              <button
                onClick={handleNext}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
                {currentStep === steps.length - 1 ? (
                  <Target className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 bg-gray-900 border-gray-700 transform rotate-45 ${
              currentStepData.position === 'top' ? 'bottom-0 translate-y-1/2 border-b border-r' :
              currentStepData.position === 'bottom' ? 'top-0 -translate-y-1/2 border-t border-l' :
              currentStepData.position === 'left' ? 'right-0 translate-x-1/2 border-r border-b' :
              'left-0 -translate-x-1/2 border-l border-t'
            }`}
            style={{
              left: currentStepData.position === 'left' || currentStepData.position === 'right' ? 
                (currentStepData.position === 'left' ? 'auto' : '0') : '50%',
              top: currentStepData.position === 'top' || currentStepData.position === 'bottom' ? 
                (currentStepData.position === 'top' ? 'auto' : '0') : '50%',
              transform: currentStepData.position === 'left' || currentStepData.position === 'right' ?
                'translateY(-50%) rotate(45deg)' : 'translateX(-50%) rotate(45deg)'
            }}
          />
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            border-color: #3B82F6;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 3px #3B82F6;
          }
          50% {
            border-color: #60A5FA;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 3px #60A5FA, 0 0 20px #3B82F6;
          }
        }
      `}</style>
    </AnimatePresence>
  );
};

// Predefined tour configurations
export const streamingTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Live Streaming!',
    content: 'Let\'s take a quick tour of the streaming interface. This will help you get started with professional live streaming.',
    target: '[data-tour="header"]',
    position: 'bottom'
  },
  {
    id: 'dashboard',
    title: 'Stream Dashboard',
    content: 'This is your main control center. Start, stop, and monitor your streams from here. You can see your stream status and key metrics.',
    target: '[data-tour="dashboard-tab"]',
    position: 'bottom'
  },
  {
    id: 'scenes',
    title: 'Scene Builder',
    content: 'Create and manage different scenes for your stream. Add sources like screen capture, webcam, images, and more.',
    target: '[data-tour="scenes-tab"]',
    position: 'bottom'
  },
  {
    id: 'audio',
    title: 'Audio Mixer',
    content: 'Professional audio mixing with multiple sources, filters, and effects. Control volume levels and apply audio processing.',
    target: '[data-tour="audio-tab"]',
    position: 'bottom'
  },
  {
    id: 'monitoring',
    title: 'Performance Analytics',
    content: 'Monitor your stream performance, network quality, and system resources in real-time.',
    target: '[data-tour="monitoring-tab"]',
    position: 'bottom'
  },
  {
    id: 'overlays',
    title: 'Stream Overlays',
    content: 'Add custom overlays, graphics, and widgets to enhance your stream presentation.',
    target: '[data-tour="overlays-tab"]',
    position: 'bottom'
  },
  {
    id: 'setup',
    title: 'Stream Setup',
    content: 'Configure your streaming platform, quality settings, and authentication. The setup wizard will guide you through the process.',
    target: '[data-tour="setup-button"]',
    position: 'left'
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    content: 'You\'re all set to start streaming! Use the setup wizard to configure your first stream, then hit "Go Live" to start broadcasting.',
    target: '[data-tour="go-live-button"]',
    position: 'top'
  }
];

export const recordingTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Screen Recording!',
    content: 'Let\'s explore the recording features. You can capture your screen, webcam, and audio with professional quality.',
    target: '[data-tour="recording-header"]',
    position: 'bottom'
  },
  {
    id: 'sources',
    title: 'Select Sources',
    content: 'Choose what you want to record - your entire screen, specific windows, or applications.',
    target: '[data-tour="source-selector"]',
    position: 'right'
  },
  {
    id: 'settings',
    title: 'Recording Settings',
    content: 'Configure video quality, audio settings, and output format for your recordings.',
    target: '[data-tour="recording-settings"]',
    position: 'left'
  },
  {
    id: 'controls',
    title: 'Recording Controls',
    content: 'Start, pause, and stop your recordings. You can also take screenshots during recording.',
    target: '[data-tour="recording-controls"]',
    position: 'top'
  },
  {
    id: 'preview',
    title: 'Live Preview',
    content: 'See exactly what you\'re recording in real-time. The preview updates as you change sources.',
    target: '[data-tour="recording-preview"]',
    position: 'bottom'
  }
];
