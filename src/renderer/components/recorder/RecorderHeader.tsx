import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { ScreenRecordingService } from '../../services/ScreenRecordingService';

export const RecorderHeader: React.FC = () => {
  // Check recording capabilities
  const capabilities = ScreenRecordingService.getCapabilities();
  const isSupported = capabilities.supportsDisplayMedia && capabilities.supportsMediaRecorder;

  return (
    <div className="p-6 border-b border-gray-700">
      <h1 className="text-2xl font-bold text-white mb-2">Screen Recorder</h1>
      <p className="text-gray-400">Capture your screen, webcam, and audio with professional quality</p>

      {/* Capability Status */}
      <div className="mt-3 flex items-center space-x-2">
        {isSupported ? (
          <>
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-sm text-green-400">Screen recording supported</span>
          </>
        ) : (
          <>
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-sm text-red-400">Screen recording not supported</span>
          </>
        )}
      </div>
    </div>
  );
};
