// Sync Controls Component - Manual and automatic synchronization controls
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MulticamGroup, SyncPoint } from '../../../types/videoEditorTypes';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { multicamManager } from '../../../services/MulticamManager';
import { 
  Sync, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Clock, 
  Volume2, 
  Waveform,
  Plus,
  Minus,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface SyncControlsProps {
  multicamGroup: MulticamGroup;
  onClose: () => void;
  className?: string;
}

export const SyncControls: React.FC<SyncControlsProps> = ({
  multicamGroup,
  onClose,
  className = ''
}) => {
  const [syncMethod, setSyncMethod] = useState<'audio' | 'timecode' | 'manual'>('audio');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [manualOffsets, setManualOffsets] = useState<{ [trackId: string]: number }>({});
  const [selectedSyncPoint, setSelectedSyncPoint] = useState<string | null>(null);

  const {
    currentProject,
    playback,
    addSyncPoint,
    updateMulticamGroup,
    addWarning
  } = useVideoEditorStore();

  const handleAutoSync = useCallback(async () => {
    if (!currentProject) return;

    setIsAnalyzing(true);
    try {
      const tracks = currentProject.tracks.filter(track => 
        multicamGroup.tracks.includes(track.id)
      );

      const result = await multicamManager.autoSyncTracks(tracks, {
        method: syncMethod,
        audioThreshold: -40,
        searchWindow: 10,
        confidence: 0.7
      });

      setAnalysisResult(result);

      // Apply sync points to the multicam group
      result.syncPoints.forEach(syncPoint => {
        addSyncPoint(multicamGroup.id, syncPoint.time, syncPoint.trackOffsets);
      });

      addWarning(`Auto-sync completed with ${result.confidence * 100}% confidence`);
    } catch (error) {
      console.error('Auto-sync failed:', error);
      addWarning('Auto-sync failed: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentProject, multicamGroup, syncMethod, addSyncPoint, addWarning]);

  const handleManualSync = useCallback(() => {
    const currentTime = playback.currentTime;
    addSyncPoint(multicamGroup.id, currentTime, manualOffsets);
    
    // Reset manual offsets
    setManualOffsets({});
  }, [playback.currentTime, multicamGroup.id, manualOffsets, addSyncPoint]);

  const handleOffsetChange = useCallback((trackId: string, offset: number) => {
    setManualOffsets(prev => ({
      ...prev,
      [trackId]: offset
    }));
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.floor(Math.abs(seconds) % 60);
    const frames = Math.floor((Math.abs(seconds) % 1) * 30);
    const sign = seconds < 0 ? '-' : '+';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  const removeSyncPoint = useCallback((syncPointId: string) => {
    const updatedSyncPoints = multicamGroup.syncPoints.filter(sp => sp.id !== syncPointId);
    updateMulticamGroup(multicamGroup.id, { syncPoints: updatedSyncPoints });
  }, [multicamGroup, updateMulticamGroup]);

  return (
    <div className={`sync-controls ${className} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Sync size={20} className="text-blue-400" />
          <h4 className="font-semibold">Synchronization Controls</h4>
          <span className="text-sm text-gray-400">
            {multicamGroup.name}
          </span>
        </div>
        
        <button
          onClick={onClose}
          className="btn-ghost p-2"
          title="Close sync controls"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auto Sync Section */}
        <div className="space-y-4">
          <h5 className="font-medium text-gray-300">Automatic Synchronization</h5>
          
          {/* Sync Method Selection */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Sync Method:</label>
            <div className="flex space-x-2">
              {[
                { value: 'audio', label: 'Audio', icon: Volume2 },
                { value: 'timecode', label: 'Timecode', icon: Clock },
                { value: 'manual', label: 'Manual', icon: Zap }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSyncMethod(value as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors ${
                    syncMethod === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto Sync Button */}
          <button
            onClick={handleAutoSync}
            disabled={isAnalyzing}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <RotateCcw size={16} className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Auto Sync</span>
              </>
            )}
          </button>

          {/* Analysis Result */}
          {analysisResult && (
            <div className="bg-gray-800 rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Analysis Result</span>
                <span className={`text-sm ${
                  analysisResult.confidence > 0.8 ? 'text-green-400' : 
                  analysisResult.confidence > 0.6 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {Math.round(analysisResult.confidence * 100)}% confidence
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Found {analysisResult.syncPoints.length} sync points in {Math.round(analysisResult.processingTime)}ms
              </div>
            </div>
          )}
        </div>

        {/* Manual Sync Section */}
        <div className="space-y-4">
          <h5 className="font-medium text-gray-300">Manual Synchronization</h5>
          
          {/* Track Offsets */}
          <div className="space-y-3">
            {multicamGroup.angles.map((angle) => {
              const offset = manualOffsets[angle.trackId] || 0;
              
              return (
                <div key={angle.id} className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: angle.color }}
                  />
                  <span className="text-sm font-medium min-w-0 flex-1 truncate">
                    {angle.name}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOffsetChange(angle.trackId, offset - 0.1)}
                      className="btn-ghost p-1"
                      title="Decrease offset"
                    >
                      <Minus size={12} />
                    </button>
                    
                    <span className="text-xs font-mono min-w-[80px] text-center">
                      {formatTime(offset)}
                    </span>
                    
                    <button
                      onClick={() => handleOffsetChange(angle.trackId, offset + 0.1)}
                      className="btn-ghost p-1"
                      title="Increase offset"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Manual Sync Point */}
          <button
            onClick={handleManualSync}
            disabled={Object.keys(manualOffsets).length === 0}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Sync Point</span>
          </button>
        </div>
      </div>

      {/* Existing Sync Points */}
      {multicamGroup.syncPoints.length > 0 && (
        <div className="mt-6 border-t border-gray-700 pt-4">
          <h5 className="font-medium text-gray-300 mb-3">Sync Points</h5>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {multicamGroup.syncPoints.map((syncPoint) => (
              <div
                key={syncPoint.id}
                className={`flex items-center justify-between p-2 rounded transition-colors ${
                  selectedSyncPoint === syncPoint.id
                    ? 'bg-blue-600/20 border border-blue-600'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                onClick={() => setSelectedSyncPoint(
                  selectedSyncPoint === syncPoint.id ? null : syncPoint.id
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {syncPoint.type === 'audio' && <Volume2 size={14} className="text-green-400" />}
                    {syncPoint.type === 'timecode' && <Clock size={14} className="text-blue-400" />}
                    {syncPoint.type === 'manual' && <Zap size={14} className="text-yellow-400" />}
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">
                      {formatTime(syncPoint.time)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {Object.keys(syncPoint.trackOffsets).length} tracks
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {syncPoint.confidence && (
                    <span className={`text-xs ${
                      syncPoint.confidence > 0.8 ? 'text-green-400' : 
                      syncPoint.confidence > 0.6 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {Math.round(syncPoint.confidence * 100)}%
                    </span>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSyncPoint(syncPoint.id);
                    }}
                    className="btn-ghost p-1 text-red-400 hover:text-red-300"
                    title="Remove sync point"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
