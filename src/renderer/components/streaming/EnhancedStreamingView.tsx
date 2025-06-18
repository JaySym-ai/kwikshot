import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, Monitor, Settings, Activity, Users, Layers, Mic2, BarChart3, Wifi } from 'lucide-react';
import { useStreamingStore } from '../../stores/streaming-store';
import { StreamSetup } from './StreamSetup';
import { StreamControls } from './StreamControls';
import { StreamStatus } from './StreamStatus';
import { StreamMonitoringDashboard } from './StreamMonitoringDashboard';
import { SceneManager } from './SceneManager';
import { AudioMixerPanel } from './AudioMixerPanel';
import { Scene, StreamSource, AudioSource, AudioFilter, NetworkStats, HardwareCapabilities } from '../../../shared/streaming-types';

interface EnhancedStreamingViewProps {
  onSwitchToRecorder: () => void;
}

export const EnhancedStreamingView: React.FC<EnhancedStreamingViewProps> = ({ onSwitchToRecorder }) => {
  const [showSetup, setShowSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<'stream' | 'scenes' | 'audio' | 'monitoring'>('stream');
  const [sources, setSources] = useState<Electron.DesktopCapturerSource[]>([]);
  
  // Enhanced state
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [audioMixer, setAudioMixer] = useState<any>(null);
  const [audioLevels, setAudioLevels] = useState<any>({});
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [hardwareCapabilities, setHardwareCapabilities] = useState<HardwareCapabilities | null>(null);
  
  const {
    isStreaming,
    isPaused,
    isConnecting,
    platform,
    config,
    error,
    metrics,
    startStream,
    stopStream,
    pauseStream,
    resumeStream,
    reset
  } = useStreamingStore();

  useEffect(() => {
    loadSources();
    loadEnhancedData();
    
    // Set up streaming event listeners
    if (window.electronAPI?.onStreamMetricsUpdate) {
      window.electronAPI.onStreamMetricsUpdate((newMetrics) => {
        useStreamingStore.getState().setMetrics(newMetrics);
      });
    }
    
    if (window.electronAPI?.onStreamError) {
      window.electronAPI.onStreamError((errorMessage) => {
        useStreamingStore.getState().setError(errorMessage);
      });
    }

    // Set up real-time data updates
    const interval = setInterval(() => {
      updateRealtimeData();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadSources = async () => {
    try {
      const availableSources = await window.electronAPI?.getSources();
      setSources(availableSources || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
  };

  const loadEnhancedData = async () => {
    try {
      // Load scenes
      const scenesData = await window.electronAPI?.getScenes?.();
      setScenes(scenesData || []);

      // Load audio mixer state
      const mixerData = await window.electronAPI?.getMixerState?.();
      setAudioMixer(mixerData);

      // Load hardware capabilities
      const hwCapabilities = await window.electronAPI?.getHardwareCapabilities?.();
      setHardwareCapabilities(hwCapabilities);
    } catch (error) {
      console.error('Failed to load enhanced data:', error);
    }
  };

  const updateRealtimeData = async () => {
    try {
      // Update network stats
      const netStats = await window.electronAPI?.getNetworkStats?.();
      setNetworkStats(netStats);

      // Update audio levels
      const levels = await window.electronAPI?.getAudioLevels?.();
      setAudioLevels(levels || {});
    } catch (error) {
      console.error('Failed to update realtime data:', error);
    }
  };

  const handleStartStream = async () => {
    if (!platform || !config) {
      setShowSetup(true);
      return;
    }
    await startStream();
  };

  const handleStopStream = async () => {
    await stopStream();
  };

  const handlePauseStream = async () => {
    if (isPaused) {
      await resumeStream();
    } else {
      await pauseStream();
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
  };

  // Scene management handlers
  const handleCreateScene = async (name: string) => {
    try {
      const newScene = await window.electronAPI?.createScene?.(name);
      if (newScene) {
        setScenes(prev => [...prev, newScene]);
      }
    } catch (error) {
      console.error('Failed to create scene:', error);
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    try {
      const success = await window.electronAPI?.deleteScene?.(sceneId);
      if (success) {
        setScenes(prev => prev.filter(scene => scene.id !== sceneId));
      }
    } catch (error) {
      console.error('Failed to delete scene:', error);
    }
  };

  const handleSwitchScene = async (sceneId: string, transition?: any) => {
    try {
      await window.electronAPI?.switchScene?.(sceneId, transition);
      setScenes(prev => prev.map(scene => ({
        ...scene,
        isActive: scene.id === sceneId
      })));
    } catch (error) {
      console.error('Failed to switch scene:', error);
    }
  };

  const handleRenameScene = async (sceneId: string, newName: string) => {
    try {
      const success = await window.electronAPI?.renameScene?.(sceneId, newName);
      if (success) {
        setScenes(prev => prev.map(scene => 
          scene.id === sceneId ? { ...scene, name: newName } : scene
        ));
      }
    } catch (error) {
      console.error('Failed to rename scene:', error);
    }
  };

  const handleDuplicateScene = async (sceneId: string) => {
    try {
      const newScene = await window.electronAPI?.duplicateScene?.(sceneId);
      if (newScene) {
        setScenes(prev => [...prev, newScene]);
      }
    } catch (error) {
      console.error('Failed to duplicate scene:', error);
    }
  };

  const handleAddSource = async (sceneId: string, source: Omit<StreamSource, 'id'>) => {
    try {
      const newSource = await window.electronAPI?.addSourceToScene?.(sceneId, source);
      if (newSource) {
        setScenes(prev => prev.map(scene => 
          scene.id === sceneId 
            ? { ...scene, sources: [...scene.sources, newSource] }
            : scene
        ));
      }
    } catch (error) {
      console.error('Failed to add source:', error);
    }
  };

  const handleRemoveSource = async (sceneId: string, sourceId: string) => {
    try {
      const success = await window.electronAPI?.removeSourceFromScene?.(sceneId, sourceId);
      if (success) {
        setScenes(prev => prev.map(scene => 
          scene.id === sceneId 
            ? { ...scene, sources: scene.sources.filter(s => s.id !== sourceId) }
            : scene
        ));
      }
    } catch (error) {
      console.error('Failed to remove source:', error);
    }
  };

  const handleUpdateSource = async (sceneId: string, sourceId: string, updates: Partial<StreamSource>) => {
    try {
      const success = await window.electronAPI?.updateSource?.(sceneId, sourceId, updates);
      if (success) {
        setScenes(prev => prev.map(scene => 
          scene.id === sceneId 
            ? { 
                ...scene, 
                sources: scene.sources.map(s => 
                  s.id === sourceId ? { ...s, ...updates } : s
                )
              }
            : scene
        ));
      }
    } catch (error) {
      console.error('Failed to update source:', error);
    }
  };

  // Audio mixer handlers
  const handleUpdateAudioSource = async (sourceId: string, updates: Partial<AudioSource>) => {
    try {
      const success = await window.electronAPI?.updateAudioSource?.(sourceId, updates);
      if (success && audioMixer) {
        setAudioMixer({
          ...audioMixer,
          sources: audioMixer.sources.map((s: AudioSource) => 
            s.id === sourceId ? { ...s, ...updates } : s
          )
        });
      }
    } catch (error) {
      console.error('Failed to update audio source:', error);
    }
  };

  const handleAddAudioSource = async (source: Omit<AudioSource, 'id'>) => {
    try {
      const newSource = await window.electronAPI?.addAudioSource?.(source);
      if (newSource && audioMixer) {
        setAudioMixer({
          ...audioMixer,
          sources: [...audioMixer.sources, newSource]
        });
      }
    } catch (error) {
      console.error('Failed to add audio source:', error);
    }
  };

  const handleRemoveAudioSource = async (sourceId: string) => {
    try {
      const success = await window.electronAPI?.removeAudioSource?.(sourceId);
      if (success && audioMixer) {
        setAudioMixer({
          ...audioMixer,
          sources: audioMixer.sources.filter((s: AudioSource) => s.id !== sourceId)
        });
      }
    } catch (error) {
      console.error('Failed to remove audio source:', error);
    }
  };

  const handleSetMasterVolume = async (volume: number) => {
    try {
      await window.electronAPI?.setMasterVolume?.(volume);
      if (audioMixer) {
        setAudioMixer({ ...audioMixer, masterVolume: volume });
      }
    } catch (error) {
      console.error('Failed to set master volume:', error);
    }
  };

  const handleSetMasterMute = async (muted: boolean) => {
    try {
      await window.electronAPI?.setMasterMute?.(muted);
      if (audioMixer) {
        setAudioMixer({ ...audioMixer, masterMuted: muted });
      }
    } catch (error) {
      console.error('Failed to set master mute:', error);
    }
  };

  const handleSetMonitoring = async (enabled: boolean) => {
    try {
      await window.electronAPI?.setMonitoring?.(enabled);
      if (audioMixer) {
        setAudioMixer({ ...audioMixer, monitoring: enabled });
      }
    } catch (error) {
      console.error('Failed to set monitoring:', error);
    }
  };

  const handleAddFilter = async (sourceId: string, filter: Omit<AudioFilter, 'id'>) => {
    try {
      const newFilter = await window.electronAPI?.addAudioFilter?.(sourceId, filter);
      if (newFilter && audioMixer) {
        setAudioMixer({
          ...audioMixer,
          sources: audioMixer.sources.map((s: AudioSource) => 
            s.id === sourceId 
              ? { ...s, filters: [...s.filters, newFilter] }
              : s
          )
        });
      }
    } catch (error) {
      console.error('Failed to add filter:', error);
    }
  };

  const handleRemoveFilter = async (sourceId: string, filterId: string) => {
    try {
      const success = await window.electronAPI?.removeAudioFilter?.(sourceId, filterId);
      if (success && audioMixer) {
        setAudioMixer({
          ...audioMixer,
          sources: audioMixer.sources.map((s: AudioSource) => 
            s.id === sourceId 
              ? { ...s, filters: s.filters.filter(f => f.id !== filterId) }
              : s
          )
        });
      }
    } catch (error) {
      console.error('Failed to remove filter:', error);
    }
  };

  const isConfigured = platform && config;
  const activeSceneId = scenes.find(scene => scene.isActive)?.id || null;

  const tabs = [
    { id: 'stream', name: 'Stream', icon: Radio },
    { id: 'scenes', name: 'Scenes', icon: Layers },
    { id: 'audio', name: 'Audio', icon: Mic2 },
    { id: 'monitoring', name: 'Monitoring', icon: BarChart3 }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center space-x-3">
              <Radio className="text-red-500" size={28} />
              <span>Enhanced Live Streaming</span>
              {isStreaming && (
                <div className="flex items-center space-x-2 ml-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-500 font-medium">LIVE</span>
                </div>
              )}
            </h1>
            <p className="text-gray-400">Professional streaming with advanced features</p>
          </div>
          <div className="flex items-center space-x-4">
            {networkStats && (
              <div className="flex items-center space-x-2 text-sm">
                <Wifi className="w-4 h-4" />
                <span className="text-gray-400">
                  {networkStats.uploadSpeed.toFixed(1)} Mbps ↑
                </span>
              </div>
            )}
            <button
              onClick={onSwitchToRecorder}
              className="btn-secondary flex items-center space-x-2"
            >
              <Monitor size={20} />
              <span>Back to Recorder</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg"
            >
              <div className="flex items-center space-x-2 text-red-400">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {/* Tab Content */}
          {activeTab === 'stream' && (
            <div className="space-y-6">
              {/* Stream Status */}
              {isStreaming && (
                <StreamStatus metrics={metrics} platform={platform} />
              )}
              
              {/* Stream Controls */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Stream Controls</h2>
                  {!isStreaming && (
                    <button
                      onClick={() => setShowSetup(true)}
                      className="btn-ghost flex items-center space-x-2"
                    >
                      <Settings size={16} />
                      <span>Configure Stream</span>
                    </button>
                  )}
                </div>
                
                <StreamControls
                  isStreaming={isStreaming}
                  isPaused={isPaused}
                  isConnecting={isConnecting}
                  isConfigured={isConfigured}
                  platform={platform}
                  onStart={handleStartStream}
                  onStop={handleStopStream}
                  onPause={handlePauseStream}
                  onConfigure={() => setShowSetup(true)}
                />
              </div>
            </div>
          )}

          {activeTab === 'scenes' && (
            <SceneManager
              scenes={scenes}
              activeSceneId={activeSceneId}
              onCreateScene={handleCreateScene}
              onDeleteScene={handleDeleteScene}
              onSwitchScene={handleSwitchScene}
              onRenameScene={handleRenameScene}
              onDuplicateScene={handleDuplicateScene}
              onAddSource={handleAddSource}
              onRemoveSource={handleRemoveSource}
              onUpdateSource={handleUpdateSource}
            />
          )}

          {activeTab === 'audio' && audioMixer && (
            <AudioMixerPanel
              mixer={audioMixer}
              audioLevels={audioLevels}
              onUpdateSource={handleUpdateAudioSource}
              onAddSource={handleAddAudioSource}
              onRemoveSource={handleRemoveAudioSource}
              onSetMasterVolume={handleSetMasterVolume}
              onSetMasterMute={handleSetMasterMute}
              onSetMonitoring={handleSetMonitoring}
              onAddFilter={handleAddFilter}
              onRemoveFilter={handleRemoveFilter}
            />
          )}

          {activeTab === 'monitoring' && (
            <StreamMonitoringDashboard
              metrics={metrics}
              networkStats={networkStats}
              hardwareCapabilities={hardwareCapabilities}
              isStreaming={isStreaming}
            />
          )}
        </div>
      </div>

      {/* Stream Setup Modal */}
      {showSetup && (
        <StreamSetup
          onClose={() => setShowSetup(false)}
          onComplete={handleSetupComplete}
        />
      )}
    </div>
  );
};
