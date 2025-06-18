import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Monitor, 
  Settings, 
  Activity, 
  Users, 
  Layers, 
  Mic2, 
  BarChart3, 
  Wifi,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { StreamingSetupWizard } from './StreamingSetupWizard';
import { ModernStreamDashboard } from './ModernStreamDashboard';
import { SceneBuilder } from './SceneBuilder';
import { SmartAudioMixer } from './SmartAudioMixer';
import { StreamMonitoringDashboard } from './StreamMonitoringDashboard';
import { OverlayManager } from './OverlayManager';

interface ModernStreamingInterfaceProps {
  onSwitchToRecorder: () => void;
}

export const ModernStreamingInterface: React.FC<ModernStreamingInterfaceProps> = ({ 
  onSwitchToRecorder 
}) => {
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scenes' | 'audio' | 'monitoring' | 'overlays'>('dashboard');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // Mock state - in real app this would come from stores
  const [streamingState, setStreamingState] = useState({
    isStreaming: false,
    isPaused: false,
    isConnecting: false,
    isConfigured: false,
    platform: null,
    metrics: {
      uptime: 0,
      viewerCount: 0,
      bitrate: 0,
      fps: 0,
      droppedFrames: 0,
      cpuUsage: 45,
      gpuUsage: 32,
      connectionQuality: 'excellent'
    },
    networkStats: {
      uploadSpeed: 12.5,
      latency: 25,
      packetLoss: 0.1,
      connectionQuality: 'excellent'
    }
  });

  const [scenes, setScenes] = useState([]);
  const [audioSources, setAudioSources] = useState([]);
  const [overlays, setOverlays] = useState([]);

  useEffect(() => {
    // Check if user has completed setup before
    const hasCompletedSetup = localStorage.getItem('streaming-setup-completed');
    if (!hasCompletedSetup) {
      setShowSetupWizard(true);
    } else {
      setIsFirstTime(false);
    }

    // Simulate metrics updates
    const interval = setInterval(() => {
      if (streamingState.isStreaming) {
        setStreamingState(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            uptime: prev.metrics.uptime + 1,
            viewerCount: Math.max(0, prev.metrics.viewerCount + Math.floor(Math.random() * 3) - 1),
            bitrate: 4500 + Math.floor(Math.random() * 1000),
            fps: 30 + Math.floor(Math.random() * 5),
            cpuUsage: Math.max(20, Math.min(80, prev.metrics.cpuUsage + Math.floor(Math.random() * 10) - 5)),
            gpuUsage: Math.max(10, Math.min(70, prev.metrics.gpuUsage + Math.floor(Math.random() * 8) - 4))
          }
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [streamingState.isStreaming]);

  const handleSetupComplete = (config: any) => {
    console.log('Setup completed with config:', config);
    localStorage.setItem('streaming-setup-completed', 'true');
    setStreamingState(prev => ({ ...prev, isConfigured: true, platform: config.platform }));
    setShowSetupWizard(false);
    setIsFirstTime(false);
  };

  const handleStartStream = () => {
    if (!streamingState.isConfigured) {
      setShowSetupWizard(true);
      return;
    }
    
    setStreamingState(prev => ({ ...prev, isConnecting: true }));
    
    // Simulate connection process
    setTimeout(() => {
      setStreamingState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        isStreaming: true,
        metrics: { ...prev.metrics, uptime: 0, viewerCount: 1 }
      }));
    }, 2000);
  };

  const handleStopStream = () => {
    setStreamingState(prev => ({ 
      ...prev, 
      isStreaming: false, 
      isPaused: false,
      metrics: { ...prev.metrics, uptime: 0, viewerCount: 0 }
    }));
  };

  const handlePauseStream = () => {
    setStreamingState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: Radio, description: 'Stream controls and status' },
    { id: 'scenes', name: 'Scenes', icon: Layers, description: 'Manage scenes and sources' },
    { id: 'audio', name: 'Audio', icon: Mic2, description: 'Audio mixing and effects' },
    { id: 'monitoring', name: 'Analytics', icon: BarChart3, description: 'Performance monitoring' },
    { id: 'overlays', name: 'Overlays', icon: Monitor, description: 'Stream overlays and graphics' }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Live Streaming Studio</h1>
                <p className="text-gray-400">Professional streaming made simple</p>
              </div>
            </div>

            {streamingState.isStreaming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-2 bg-red-600/20 border border-red-500/30 rounded-lg px-4 py-2"
              >
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 font-medium">LIVE</span>
                <span className="text-gray-400">•</span>
                <span className="text-white">{streamingState.metrics.viewerCount} viewers</span>
              </motion.div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Network Status */}
            <div className="flex items-center space-x-2 text-sm">
              <Wifi className={`w-4 h-4 ${
                streamingState.networkStats.connectionQuality === 'excellent' ? 'text-green-500' :
                streamingState.networkStats.connectionQuality === 'good' ? 'text-blue-500' :
                streamingState.networkStats.connectionQuality === 'fair' ? 'text-yellow-500' : 'text-red-500'
              }`} />
              <span className="text-gray-400">
                {streamingState.networkStats.uploadSpeed.toFixed(1)} Mbps
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-gray-300" />
              </button>
              
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4 text-gray-300" /> : <Minimize2 className="w-4 h-4 text-gray-300" />}
              </button>

              <button
                onClick={onSwitchToRecorder}
                className="btn-secondary flex items-center space-x-2"
              >
                <Monitor className="w-4 h-4" />
                <span>Recorder</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex space-x-1 mt-6"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.name}</span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </motion.div>

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
                      onStart={handleStartStream}
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
            onComplete={handleSetupComplete}
            onClose={() => setShowSetupWizard(false)}
          />
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-xl p-6 w-96 max-h-96 overflow-y-auto"
            >
              <h3 className="text-white font-semibold mb-4">Quick Help</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div>
                  <h4 className="font-medium text-white">Getting Started</h4>
                  <p>Use the setup wizard to configure your streaming platform and settings.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Dashboard</h4>
                  <p>Control your stream, view status, and monitor performance.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Scenes</h4>
                  <p>Create and manage different scenes with various sources.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Audio</h4>
                  <p>Mix audio sources and apply professional effects.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Analytics</h4>
                  <p>Monitor stream performance and network quality.</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
