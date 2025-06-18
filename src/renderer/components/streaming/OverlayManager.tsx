import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Eye, EyeOff, Move, Type, Image, Camera, MessageCircle, Timer, Zap } from 'lucide-react';
import { StreamOverlay } from '../../../shared/streaming-types';

interface OverlayManagerProps {
  overlays: StreamOverlay[];
  onCreateOverlay: (overlay: Omit<StreamOverlay, 'id'>) => void;
  onUpdateOverlay: (overlayId: string, updates: Partial<StreamOverlay>) => void;
  onDeleteOverlay: (overlayId: string) => void;
  onReorderOverlays: (overlayIds: string[]) => void;
}

export const OverlayManager: React.FC<OverlayManagerProps> = ({
  overlays,
  onCreateOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
  onReorderOverlays
}) => {
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [draggedOverlay, setDraggedOverlay] = useState<string | null>(null);

  const selectedOverlay = overlays.find(overlay => overlay.id === selectedOverlayId);

  const overlayTypes = [
    { type: 'text', name: 'Text Overlay', icon: Type, description: 'Add custom text to your stream' },
    { type: 'image', name: 'Image Overlay', icon: Image, description: 'Display images or logos' },
    { type: 'webcam', name: 'Webcam Overlay', icon: Camera, description: 'Add webcam feed' },
    { type: 'chat', name: 'Chat Overlay', icon: MessageCircle, description: 'Show live chat messages' },
    { type: 'alerts', name: 'Alert Overlay', icon: Zap, description: 'Display follower/donation alerts' },
    { type: 'timer', name: 'Timer Overlay', icon: Timer, description: 'Show countdown or stopwatch' },
  ];

  const handleCreateOverlay = (type: string) => {
    const overlayType = overlayTypes.find(t => t.type === type);
    if (!overlayType) return;

    const newOverlay: Omit<StreamOverlay, 'id'> = {
      name: overlayType.name,
      type: type as any,
      position: { x: 100, y: 100 },
      size: { width: 300, height: 100 },
      visible: true,
      opacity: 1,
      zIndex: overlays.length + 1,
      settings: getDefaultSettings(type)
    };

    onCreateOverlay(newOverlay);
    setShowCreateDialog(false);
  };

  const getDefaultSettings = (type: string): Record<string, any> => {
    switch (type) {
      case 'text':
        return {
          text: 'Sample Text',
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#ffffff',
          backgroundColor: 'transparent',
          alignment: 'left',
          bold: false,
          italic: false
        };
      case 'image':
        return {
          src: '',
          fit: 'contain',
          borderRadius: 0
        };
      case 'webcam':
        return {
          deviceId: 'default',
          borderRadius: 10,
          chromaKey: false,
          chromaKeyColor: '#00ff00'
        };
      case 'chat':
        return {
          maxMessages: 10,
          fontSize: 16,
          showUsernames: true,
          showTimestamps: false,
          backgroundColor: 'rgba(0,0,0,0.5)',
          textColor: '#ffffff'
        };
      case 'alerts':
        return {
          duration: 5000,
          sound: true,
          animation: 'slide',
          position: 'top-right'
        };
      case 'timer':
        return {
          format: 'HH:MM:SS',
          fontSize: 32,
          color: '#ffffff',
          backgroundColor: 'transparent',
          countUp: false,
          startTime: 0
        };
      default:
        return {};
    }
  };

  const handleDragStart = (overlayId: string) => {
    setDraggedOverlay(overlayId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetOverlayId: string) => {
    e.preventDefault();
    if (!draggedOverlay || draggedOverlay === targetOverlayId) return;

    const draggedIndex = overlays.findIndex(o => o.id === draggedOverlay);
    const targetIndex = overlays.findIndex(o => o.id === targetOverlayId);

    const newOrder = [...overlays];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    onReorderOverlays(newOrder.map(o => o.id));
    setDraggedOverlay(null);
  };

  const getOverlayIcon = (type: string) => {
    const overlayType = overlayTypes.find(t => t.type === type);
    return overlayType?.icon || Type;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Stream Overlays</h3>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Overlay</span>
        </button>
      </div>

      {/* Overlay List */}
      <div className="space-y-3">
        {overlays
          .sort((a, b) => b.zIndex - a.zIndex)
          .map((overlay) => {
            const Icon = getOverlayIcon(overlay.type);
            return (
              <div
                key={overlay.id}
                draggable
                onDragStart={() => handleDragStart(overlay.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, overlay.id)}
                className={`bg-gray-700 rounded-lg p-4 cursor-move transition-all ${
                  selectedOverlayId === overlay.id ? 'ring-2 ring-blue-500' : ''
                } ${draggedOverlay === overlay.id ? 'opacity-50' : ''}`}
                onClick={() => setSelectedOverlayId(overlay.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-blue-500" />
                    <div>
                      <h4 className="text-white font-medium">{overlay.name}</h4>
                      <p className="text-gray-400 text-sm">
                        {overlay.position.x}, {overlay.position.y} • {overlay.size.width}×{overlay.size.height}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                      Z: {overlay.zIndex}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateOverlay(overlay.id, { visible: !overlay.visible });
                      }}
                      className={`p-2 rounded ${overlay.visible ? 'text-green-500' : 'text-gray-500'}`}
                    >
                      {overlay.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOverlay(overlay.id);
                      }}
                      className="p-2 text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Opacity Slider */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                    <span>Opacity</span>
                    <span>{Math.round(overlay.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={overlay.opacity}
                    onChange={(e) => onUpdateOverlay(overlay.id, { opacity: parseFloat(e.target.value) })}
                    className="w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            );
          })}

        {overlays.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
              <Type className="w-8 h-8" />
            </div>
            <p>No overlays added</p>
            <p className="text-sm">Add overlays to enhance your stream</p>
          </div>
        )}
      </div>

      {/* Overlay Properties Panel */}
      {selectedOverlay && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Overlay Properties</h4>
          
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={selectedOverlay.name}
                onChange={(e) => onUpdateOverlay(selectedOverlay.id, { name: e.target.value })}
                className="w-full bg-gray-600 text-white px-3 py-2 rounded"
              />
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">X Position</label>
                <input
                  type="number"
                  value={selectedOverlay.position.x}
                  onChange={(e) => onUpdateOverlay(selectedOverlay.id, {
                    position: { ...selectedOverlay.position, x: parseInt(e.target.value) }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Y Position</label>
                <input
                  type="number"
                  value={selectedOverlay.position.y}
                  onChange={(e) => onUpdateOverlay(selectedOverlay.id, {
                    position: { ...selectedOverlay.position, y: parseInt(e.target.value) }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                />
              </div>
            </div>

            {/* Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Width</label>
                <input
                  type="number"
                  value={selectedOverlay.size.width}
                  onChange={(e) => onUpdateOverlay(selectedOverlay.id, {
                    size: { ...selectedOverlay.size, width: parseInt(e.target.value) }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Height</label>
                <input
                  type="number"
                  value={selectedOverlay.size.height}
                  onChange={(e) => onUpdateOverlay(selectedOverlay.id, {
                    size: { ...selectedOverlay.size, height: parseInt(e.target.value) }
                  })}
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                />
              </div>
            </div>

            {/* Z-Index */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Layer Order</label>
              <input
                type="number"
                value={selectedOverlay.zIndex}
                onChange={(e) => onUpdateOverlay(selectedOverlay.id, { zIndex: parseInt(e.target.value) })}
                className="w-full bg-gray-600 text-white px-3 py-2 rounded"
              />
            </div>

            {/* Type-specific settings */}
            {selectedOverlay.type === 'text' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Text</label>
                  <textarea
                    value={selectedOverlay.settings.text || ''}
                    onChange={(e) => onUpdateOverlay(selectedOverlay.id, {
                      settings: { ...selectedOverlay.settings, text: e.target.value }
                    })}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Font Size</label>
                    <input
                      type="number"
                      value={selectedOverlay.settings.fontSize || 24}
                      onChange={(e) => onUpdateOverlay(selectedOverlay.id, {
                        settings: { ...selectedOverlay.settings, fontSize: parseInt(e.target.value) }
                      })}
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Color</label>
                    <input
                      type="color"
                      value={selectedOverlay.settings.color || '#ffffff'}
                      onChange={(e) => onUpdateOverlay(selectedOverlay.id, {
                        settings: { ...selectedOverlay.settings, color: e.target.value }
                      })}
                      className="w-full bg-gray-600 rounded"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Overlay Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-white font-semibold mb-4">Add Overlay</h3>
            <div className="space-y-3">
              {overlayTypes.map((overlayType) => {
                const Icon = overlayType.icon;
                return (
                  <button
                    key={overlayType.type}
                    onClick={() => handleCreateOverlay(overlayType.type)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded flex items-start space-x-3 text-left"
                  >
                    <Icon className="w-6 h-6 text-blue-500 mt-1" />
                    <div>
                      <div className="font-medium">{overlayType.name}</div>
                      <div className="text-sm text-gray-400">{overlayType.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowCreateDialog(false)}
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
