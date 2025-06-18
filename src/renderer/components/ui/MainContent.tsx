import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Recorder } from '../recorder/Recorder';
import { Editor } from '../editor/Editor';
import { Settings } from '../settings/Settings';
import { ModernStreamingInterface } from '../streaming/ModernStreamingInterface';
import { PageTransition } from './PageTransition';

export type AppView = 'recorder' | 'editor' | 'streaming' | 'settings';

interface MainContentProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  currentView, 
  onViewChange 
}) => {
  const renderCurrentView = () => {
    switch (currentView) {
      case 'recorder':
        return (
          <PageTransition pageKey="recorder">
            <Recorder
              onSwitchToEditor={() => onViewChange('editor')}
              onSwitchToStreaming={() => onViewChange('streaming')}
            />
          </PageTransition>
        );
      
      case 'editor':
        return (
          <PageTransition pageKey="editor">
            <Editor onSwitchToRecorder={() => onViewChange('recorder')} />
          </PageTransition>
        );
      
      case 'streaming':
        return (
          <PageTransition pageKey="streaming">
            <ModernStreamingInterface onSwitchToRecorder={() => onViewChange('recorder')} />
          </PageTransition>
        );
      
      case 'settings':
        return (
          <PageTransition pageKey="settings">
            <Settings onClose={() => onViewChange('recorder')} />
          </PageTransition>
        );
      
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        {renderCurrentView()}
      </AnimatePresence>
    </main>
  );
};
