import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recorder } from './components/recorder/Recorder';
import { Editor } from './components/editor/Editor';
import { Settings } from './components/settings/Settings';
import { ModernStreamingInterface } from './components/streaming/ModernStreamingInterface';
import { TitleBar } from './components/ui/TitleBar';
import { Sidebar } from './components/ui/Sidebar';
import { ToastProvider } from './contexts/ToastContext';
import { GuidedTour, streamingTourSteps, recordingTourSteps } from './components/common/GuidedTour';
import { SmartNotifications, useNotifications, createStreamNotifications } from './components/common/SmartNotifications';

type AppView = 'recorder' | 'editor' | 'streaming' | 'settings';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('recorder');
  const [showTour, setShowTour] = useState(false);
  const [tourType, setTourType] = useState<'streaming' | 'recording'>('streaming');
  const notifications = useNotifications();
  const streamNotifications = createStreamNotifications(notifications);

  useEffect(() => {
    // Check if user is new and should see the tour
    const hasSeenTour = localStorage.getItem('has-seen-tour');
    if (!hasSeenTour) {
      // Show tour after a brief delay
      setTimeout(() => {
        setShowTour(true);
        setTourType('recording'); // Start with recording tour since that's the default view
      }, 1000);
    }

    // Add tour data attributes to elements
    const addTourAttributes = () => {
      // Add data attributes for tour targeting
      const header = document.querySelector('.title-bar');
      if (header) header.setAttribute('data-tour', 'header');

      // Add more tour attributes as needed
    };

    addTourAttributes();
  }, []);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('has-seen-tour', 'true');
    notifications.success(
      'Welcome to KwikShot!',
      'You\'re all set to start recording and streaming. Explore the features and create amazing content!'
    );
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);

    // Show appropriate tour when switching to streaming for the first time
    if (view === 'streaming' && !localStorage.getItem('has-seen-streaming-tour')) {
      setTimeout(() => {
        setTourType('streaming');
        setShowTour(true);
        localStorage.setItem('has-seen-streaming-tour', 'true');
      }, 500);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };

  const pageTransition = {
    duration: 0.3
  };

  return (
    <ToastProvider position="top-right">
      <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
        {/* Custom Title Bar */}
        <TitleBar />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar currentView={currentView} onViewChange={handleViewChange} />

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {currentView === 'recorder' && (
                <motion.div
                  key="recorder"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="h-full"
                >
                  <Recorder
                    onSwitchToEditor={() => setCurrentView('editor')}
                    onSwitchToStreaming={() => setCurrentView('streaming')}
                  />
                </motion.div>
              )}

              {currentView === 'editor' && (
                <motion.div
                  key="editor"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="h-full"
                >
                  <Editor onSwitchToRecorder={() => setCurrentView('recorder')} />
                </motion.div>
              )}

              {currentView === 'streaming' && (
                <motion.div
                  key="streaming"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="h-full"
                >
                  <ModernStreamingInterface onSwitchToRecorder={() => setCurrentView('recorder')} />
                </motion.div>
              )}

              {currentView === 'settings' && (
                <motion.div
                  key="settings"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="h-full"
                >
                  <Settings onClose={() => setCurrentView('recorder')} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Smart Notifications */}
      <SmartNotifications
        notifications={notifications.notifications}
        onDismiss={notifications.removeNotification}
        position="top-right"
      />

      {/* Guided Tour */}
      <GuidedTour
        steps={tourType === 'streaming' ? streamingTourSteps : recordingTourSteps}
        isActive={showTour}
        onComplete={handleTourComplete}
        onSkip={handleTourComplete}
      />
    </ToastProvider>
  );
};
