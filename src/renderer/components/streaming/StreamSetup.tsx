import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Youtube, Twitch, Facebook, Server, Globe, Check } from 'lucide-react';
import { useStreamingStore } from '../../stores/streaming-store';
import { STREAMING_PLATFORMS } from '../../../shared/streaming-types';

interface StreamSetupProps {
  onClose: () => void;
  onComplete: () => void;
}

export const StreamSetup: React.FC<StreamSetupProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState<'platform' | 'config'>('platform');
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [webrtcServer, setWebrtcServer] = useState('');
  
  const {
    platform,
    selectPlatform,
    configureRTMP,
    configureWebRTC,
    updateStreamSettings
  } = useStreamingStore();

  const getPlatformIcon = (platformId: string) => {
    switch (platformId) {
      case 'youtube': return Youtube;
      case 'twitch': return Twitch;
      case 'facebook': return Facebook;
      case 'custom-rtmp': return Server;
      case 'webrtc-direct': return Globe;
      default: return Server;
    }
  };

  const handlePlatformSelect = (platformId: string) => {
    selectPlatform(platformId);
    setStep('config');
  };

  const handleConfigComplete = () => {
    if (!platform) return;

    if (platform.type === 'rtmp') {
      if (!rtmpUrl || !streamKey) {
        alert('Please fill in all RTMP configuration fields');
        return;
      }
      configureRTMP(rtmpUrl, streamKey);
    } else {
      if (!webrtcServer) {
        alert('Please provide WebRTC signaling server');
        return;
      }
      configureWebRTC({
        signalingServer: webrtcServer,
        stunServers: ['stun:stun.l.google.com:19302']
      });
    }

    onComplete();
  };

  const getDefaultRTMPUrl = (platformId: string) => {
    switch (platformId) {
      case 'youtube':
        return 'rtmp://a.rtmp.youtube.com/live2';
      case 'twitch':
        return 'rtmp://live.twitch.tv/app';
      case 'facebook':
        return 'rtmps://live-api-s.facebook.com:443/rtmp';
      default:
        return '';
    }
  };

  React.useEffect(() => {
    if (platform && platform.type === 'rtmp') {
      setRtmpUrl(getDefaultRTMPUrl(platform.id));
    }
  }, [platform]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">Stream Setup</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'platform' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Streaming Platform</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STREAMING_PLATFORMS.map((p) => {
                  const Icon = getPlatformIcon(p.id);
                  return (
                    <motion.button
                      key={p.id}
                      onClick={() => handlePlatformSelect(p.id)}
                      className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl border border-gray-600 hover:border-blue-500 transition-all duration-200 text-left"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon size={24} className="text-blue-400" />
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {p.type === 'rtmp' ? 'RTMP Streaming' : 'WebRTC Streaming'}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'config' && platform && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <button
                  onClick={() => setStep('platform')}
                  className="text-blue-400 hover:text-blue-300"
                >
                  ← Back
                </button>
                <h3 className="text-lg font-semibold">Configure {platform.name}</h3>
              </div>

              {platform.type === 'rtmp' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">RTMP URL</label>
                    <input
                      type="text"
                      value={rtmpUrl}
                      onChange={(e) => setRtmpUrl(e.target.value)}
                      className="input"
                      placeholder="rtmp://live.example.com/live"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Stream Key</label>
                    <input
                      type="password"
                      value={streamKey}
                      onChange={(e) => setStreamKey(e.target.value)}
                      className="input"
                      placeholder="Your stream key"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Get your stream key from your {platform.name} dashboard
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Signaling Server</label>
                    <input
                      type="text"
                      value={webrtcServer}
                      onChange={(e) => setWebrtcServer(e.target.value)}
                      className="input"
                      placeholder="wss://signaling.example.com"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      WebRTC signaling server URL
                    </p>
                  </div>
                </div>
              )}

              {/* Stream Quality Settings */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="font-medium mb-4">Stream Quality</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Resolution</label>
                    <select className="input">
                      <option value="1920x1080">1920x1080 (1080p)</option>
                      <option value="1280x720">1280x720 (720p)</option>
                      <option value="854x480">854x480 (480p)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Frame Rate</label>
                    <select className="input">
                      <option value="30">30 FPS</option>
                      <option value="60">60 FPS</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="btn-ghost"
          >
            Cancel
          </button>
          {step === 'config' && (
            <button
              onClick={handleConfigComplete}
              className="btn-primary flex items-center space-x-2"
            >
              <Check size={16} />
              <span>Complete Setup</span>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
