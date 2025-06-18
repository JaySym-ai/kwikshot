import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Headphones, 
  Settings, 
  Plus, 
  Trash2, 
  Sliders,
  Zap,
  Filter,
  BarChart3,
  Waves,
  Music,
  Monitor
} from 'lucide-react';

interface AudioSource {
  id: string;
  name: string;
  type: 'microphone' | 'desktop' | 'application' | 'file';
  volume: number;
  muted: boolean;
  monitoring: boolean;
  filters: AudioFilter[];
  deviceId?: string;
}

interface AudioFilter {
  id: string;
  type: 'noise_gate' | 'compressor' | 'equalizer' | 'reverb' | 'echo';
  enabled: boolean;
  settings: Record<string, any>;
}

interface SmartAudioMixerProps {
  sources: AudioSource[];
  masterVolume: number;
  masterMuted: boolean;
  monitoring: boolean;
  audioLevels: { [sourceId: string]: { left: number; right: number } };
  onUpdateSource: (sourceId: string, updates: Partial<AudioSource>) => void;
  onAddSource: (source: Omit<AudioSource, 'id'>) => void;
  onRemoveSource: (sourceId: string) => void;
  onSetMasterVolume: (volume: number) => void;
  onSetMasterMute: (muted: boolean) => void;
  onSetMonitoring: (enabled: boolean) => void;
  onAddFilter: (sourceId: string, filter: Omit<AudioFilter, 'id'>) => void;
  onRemoveFilter: (sourceId: string, filterId: string) => void;
}

export const SmartAudioMixer: React.FC<SmartAudioMixerProps> = ({
  sources,
  masterVolume,
  masterMuted,
  monitoring,
  audioLevels,
  onUpdateSource,
  onAddSource,
  onRemoveSource,
  onSetMasterVolume,
  onSetMasterMute,
  onSetMonitoring,
  onAddFilter,
  onRemoveFilter
}) => {
  const [showAddSource, setShowAddSource] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [autoGainEnabled, setAutoGainEnabled] = useState(false);

  const sourceTypes = [
    { type: 'microphone', name: 'Microphone', icon: Mic, color: 'blue', description: 'Capture voice input' },
    { type: 'desktop', name: 'Desktop Audio', icon: Monitor, color: 'green', description: 'System sounds and music' },
    { type: 'application', name: 'Application Audio', icon: Settings, color: 'purple', description: 'Specific app audio' },
    { type: 'file', name: 'Audio File', icon: Music, color: 'orange', description: 'Play audio files' }
  ];

  const filterTypes = [
    { type: 'noise_gate', name: 'Noise Gate', icon: Filter, description: 'Remove background noise' },
    { type: 'compressor', name: 'Compressor', icon: Waves, description: 'Even out volume levels' },
    { type: 'equalizer', name: 'Equalizer', icon: Sliders, description: 'Adjust frequency response' },
    { type: 'reverb', name: 'Reverb', icon: Waves, description: 'Add spatial depth' },
    { type: 'echo', name: 'Echo', icon: Waves, description: 'Add echo effect' }
  ];

  const getVolumeColor = (volume: number) => {
    if (volume > 0.8) return 'bg-red-500';
    if (volume > 0.6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSourceIcon = (type: string) => {
    const sourceType = sourceTypes.find(st => st.type === type);
    return sourceType?.icon || Mic;
  };

  const getSourceColor = (type: string) => {
    const sourceType = sourceTypes.find(st => st.type === type);
    return sourceType?.color || 'gray';
  };

  const AudioLevelMeter: React.FC<{ levels: { left: number; right: number } }> = ({ levels }) => (
    <div className="flex space-x-1 h-20 items-end">
      {[levels.left, levels.right].map((level, index) => (
        <div key={index} className="w-3 bg-gray-700 rounded-sm relative overflow-hidden">
          <motion.div 
            className={`absolute bottom-0 w-full transition-all duration-100 ${getVolumeColor(level)}`}
            initial={{ height: 0 }}
            animate={{ height: `${level * 100}%` }}
          />
          {/* Peak indicators */}
          <div className="absolute inset-x-0 top-0 h-px bg-red-500 opacity-50" />
          <div className="absolute inset-x-0 top-4 h-px bg-yellow-500 opacity-30" />
        </div>
      ))}
    </div>
  );

  const VolumeSlider: React.FC<{ 
    value: number; 
    onChange: (value: number) => void; 
    muted: boolean;
    vertical?: boolean;
  }> = ({ value, onChange, muted, vertical = false }) => (
    <div className={`relative ${vertical ? 'h-32 w-6' : 'w-full h-6'}`}>
      <input
        type="range"
        min="0"
        max="100"
        value={value * 100}
        onChange={(e) => onChange(parseInt(e.target.value) / 100)}
        disabled={muted}
        className={`${vertical ? 'vertical-slider' : 'w-full'} ${muted ? 'opacity-50' : ''}`}
        style={vertical ? { 
          writingMode: 'bt-lr',
          WebkitAppearance: 'slider-vertical',
          width: '6px',
          height: '128px'
        } : {}}
      />
      <div className={`absolute ${vertical ? 'bottom-0 left-8' : 'top-8 left-0'} text-xs text-gray-400`}>
        {Math.round(value * 100)}%
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5" />
          <span>Smart Audio Mixer</span>
        </h3>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoGainEnabled(!autoGainEnabled)}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
              autoGainEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Auto Gain</span>
          </button>
          
          <button
            onClick={() => setShowAddSource(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Source</span>
          </button>
        </div>
      </div>

      {/* Master Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-6 border border-gray-600"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-medium flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-red-500" />
            <span>Master Output</span>
          </h4>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onSetMonitoring(!monitoring)}
              className={`p-2 rounded-lg transition-colors ${
                monitoring ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
            >
              <Headphones className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onSetMasterMute(!masterMuted)}
              className={`p-2 rounded-lg transition-colors ${
                masterMuted ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
            >
              {masterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex-1">
            <VolumeSlider
              value={masterVolume}
              onChange={onSetMasterVolume}
              muted={masterMuted}
            />
          </div>
          
          <AudioLevelMeter 
            levels={{ 
              left: masterMuted ? 0 : masterVolume * 0.8, 
              right: masterMuted ? 0 : masterVolume * 0.7 
            }} 
          />
        </div>
      </motion.div>

      {/* Audio Sources */}
      <div className="space-y-4">
        <h4 className="text-white font-medium">Audio Sources</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sources.map((source, index) => {
            const Icon = getSourceIcon(source.type);
            const levels = audioLevels[source.id] || { left: 0, right: 0 };
            
            return (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-5 h-5 text-${getSourceColor(source.type)}-500`} />
                    <span className="text-white font-medium text-sm">{source.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {source.filters.length > 0 && (
                      <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        {source.filters.length}
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedSourceId(source.id);
                        setShowFilters(true);
                      }}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onUpdateSource(source.id, { monitoring: !source.monitoring })}
                      className={`p-1 rounded ${
                        source.monitoring ? 'text-green-500' : 'text-gray-500'
                      }`}
                    >
                      <Headphones className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onUpdateSource(source.id, { muted: !source.muted })}
                      className={`p-1 rounded ${
                        source.muted ? 'text-red-500' : 'text-white'
                      }`}
                    >
                      {source.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => onRemoveSource(source.id)}
                      className="p-1 text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <VolumeSlider
                      value={source.volume}
                      onChange={(value) => onUpdateSource(source.id, { volume: value })}
                      muted={source.muted}
                    />
                  </div>
                  
                  <AudioLevelMeter levels={levels} />
                </div>

                {/* Active Filters */}
                {source.filters.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {source.filters.map((filter) => (
                      <div
                        key={filter.id}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                          filter.enabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        <span>{filter.type.replace('_', ' ')}</span>
                        <button
                          onClick={() => onRemoveFilter(source.id, filter.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {sources.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Mic className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No audio sources</p>
            <p className="text-sm">Add audio sources to start mixing</p>
          </div>
        )}
      </div>

      {/* Add Source Modal */}
      <AnimatePresence>
        {showAddSource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowAddSource(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-xl p-6 w-96"
            >
              <h3 className="text-white font-semibold mb-4">Add Audio Source</h3>
              <div className="space-y-3">
                {sourceTypes.map((sourceType) => {
                  const Icon = sourceType.icon;
                  return (
                    <button
                      key={sourceType.type}
                      onClick={() => {
                        onAddSource({
                          type: sourceType.type as any,
                          name: sourceType.name,
                          volume: 1.0,
                          muted: false,
                          monitoring: false,
                          filters: []
                        });
                        setShowAddSource(false);
                      }}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg flex items-center space-x-3 transition-colors"
                    >
                      <Icon className={`w-6 h-6 text-${sourceType.color}-500`} />
                      <div className="text-left">
                        <div className="font-medium">{sourceType.name}</div>
                        <div className="text-sm text-gray-400">{sourceType.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Modal */}
      <AnimatePresence>
        {showFilters && selectedSourceId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-xl p-6 w-96 max-h-96 overflow-y-auto"
            >
              <h3 className="text-white font-semibold mb-4">Add Audio Filter</h3>
              <div className="space-y-3">
                {filterTypes.map((filterType) => {
                  const Icon = filterType.icon;
                  return (
                    <button
                      key={filterType.type}
                      onClick={() => {
                        onAddFilter(selectedSourceId, {
                          type: filterType.type as any,
                          enabled: true,
                          settings: {}
                        });
                        setShowFilters(false);
                        setSelectedSourceId(null);
                      }}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg flex items-center space-x-3 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-blue-500" />
                      <div className="text-left">
                        <div className="font-medium">{filterType.name}</div>
                        <div className="text-sm text-gray-400">{filterType.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
