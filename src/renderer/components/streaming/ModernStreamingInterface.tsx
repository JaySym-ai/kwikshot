import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamingSetupWizard } from './StreamingSetupWizard';
import { ModernStreamDashboard } from './ModernStreamDashboard';
import { SceneBuilder } from './SceneBuilder';
import { SmartAudioMixer } from './SmartAudioMixer';
import { StreamMonitoringDashboard } from './StreamMonitoringDashboard';
import { OverlayManager } from './OverlayManager';
import { StreamingHeader } from './StreamingHeader';
import { StreamingTabNavigation, StreamingTab } from './StreamingTabNavigation';
import { HelpModal } from './HelpModal';
import { useStreamingManager } from '../../hooks/useStreamingManager';

interface ModernStreamingInterfaceProps {
  onSwitchToRecorder: () => void;
}

export const ModernStreamingInterface: React.FC<ModernStreamingInterfaceProps> = ({
  onSwitchToRecorder
}) => {
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<StreamingTab>('dashboard');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const {
    streamingState,
    scenes,
    setScenes,
    audioSources,
    setAudioSources,
    overlays,
    setOverlays,
    isFirstTime,
    handleSetupComplete,
    handleStartStream,
    handleStopStream,
    handlePauseStream
  } = useStreamingManager();

  // Show setup wizard if first time
  React.useEffect(() => {
    if (isFirstTime) {
      setShowSetupWizard(true);
    }
  }, [isFirstTime]);

  const onSetupComplete = (config: any) => {
    handleSetupComplete(config);
    setShowSetupWizard(false);
  };

  const onStartStream = () => {
    const success = handleStartStream();
    if (!success) {
      setShowSetupWizard(true);
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', description: 'Stream controls and status' },
    { id: 'scenes', name: 'Scenes', description: 'Manage scenes and sources' },
    { id: 'audio', name: 'Audio', description: 'Audio mixing and effects' },
    { id: 'monitoring', name: 'Analytics', description: 'Performance monitoring' },
    { id: 'overlays', name: 'Overlays', description: 'Stream overlays and graphics' }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <StreamingHeader
        streamingState={streamingState}
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
        onShowHelp={() => setShowHelp(true)}
        onSwitchToRecorder={onSwitchToRecorder}
      />

      {/* Tab Navigation */}
      <StreamingTabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMinimized={isMinimized}
      />

      {/* Main Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {/* Tab Description */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-1">
                    {currentTab?.name}
                  </h2>
                  <p className="text-gray-400">{currentTab?.description}</p>
                </div>

                {/* Tab Content */}
                <div className="h-full overflow-y-auto">
                  {activeTab === 'dashboard' && (
                    <ModernStreamDashboard
                      isStreaming={streamingState.isStreaming}
                      isPaused={streamingState.isPaused}
                      isConnecting={streamingState.isConnecting}
                      metrics={streamingState.metrics}
                      networkStats={streamingState.networkStats}
                      onStart={onStartStream}
                      onStop={handleStopStream}
                      onPause={handlePauseStream}
                      onSettings={() => setShowSetupWizard(true)}
                    />
                  )}

                  {activeTab === 'scenes' && (
                    <SceneBuilder
                      sources={scenes}
                      onUpdateSource={(sourceId, updates) => {
                        setScenes(prev => prev.map((s: any) => 
                          s.id === sourceId ? { ...s, ...updates } : s
                        ));
                      }}
                      onAddSource={(source) => {
                        const newSource = { ...source, id: `source_${Date.now()}` };
                        setScenes(prev => [...prev, newSource]);
                      }}
                      onRemoveSource={(sourceId) => {
                        setScenes(prev => prev.filter((s: any) => s.id !== sourceId));
                      }}
                      onDuplicateSource={(sourceId) => {
                        const source = scenes.find((s: any) => s.id === sourceId);
                        if (source) {
                          const newSource = { 
                            ...(source as any), 
                            id: `source_${Date.now()}`,
                            name: `${(source as any).name} (Copy)`,
                            position: { 
                              x: (source as any).position.x + 20, 
                              y: (source as any).position.y + 20 
                            }
                          };
                          setScenes(prev => [...prev, newSource]);
                        }
                      }}
                    />
                  )}

                  {activeTab === 'audio' && (
                    <SmartAudioMixer
                      sources={audioSources}
                      masterVolume={0.8}
                      masterMuted={false}
                      monitoring={false}
                      audioLevels={{}}
                      onUpdateSource={(sourceId, updates) => {
                        setAudioSources(prev => prev.map((s: any) => 
                          s.id === sourceId ? { ...s, ...updates } : s
                        ));
                      }}
                      onAddSource={(source) => {
                        const newSource = { ...source, id: `audio_${Date.now()}` };
                        setAudioSources(prev => [...prev, newSource]);
                      }}
                      onRemoveSource={(sourceId) => {
                        setAudioSources(prev => prev.filter((s: any) => s.id !== sourceId));
                      }}
                      onSetMasterVolume={() => {}}
                      onSetMasterMute={() => {}}
                      onSetMonitoring={() => {}}
                      onAddFilter={() => {}}
                      onRemoveFilter={() => {}}
                    />
                  )}

                  {activeTab === 'monitoring' && (
                    <StreamMonitoringDashboard
                      metrics={streamingState.metrics}
                      networkStats={streamingState.networkStats}
                      hardwareCapabilities={null}
                      isStreaming={streamingState.isStreaming}
                    />
                  )}

                  {activeTab === 'overlays' && (
                    <OverlayManager
                      overlays={overlays}
                      onCreateOverlay={(overlay) => {
                        const newOverlay = { ...overlay, id: `overlay_${Date.now()}` };
                        setOverlays(prev => [...prev, newOverlay]);
                      }}
                      onUpdateOverlay={(overlayId, updates) => {
                        setOverlays(prev => prev.map((o: any) => 
                          o.id === overlayId ? { ...o, ...updates } : o
                        ));
                      }}
                      onDeleteOverlay={(overlayId) => {
                        setOverlays(prev => prev.filter((o: any) => o.id !== overlayId));
                      }}
                      onReorderOverlays={(overlayIds) => {
                        const reordered = overlayIds.map(id => 
                          overlays.find((o: any) => o.id === id)
                        ).filter(Boolean);
                        setOverlays(reordered);
                      }}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Setup Wizard */}
      <AnimatePresence>
        {showSetupWizard && (
          <StreamingSetupWizard
            onComplete={onSetupComplete}
            onClose={() => setShowSetupWizard(false)}
          />
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};
