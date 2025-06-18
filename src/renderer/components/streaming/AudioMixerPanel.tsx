import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Headphones, Settings, Plus, Trash2, Sliders } from 'lucide-react';
import { AudioSource, AudioFilter, AudioMixer } from '../../../shared/streaming-types';

interface AudioMixerPanelProps {
  mixer: AudioMixer;
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

export const AudioMixerPanel: React.FC<AudioMixerPanelProps> = ({
  mixer,
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

  const handleVolumeChange = (sourceId: string, volume: number) => {
    onUpdateSource(sourceId, { volume: volume / 100 });
  };

  const handleMuteToggle = (sourceId: string, currentMuted: boolean) => {
    onUpdateSource(sourceId, { muted: !currentMuted });
  };

  const handleMonitoringToggle = (sourceId: string, currentMonitoring: boolean) => {
    onUpdateSource(sourceId, { monitoring: !currentMonitoring });
  };

  const getVolumeColor = (volume: number) => {
    if (volume > 0.8) return 'bg-red-500';
    if (volume > 0.6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const AudioLevelMeter: React.FC<{ levels: { left: number; right: number } }> = ({ levels }) => (
    <div className="flex space-x-1 h-16 items-end">
      <div className="w-2 bg-gray-700 rounded-sm relative overflow-hidden">
        <div 
          className={`absolute bottom-0 w-full transition-all duration-100 ${getVolumeColor(levels.left)}`}
          style={{ height: `${levels.left * 100}%` }}
        />
      </div>
      <div className="w-2 bg-gray-700 rounded-sm relative overflow-hidden">
        <div 
          className={`absolute bottom-0 w-full transition-all duration-100 ${getVolumeColor(levels.right)}`}
          style={{ height: `${levels.right * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Audio Mixer</h3>
        <button
          onClick={() => setShowAddSource(true)}
          className="btn-secondary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Source</span>
        </button>
      </div>

      {/* Master Controls */}
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-medium">Master</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSetMonitoring(!mixer.monitoring)}
              className={`p-2 rounded ${mixer.monitoring ? 'text-green-500' : 'text-gray-500'}`}
            >
              <Headphones className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSetMasterMute(!mixer.masterMuted)}
              className={`p-2 rounded ${mixer.masterMuted ? 'text-red-500' : 'text-white'}`}
            >
              {mixer.masterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={mixer.masterVolume * 100}
              onChange={(e) => onSetMasterVolume(parseInt(e.target.value) / 100)}
              className="w-full"
              disabled={mixer.masterMuted}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span>{Math.round(mixer.masterVolume * 100)}%</span>
              <span>100%</span>
            </div>
          </div>
          <AudioLevelMeter levels={{ left: mixer.masterMuted ? 0 : mixer.masterVolume, right: mixer.masterMuted ? 0 : mixer.masterVolume }} />
        </div>
      </div>

      {/* Audio Sources */}
      <div className="space-y-4">
        {mixer.sources.map((source) => (
          <div key={source.id} className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {source.type === 'microphone' && <Mic className="w-4 h-4 text-blue-500" />}
                  {source.type === 'desktop' && <Volume2 className="w-4 h-4 text-green-500" />}
                  {source.type === 'application' && <Settings className="w-4 h-4 text-purple-500" />}
                  {source.type === 'file' && <Volume2 className="w-4 h-4 text-orange-500" />}
                  <span className="text-white font-medium">{source.name}</span>
                </div>
                {source.filters.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    {source.filters.length} filters
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedSourceId(source.id);
                    setShowFilters(true);
                  }}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <Sliders className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMonitoringToggle(source.id, source.monitoring)}
                  className={`p-2 rounded ${source.monitoring ? 'text-green-500' : 'text-gray-500'}`}
                >
                  <Headphones className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMuteToggle(source.id, source.muted)}
                  className={`p-2 rounded ${source.muted ? 'text-red-500' : 'text-white'}`}
                >
                  {source.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onRemoveSource(source.id)}
                  className="p-2 text-red-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={source.volume * 100}
                  onChange={(e) => handleVolumeChange(source.id, parseInt(e.target.value))}
                  className="w-full"
                  disabled={source.muted}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span>
                  <span>{Math.round(source.volume * 100)}%</span>
                  <span>100%</span>
                </div>
              </div>
              <AudioLevelMeter levels={audioLevels[source.id] || { left: 0, right: 0 }} />
            </div>

            {/* Active Filters */}
            {source.filters.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {source.filters.map((filter) => (
                  <div
                    key={filter.id}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
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
          </div>
        ))}

        {mixer.sources.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Volume2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No audio sources</p>
            <p className="text-sm">Add audio sources to start mixing</p>
          </div>
        )}
      </div>

      {/* Add Source Dialog */}
      {showAddSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-white font-semibold mb-4">Add Audio Source</h3>
            <div className="space-y-3">
              {[
                { type: 'microphone', name: 'Microphone', icon: <Mic className="w-5 h-5" /> },
                { type: 'desktop', name: 'Desktop Audio', icon: <Volume2 className="w-5 h-5" /> },
                { type: 'application', name: 'Application Audio', icon: <Settings className="w-5 h-5" /> },
                { type: 'file', name: 'Audio File', icon: <Volume2 className="w-5 h-5" /> }
              ].map((sourceType) => (
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
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white p-3 rounded flex items-center space-x-3"
                >
                  {sourceType.icon}
                  <span>{sourceType.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddSource(false)}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters Dialog */}
      {showFilters && selectedSourceId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-white font-semibold mb-4">Audio Filters</h3>
            <div className="space-y-3">
              {[
                { type: 'noise_gate', name: 'Noise Gate' },
                { type: 'compressor', name: 'Compressor' },
                { type: 'equalizer', name: 'Equalizer' },
                { type: 'reverb', name: 'Reverb' },
                { type: 'echo', name: 'Echo' }
              ].map((filterType) => (
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
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white p-3 rounded text-left"
                >
                  {filterType.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowFilters(false);
                setSelectedSourceId(null);
              }}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
