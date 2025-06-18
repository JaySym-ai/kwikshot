// Properties Panel Component - Context-sensitive properties editor
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Video,
  Music,
  Palette,
  Sliders,
  Eye,
  Volume2,
  RotateCw,
  Move,
  Crop,
  Filter,
  Layers,
  Clock,
  Download
} from 'lucide-react';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';

interface PropertiesPanelProps {
  className?: string;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'project' | 'clip' | 'track' | 'export'>('project');

  const {
    currentProject,
    selection,
    updateClip,
    updateTrack,
    exportSettings
  } = useVideoEditorStore();

  // Get selected clip data
  const selectedClip = currentProject?.tracks
    .flatMap(track => track.clips)
    .find(clip => selection.clips.includes(clip.id));

  // Get selected track data
  const selectedTrack = currentProject?.tracks
    .find(track => selection.tracks.includes(track.id));

  const tabs = [
    { id: 'project', label: 'Project', icon: Settings },
    { id: 'clip', label: 'Clip', icon: Video, disabled: !selectedClip },
    { id: 'track', label: 'Track', icon: Layers, disabled: !selectedTrack },
    { id: 'export', label: 'Export', icon: Download }
  ] as const;

  const renderProjectProperties = () => (
    <div className="space-y-6">
      <div className="card p-4">
        <h4 className="font-medium mb-3 flex items-center">
          <Video size={16} className="mr-2" />
          Video Settings
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Resolution</label>
            <select className="input text-sm">
              <option value="1920x1080">1920x1080 (Full HD)</option>
              <option value="1280x720">1280x720 (HD)</option>
              <option value="2560x1440">2560x1440 (2K)</option>
              <option value="3840x2160">3840x2160 (4K)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Frame Rate</label>
            <select className="input text-sm">
              <option value="24">24 FPS</option>
              <option value="30">30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Background Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={currentProject?.settings.backgroundColor || '#000000'}
                className="w-8 h-8 rounded border border-gray-600"
              />
              <input
                type="text"
                value={currentProject?.settings.backgroundColor || '#000000'}
                className="input text-sm flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h4 className="font-medium mb-3 flex items-center">
          <Music size={16} className="mr-2" />
          Audio Settings
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sample Rate</label>
            <select className="input text-sm">
              <option value="44100">44.1 kHz</option>
              <option value="48000">48 kHz</option>
              <option value="96000">96 kHz</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Channels</label>
            <select className="input text-sm">
              <option value="mono">Mono</option>
              <option value="stereo">Stereo</option>
              <option value="5.1">5.1 Surround</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClipProperties = () => {
    if (!selectedClip) return null;

    return (
      <div className="space-y-6">
        <div className="card p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <Video size={16} className="mr-2" />
            Clip Info
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={selectedClip.name}
                onChange={(e) => updateClip(selectedClip.id, { name: e.target.value })}
                className="input text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Time</label>
                <input
                  type="number"
                  value={selectedClip.startTime.toFixed(2)}
                  onChange={(e) => updateClip(selectedClip.id, { startTime: Number(e.target.value) })}
                  className="input text-sm"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Duration</label>
                <input
                  type="number"
                  value={selectedClip.duration.toFixed(2)}
                  onChange={(e) => updateClip(selectedClip.id, { duration: Number(e.target.value) })}
                  className="input text-sm"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {selectedClip.type === 'video' && (
          <div className="card p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <Move size={16} className="mr-2" />
              Transform
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">X Position</label>
                  <input
                    type="number"
                    value={(selectedClip as any).transform?.x || 0}
                    onChange={(e) => updateClip(selectedClip.id, {
                      transform: { ...(selectedClip as any).transform, x: Number(e.target.value) }
                    })}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Y Position</label>
                  <input
                    type="number"
                    value={(selectedClip as any).transform?.y || 0}
                    onChange={(e) => updateClip(selectedClip.id, {
                      transform: { ...(selectedClip as any).transform, y: Number(e.target.value) }
                    })}
                    className="input text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Scale X</label>
                  <input
                    type="number"
                    value={(selectedClip as any).transform?.scaleX || 1}
                    onChange={(e) => updateClip(selectedClip.id, {
                      transform: { ...(selectedClip as any).transform, scaleX: Number(e.target.value) }
                    })}
                    className="input text-sm"
                    step="0.1"
                    min="0.1"
                    max="5"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Scale Y</label>
                  <input
                    type="number"
                    value={(selectedClip as any).transform?.scaleY || 1}
                    onChange={(e) => updateClip(selectedClip.id, {
                      transform: { ...(selectedClip as any).transform, scaleY: Number(e.target.value) }
                    })}
                    className="input text-sm"
                    step="0.1"
                    min="0.1"
                    max="5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Rotation</label>
                <input
                  type="range"
                  value={(selectedClip as any).transform?.rotation || 0}
                  onChange={(e) => updateClip(selectedClip.id, {
                    transform: { ...(selectedClip as any).transform, rotation: Number(e.target.value) }
                  })}
                  className="w-full"
                  min="-180"
                  max="180"
                />
                <div className="text-xs text-gray-400 text-center mt-1">
                  {(selectedClip as any).transform?.rotation || 0}°
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Opacity</label>
                <input
                  type="range"
                  value={((selectedClip as any).transform?.opacity || 1) * 100}
                  onChange={(e) => updateClip(selectedClip.id, {
                    transform: { ...(selectedClip as any).transform, opacity: Number(e.target.value) / 100 }
                  })}
                  className="w-full"
                  min="0"
                  max="100"
                />
                <div className="text-xs text-gray-400 text-center mt-1">
                  {Math.round(((selectedClip as any).transform?.opacity || 1) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <Volume2 size={16} className="mr-2" />
            Audio
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Volume</label>
              <input
                type="range"
                value={selectedClip.volume * 100}
                onChange={(e) => updateClip(selectedClip.id, { volume: Number(e.target.value) / 100 })}
                className="w-full"
                min="0"
                max="200"
              />
              <div className="text-xs text-gray-400 text-center mt-1">
                {Math.round(selectedClip.volume * 100)}%
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedClip.muted}
                onChange={(e) => updateClip(selectedClip.id, { muted: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm">Muted</label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTrackProperties = () => {
    if (!selectedTrack) return null;

    return (
      <div className="space-y-6">
        <div className="card p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <Layers size={16} className="mr-2" />
            Track Settings
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Track Name</label>
              <input
                type="text"
                value={selectedTrack.name}
                onChange={(e) => updateTrack(selectedTrack.id, { name: e.target.value })}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Track Color</label>
              <input
                type="color"
                value={selectedTrack.color}
                onChange={(e) => updateTrack(selectedTrack.id, { color: e.target.value })}
                className="w-full h-8 rounded border border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTrack.muted}
                  onChange={(e) => updateTrack(selectedTrack.id, { muted: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">Muted</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTrack.locked}
                  onChange={(e) => updateTrack(selectedTrack.id, { locked: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">Locked</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTrack.visible}
                  onChange={(e) => updateTrack(selectedTrack.id, { visible: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">Visible</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderExportProperties = () => (
    <div className="space-y-6">
      <div className="card p-4">
        <h4 className="font-medium mb-3 flex items-center">
          <Download size={16} className="mr-2" />
          Export Settings
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Format</label>
            <select className="input text-sm">
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
              <option value="webm">WebM</option>
              <option value="avi">AVI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Quality</label>
            <select className="input text-sm">
              <option value="high">High Quality</option>
              <option value="medium">Medium Quality</option>
              <option value="low">Low Quality</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Output Path</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Choose output location..."
                className="input text-sm flex-1"
              />
              <button className="btn-ghost px-3 py-2 text-sm">Browse</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`properties-panel bg-gray-800 flex flex-col h-full ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex-1 p-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-900/20'
                  : tab.disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <Icon size={16} />
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'project' && renderProjectProperties()}
            {activeTab === 'clip' && renderClipProperties()}
            {activeTab === 'track' && renderTrackProperties()}
            {activeTab === 'export' && renderExportProperties()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
