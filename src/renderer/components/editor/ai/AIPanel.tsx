// AI Panel Component - Smart editing and transcription controls
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Mic,
  Volume2,
  VolumeX,
  Scissors,
  Zap,
  FileText,
  Wand2,
  Play,
  Pause,
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader,
  Trash2
} from 'lucide-react';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { TranscriptionService, TranscriptionResult } from '../../../services/TranscriptionService';
import { SmartEditingService, SmartEditResult } from '../../../services/SmartEditingService';
import { AIAudioProcessor, SilenceSegment } from '../../../services/AIAudioProcessor';
import ExportService from '../../../services/ExportService';

interface AIPanelProps {
  className?: string;
}

export const AIPanel: React.FC<AIPanelProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'transcription' | 'smart-edit' | 'audio-enhance'>('transcription');
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [smartEditResult, setSmartEditResult] = useState<SmartEditResult | null>(null);
  const [silenceSegments, setSilenceSegments] = useState<SilenceSegment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');

  // Services
  const [transcriptionService] = useState(() => new TranscriptionService());
  const [smartEditingService] = useState(() => new SmartEditingService());
  const [audioProcessor] = useState(() => new AIAudioProcessor());

  const {
    currentProject,
    selection,
    updateClip,
    removeClip,
    addClip
  } = useVideoEditorStore();

  const selectedClips = currentProject?.tracks
    .flatMap(track => track.clips)
    .filter(clip => selection.clips.includes(clip.id)) || [];

  // Handle transcription
  const handleTranscribe = async () => {
    if (selectedClips.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus('Starting transcription...');

    try {
      // For demo, we'll use the first selected clip
      const clip = selectedClips[0];
      
      // Create a mock file for transcription
      const mockFile = new File([], clip.name, { type: 'video/mp4' });
      
      const result = await transcriptionService.transcribeVideo(
        mockFile,
        {
          language: 'auto',
          model: 'whisper-base',
          enableTimestamps: true,
          enablePunctuation: true
        },
        (progress, status) => {
          setProcessingProgress(progress);
          setProcessingStatus(status);
        }
      );

      setTranscriptionResult(result);
      setProcessingStatus('Transcription complete!');
    } catch (error) {
      console.error('Transcription error:', error);
      setProcessingStatus('Transcription failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle silence detection
  const handleDetectSilence = async () => {
    if (selectedClips.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus('Detecting silence...');

    try {
      // Mock audio buffer for demo
      const mockAudioBuffer = new ArrayBuffer(1024);
      
      const segments = await audioProcessor.detectSilence(mockAudioBuffer, {
        threshold: -40,
        minDuration: 0.5,
        sensitivity: 70
      });

      setSilenceSegments(segments);
      setProcessingStatus(`Found ${segments.length} silence segments`);
    } catch (error) {
      console.error('Silence detection error:', error);
      setProcessingStatus('Silence detection failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle auto remove silence
  const handleAutoRemoveSilence = async () => {
    if (selectedClips.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus('Removing silence...');

    try {
      const processedClips = await smartEditingService.autoRemoveSilence(
        selectedClips,
        {
          threshold: -40,
          minDuration: 0.5,
          keepPadding: 0.1
        },
        (progress) => setProcessingProgress(progress)
      );

      // Update clips in store
      selectedClips.forEach(clip => removeClip(clip.id));
      processedClips.forEach(clip => addClip(clip, clip.trackId));

      setProcessingStatus(`Removed silence from ${selectedClips.length} clips`);
    } catch (error) {
      console.error('Remove silence error:', error);
      setProcessingStatus('Remove silence failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle smart cut
  const handleSmartCut = async () => {
    if (selectedClips.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus('Performing smart cut...');

    try {
      const result = await smartEditingService.performSmartCut(
        selectedClips,
        smartEditingService.getDefaultSmartCutOptions(),
        (progress, status) => {
          setProcessingProgress(progress);
          setProcessingStatus(status);
        }
      );

      setSmartEditResult(result);
      
      // Apply results
      result.originalClips.forEach(clip => removeClip(clip.id));
      result.editedClips.forEach(clip => addClip(clip, clip.trackId));

      setProcessingStatus(`Smart cut complete! Saved ${result.timeSaved.toFixed(1)}s`);
    } catch (error) {
      console.error('Smart cut error:', error);
      setProcessingStatus('Smart cut failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle audio enhancement
  const handleEnhanceAudio = async () => {
    if (selectedClips.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus('Enhancing audio...');

    try {
      const settings = audioProcessor.getDefaultSettings();
      
      for (let i = 0; i < selectedClips.length; i++) {
        const clip = selectedClips[i];
        setProcessingStatus(`Enhancing audio for clip ${i + 1}/${selectedClips.length}`);
        
        // Mock audio buffer
        const mockAudioBuffer = new ArrayBuffer(1024);
        
        await audioProcessor.enhanceAudio(
          mockAudioBuffer,
          settings,
          (progress) => setProcessingProgress((i / selectedClips.length) * 100 + (progress / selectedClips.length))
        );

        // Add audio enhancement effect to clip
        updateClip(clip.id, {
          effects: [
            ...clip.effects,
            {
              id: crypto.randomUUID(),
              type: 'ai-audio-enhancement',
              name: 'AI Audio Enhancement',
              enabled: true,
              properties: settings
            }
          ]
        });
      }

      setProcessingStatus('Audio enhancement complete!');
    } catch (error) {
      console.error('Audio enhancement error:', error);
      setProcessingStatus('Audio enhancement failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const tabs = [
    { id: 'transcription', label: 'Transcription', icon: FileText },
    { id: 'smart-edit', label: 'Smart Edit', icon: Scissors },
    { id: 'audio-enhance', label: 'Audio AI', icon: Volume2 }
  ] as const;

  const renderTranscriptionTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Video Transcription</h4>
        <button
          onClick={handleTranscribe}
          disabled={selectedClips.length === 0 || isProcessing}
          className="btn-primary text-sm disabled:opacity-50"
        >
          <Mic size={16} className="mr-1" />
          Transcribe
        </button>
      </div>

      {transcriptionResult && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {transcriptionResult.wordCount} words • {transcriptionResult.language}
            </span>
            <span className="text-green-400">
              {Math.round(transcriptionResult.confidence * 100)}% confidence
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto custom-scrollbar bg-gray-900 rounded-lg p-3">
            {transcriptionResult.segments.map((segment, index) => (
              <div
                key={segment.id}
                className={`mb-2 p-2 rounded cursor-pointer transition-colors ${
                  segment.type === 'silence' 
                    ? 'bg-red-900/20 text-red-300' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                onClick={() => {
                  // Seek to segment time
                  // seekTo(segment.startTime);
                }}
              >
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>{formatTime(segment.startTime)} - {formatTime(segment.endTime)}</span>
                  <span>{segment.type}</span>
                </div>
                <div className="text-sm">
                  {segment.type === 'silence' ? (
                    <span className="italic">Silence ({segment.duration.toFixed(1)}s)</span>
                  ) : (
                    segment.text
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => {
                const text = transcriptionResult.segments
                  .filter(s => s.type === 'speech')
                  .map(s => s.text)
                  .join(' ');
                navigator.clipboard.writeText(text);
              }}
              className="btn-ghost text-sm"
            >
              Copy Text
            </button>
            <button
              onClick={() => {
                const srt = generateSRT(transcriptionResult);
                downloadFile(srt, 'transcription.srt');
              }}
              className="btn-ghost text-sm"
            >
              <Download size={16} className="mr-1" />
              Export SRT
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSmartEditTab = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Smart Editing Tools</h4>

      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={handleDetectSilence}
          disabled={selectedClips.length === 0 || isProcessing}
          className="btn-ghost p-3 text-left disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Detect Silence</div>
              <div className="text-xs text-gray-400">Find silent segments</div>
            </div>
            <Brain size={20} />
          </div>
        </button>

        <button
          onClick={handleAutoRemoveSilence}
          disabled={selectedClips.length === 0 || isProcessing}
          className="btn-ghost p-3 text-left disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto Remove Silence</div>
              <div className="text-xs text-gray-400">Remove silent parts automatically</div>
            </div>
            <VolumeX size={20} />
          </div>
        </button>

        <button
          onClick={handleSmartCut}
          disabled={selectedClips.length === 0 || isProcessing}
          className="btn-ghost p-3 text-left disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Smart Cut</div>
              <div className="text-xs text-gray-400">AI-powered editing</div>
            </div>
            <Zap size={20} />
          </div>
        </button>
      </div>

      {silenceSegments.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Detected Silence ({silenceSegments.length})</div>
          <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
            {silenceSegments.map((segment, index) => (
              <div key={segment.id} className="flex items-center justify-between text-xs bg-gray-800 p-2 rounded">
                <span>{formatTime(segment.startTime)} - {formatTime(segment.endTime)}</span>
                <span className="text-gray-400">{segment.duration.toFixed(1)}s</span>
                <button
                  onClick={() => {
                    // Remove this specific silence segment
                    setSilenceSegments(prev => prev.filter(s => s.id !== segment.id));
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {smartEditResult && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          <div className="text-sm font-medium text-green-400 mb-2">Smart Cut Results</div>
          <div className="text-xs space-y-1">
            <div>Time saved: {smartEditResult.timeSaved.toFixed(1)}s</div>
            <div>Segments removed: {smartEditResult.removedSegments.length}</div>
            <div>Speed adjustments: {smartEditResult.speedAdjustments.length}</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAudioEnhanceTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">AI Audio Enhancement</h4>
        <button
          onClick={handleEnhanceAudio}
          disabled={selectedClips.length === 0 || isProcessing}
          className="btn-primary text-sm disabled:opacity-50"
        >
          <Wand2 size={16} className="mr-1" />
          Enhance
        </button>
      </div>

      <div className="space-y-3">
        <div className="card p-3">
          <div className="text-sm font-medium mb-2">Enhancement Features</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Noise Reduction</span>
              <CheckCircle size={14} className="text-green-400" />
            </div>
            <div className="flex items-center justify-between">
              <span>Studio Sound</span>
              <CheckCircle size={14} className="text-green-400" />
            </div>
            <div className="flex items-center justify-between">
              <span>Dynamic Processing</span>
              <CheckCircle size={14} className="text-green-400" />
            </div>
            <div className="flex items-center justify-between">
              <span>EQ Optimization</span>
              <CheckCircle size={14} className="text-green-400" />
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          AI-powered audio enhancement will automatically:
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Remove background noise</li>
            <li>Enhance voice clarity</li>
            <li>Apply studio-quality processing</li>
            <li>Optimize frequency response</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateSRT = (transcription: TranscriptionResult): string => {
    return transcription.segments
      .filter(segment => segment.type === 'speech')
      .map((segment, index) => {
        const start = formatSRTTime(segment.startTime);
        const end = formatSRTTime(segment.endTime);
        return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
      })
      .join('\n');
  };

  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  const downloadFile = async (content: string, filename: string) => {
    try {
      const exportService = ExportService.getInstance();

      // Determine export format based on file extension
      const extension = filename.split('.').pop()?.toLowerCase();
      const format = extension === 'srt' ? 'txt' : 'txt';

      // Export with compression for larger files
      const result = await exportService.exportJSON(content, {
        filename,
        compress: content.length > 1024 * 10, // Compress if > 10KB
        format: format as any,
        includeMetadata: false,
        autoDownload: true,
      });

      if (!result.success) {
        console.error('Export failed:', result.error);
        // Fallback to simple download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      // Fallback to simple download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`ai-panel bg-gray-800 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Brain size={20} className="text-purple-400" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        {selectedClips.length > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            {selectedClips.length} clip(s) selected
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 p-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-900/20'
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {selectedClips.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Brain size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select clips to use AI features</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'transcription' && renderTranscriptionTab()}
              {activeTab === 'smart-edit' && renderSmartEditTab()}
              {activeTab === 'audio-enhance' && renderAudioEnhanceTab()}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="p-4 border-t border-gray-700 bg-gray-850">
          <div className="flex items-center space-x-3">
            <Loader size={16} className="animate-spin text-purple-400" />
            <div className="flex-1">
              <div className="text-sm font-medium">{processingStatus}</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-400">{Math.round(processingProgress)}%</div>
          </div>
        </div>
      )}
    </div>
  );
};
