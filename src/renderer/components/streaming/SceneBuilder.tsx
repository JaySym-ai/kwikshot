import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Monitor, 
  Camera, 
  Mic, 
  Image, 
  Type, 
  Globe,
  Move,
  RotateCw,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Settings,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface Source {
  id: string;
  type: 'screen' | 'webcam' | 'audio' | 'image' | 'text' | 'browser';
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
}

interface SceneBuilderProps {
  sources: Source[];
  onUpdateSource: (sourceId: string, updates: Partial<Source>) => void;
  onAddSource: (source: Omit<Source, 'id'>) => void;
  onRemoveSource: (sourceId: string) => void;
  onDuplicateSource: (sourceId: string) => void;
}

export const SceneBuilder: React.FC<SceneBuilderProps> = ({
  sources,
  onUpdateSource,
  onAddSource,
  onRemoveSource,
  onDuplicateSource
}) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedSource = sources.find(s => s.id === selectedSourceId);

  const sourceTypes = [
    { type: 'screen', name: 'Screen Capture', icon: Monitor, color: 'blue' },
    { type: 'webcam', name: 'Webcam', icon: Camera, color: 'green' },
    { type: 'audio', name: 'Audio Source', icon: Mic, color: 'purple' },
    { type: 'image', name: 'Image', icon: Image, color: 'orange' },
    { type: 'text', name: 'Text', icon: Type, color: 'yellow' },
    { type: 'browser', name: 'Browser Source', icon: Globe, color: 'cyan' }
  ];

  const getSourceIcon = (type: string) => {
    const sourceType = sourceTypes.find(st => st.type === type);
    return sourceType?.icon || Monitor;
  };

  const getSourceColor = (type: string) => {
    const sourceType = sourceTypes.find(st => st.type === type);
    return sourceType?.color || 'gray';
  };

  const handleMouseDown = (e: React.MouseEvent, sourceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const source = sources.find(s => s.id === sourceId);
    if (!source || source.locked) return;

    setSelectedSourceId(sourceId);
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedSourceId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = (e.clientX - canvasRect.left - dragOffset.x) / zoom;
    const newY = (e.clientY - canvasRect.top - dragOffset.y) / zoom;

    onUpdateSource(selectedSourceId, {
      position: { x: Math.max(0, newX), y: Math.max(0, newY) }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleAddSource = (type: string) => {
    const sourceType = sourceTypes.find(st => st.type === type);
    if (!sourceType) return;

    const newSource: Omit<Source, 'id'> = {
      type: type as any,
      name: sourceType.name,
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false
    };

    onAddSource(newSource);
    setShowSourceMenu(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedSourceId(null);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Layers className="w-5 h-5" />
          <span>Scene Builder</span>
        </h3>
        
        <div className="flex items-center space-x-3">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
              className="p-2 hover:bg-gray-600 rounded"
            >
              <ZoomOut className="w-4 h-4 text-gray-300" />
            </button>
            <span className="text-sm text-gray-300 px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              className="p-2 hover:bg-gray-600 rounded"
            >
              <ZoomIn className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          {/* Add Source Button */}
          <button
            onClick={() => setShowSourceMenu(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Source</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900 rounded-lg border-2 border-gray-700 overflow-hidden">
            <div
              ref={canvasRef}
              className="relative bg-black aspect-video cursor-crosshair"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
            >
              {/* Grid */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />

              {/* Sources */}
              {sources.map((source) => {
                const Icon = getSourceIcon(source.type);
                const isSelected = selectedSourceId === source.id;
                
                return (
                  <motion.div
                    key={source.id}
                    className={`absolute border-2 transition-all cursor-move ${
                      isSelected 
                        ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                        : 'border-transparent hover:border-gray-500'
                    } ${source.locked ? 'cursor-not-allowed' : ''}`}
                    style={{
                      left: source.position.x,
                      top: source.position.y,
                      width: source.size.width,
                      height: source.size.height,
                      transform: `rotate(${source.rotation}deg)`,
                      opacity: source.visible ? source.opacity : 0.3
                    }}
                    onMouseDown={(e) => handleMouseDown(e, source.id)}
                    whileHover={{ scale: isSelected ? 1 : 1.02 }}
                  >
                    {/* Source Content */}
                    <div className={`w-full h-full bg-gray-800 rounded flex items-center justify-center border-l-4 border-${getSourceColor(source.type)}-500`}>
                      <div className="text-center">
                        <Icon className={`w-8 h-8 text-${getSourceColor(source.type)}-500 mx-auto mb-2`} />
                        <p className="text-white text-sm font-medium">{source.name}</p>
                        <p className="text-gray-400 text-xs">{source.type}</p>
                      </div>
                    </div>

                    {/* Selection Handles */}
                    {isSelected && (
                      <>
                        {/* Corner handles for resizing */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
                        
                        {/* Rotation handle */}
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <div className="w-3 h-3 bg-green-500 rounded-full cursor-grab" />
                        </div>
                      </>
                    )}

                    {/* Source Status Indicators */}
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {!source.visible && (
                        <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
                          <EyeOff className="w-2 h-2 text-white" />
                        </div>
                      )}
                      {source.locked && (
                        <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">🔒</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Canvas Info */}
              <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                1920 × 1080 • {sources.length} sources
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          {/* Source List */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Sources</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sources.map((source) => {
                const Icon = getSourceIcon(source.type);
                const isSelected = selectedSourceId === source.id;
                
                return (
                  <div
                    key={source.id}
                    onClick={() => setSelectedSourceId(source.id)}
                    className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-600' : 'hover:bg-gray-600'
                    }`}
                  >
                    <Icon className={`w-4 h-4 text-${getSourceColor(source.type)}-500`} />
                    <span className="text-white text-sm flex-1 truncate">{source.name}</span>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateSource(source.id, { visible: !source.visible });
                        }}
                        className={`p-1 rounded ${source.visible ? 'text-green-500' : 'text-gray-500'}`}
                      >
                        {source.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {sources.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sources added</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Source Properties */}
          {selectedSource && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-700 rounded-lg p-4"
            >
              <h4 className="text-white font-medium mb-3">Properties</h4>
              
              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedSource.name}
                    onChange={(e) => onUpdateSource(selectedSource.id, { name: e.target.value })}
                    className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                  />
                </div>

                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">X</label>
                    <input
                      type="number"
                      value={Math.round(selectedSource.position.x)}
                      onChange={(e) => onUpdateSource(selectedSource.id, {
                        position: { ...selectedSource.position, x: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedSource.position.y)}
                      onChange={(e) => onUpdateSource(selectedSource.id, {
                        position: { ...selectedSource.position, y: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    />
                  </div>
                </div>

                {/* Size */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Width</label>
                    <input
                      type="number"
                      value={Math.round(selectedSource.size.width)}
                      onChange={(e) => onUpdateSource(selectedSource.id, {
                        size: { ...selectedSource.size, width: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Height</label>
                    <input
                      type="number"
                      value={Math.round(selectedSource.size.height)}
                      onChange={(e) => onUpdateSource(selectedSource.id, {
                        size: { ...selectedSource.size, height: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    />
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Opacity: {Math.round(selectedSource.opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedSource.opacity}
                    onChange={(e) => onUpdateSource(selectedSource.id, { opacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => onDuplicateSource(selectedSource.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-sm flex items-center justify-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={() => onRemoveSource(selectedSource.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-sm flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add Source Menu */}
      <AnimatePresence>
        {showSourceMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowSourceMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-xl p-6 w-96"
            >
              <h3 className="text-white font-semibold mb-4">Add Source</h3>
              <div className="grid grid-cols-2 gap-3">
                {sourceTypes.map((sourceType) => {
                  const Icon = sourceType.icon;
                  return (
                    <button
                      key={sourceType.type}
                      onClick={() => handleAddSource(sourceType.type)}
                      className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg flex flex-col items-center space-y-2 transition-colors"
                    >
                      <Icon className={`w-8 h-8 text-${sourceType.color}-500`} />
                      <span className="text-sm">{sourceType.name}</span>
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
