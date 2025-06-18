import React from 'react';
import { RecordingControls } from './RecordingControls';
import { SourceSelector } from './SourceSelector';
import { CameraSelector } from './CameraSelector';
import { AudioDeviceSelector } from './AudioDeviceSelector';
import { RecordingSettings } from './RecordingSettings';
import { RecordingPreview } from './RecordingPreview';
import { RecordingTimer } from './RecordingTimer';
import { RecordingTest } from './RecordingTest';
import { RecorderHeader } from './RecorderHeader';
import { RecordingCompleteNotification } from './RecordingCompleteNotification';
import { GoLiveButton } from './GoLiveButton';
import { useRecordingManager } from '../../hooks/useRecordingManager';

interface RecorderProps {
  onSwitchToEditor: () => void;
  onSwitchToStreaming?: () => void;
}

export const Recorder: React.FC<RecorderProps> = ({ onSwitchToEditor, onSwitchToStreaming }) => {
  const {
    isRecording,
    isPaused,
    isProcessing,
    duration,
    recordedBlob,
    settings,
    availableCameras,
    availableMicrophones,
    availableSpeakers,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording
  } = useRecordingManager(onSwitchToEditor);



  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <RecorderHeader />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Recording Timer */}
          <RecordingTimer />

          {/* Recording Controls */}
          <RecordingControls
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onPauseRecording={handlePauseRecording}
            onResumeRecording={handleResumeRecording}
          />

          {/* Recording Preview */}
          <RecordingPreview />

          {/* Go Live Button */}
          <GoLiveButton
            isVisible={!!onSwitchToStreaming && !isRecording}
            onGoLive={onSwitchToStreaming || (() => {})}
          />

          {/* Source Selection */}
          <SourceSelector />

          {/* Camera Selection */}
          <CameraSelector />

          {/* Audio Device Selection */}
          <AudioDeviceSelector />

          {/* Recording Settings */}
          <RecordingSettings />

          {/* Test Component (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-center">Development Test</h2>
              <RecordingTest />
            </div>
          )}

          {/* Recording Complete */}
          <RecordingCompleteNotification
            isVisible={!!recordedBlob && !isRecording}
            onOpenEditor={onSwitchToEditor}
          />
        </div>
      </div>
    </div>
  );
};
