import React, { useState } from 'react';
import { TitleBar } from './components/ui/TitleBar';
import { Sidebar } from './components/ui/Sidebar';
import { MainContent, AppView } from './components/ui/MainContent';
import { ToastProvider } from './contexts/ToastContext';
import { GuidedTour, streamingTourSteps, recordingTourSteps } from './components/common/GuidedTour';
import { SmartNotifications, createStreamNotifications } from './components/common/SmartNotifications';
import { useTourManager } from './hooks/useTourManager';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('recorder');
  const {
    showTour,
    tourType,
    handleTourComplete,
    handleViewChange: handleTourViewChange,
    notifications
  } = useTourManager();
  const streamNotifications = createStreamNotifications(notifications);

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    handleTourViewChange(view);
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
          <MainContent currentView={currentView} onViewChange={handleViewChange} />
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
