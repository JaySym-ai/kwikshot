import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Copy, Eye, EyeOff, Move, Settings } from 'lucide-react';
import { Scene, StreamSource, SceneTransition } from '../../../shared/streaming-types';

interface SceneManagerProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onCreateScene: (name: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onSwitchScene: (sceneId: string, transition?: SceneTransition) => void;
  onRenameScene: (sceneId: string, newName: string) => void;
  onDuplicateScene: (sceneId: string) => void;
  onAddSource: (sceneId: string, source: Omit<StreamSource, 'id'>) => void;
  onRemoveSource: (sceneId: string, sourceId: string) => void;
  onUpdateSource: (sceneId: string, sourceId: string, updates: Partial<StreamSource>) => void;
}

export const SceneManager: React.FC<SceneManagerProps> = ({
  scenes,
  activeSceneId,
  onCreateScene,
  onDeleteScene,
  onSwitchScene,
  onRenameScene,
  onDuplicateScene,
  onAddSource,
  onRemoveSource,
  onUpdateSource
}) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(activeSceneId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    setSelectedSceneId(activeSceneId);
  }, [activeSceneId]);

  const selectedScene = scenes.find(scene => scene.id === selectedSceneId);

  const handleCreateScene = () => {
    if (newSceneName.trim()) {
      onCreateScene(newSceneName.trim());
      setNewSceneName('');
      setShowCreateDialog(false);
    }
  };

  const handleRenameScene = (sceneId: string) => {
    if (editingName.trim()) {
      onRenameScene(sceneId, editingName.trim());
      setEditingSceneId(null);
      setEditingName('');
    }
  };

  const handleSwitchScene = (sceneId: string) => {
    const transition: SceneTransition = { type: 'fade', duration: 300 };
    onSwitchScene(sceneId, transition);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'screen': return '🖥️';
      case 'webcam': return '📹';
      case 'audio': return '🎵';
      case 'image': return '🖼️';
      case 'text': return '📝';
      case 'browser': return '🌐';
      default: return '📄';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Scene Manager</h3>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Scene</span>
        </button>
      </div>

      {/* Scene List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            className={`bg-gray-700 rounded-lg p-4 border-2 transition-all cursor-pointer ${
              scene.isActive 
                ? 'border-red-500 bg-red-900/20' 
                : selectedSceneId === scene.id
                ? 'border-blue-500'
                : 'border-transparent hover:border-gray-500'
            }`}
            onClick={() => setSelectedSceneId(scene.id)}
          >
            <div className="flex items-center justify-between mb-3">
              {editingSceneId === scene.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleRenameScene(scene.id)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRenameScene(scene.id)}
                  className="bg-gray-600 text-white px-2 py-1 rounded text-sm flex-1 mr-2"
                  autoFocus
                />
              ) : (
                <h4 className="text-white font-medium truncate">{scene.name}</h4>
              )}
              
              <div className="flex items-center space-x-1">
                {scene.isActive && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSceneId(scene.id);
                    setEditingName(scene.name);
                  }}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Scene Preview */}
            <div className="bg-gray-900 rounded aspect-video mb-3 flex items-center justify-center">
              {scene.preview ? (
                <img src={scene.preview} alt="Scene preview" className="w-full h-full object-cover rounded" />
              ) : (
                <span className="text-gray-500 text-sm">No preview</span>
              )}
            </div>

            {/* Source Count */}
            <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
              <span>{scene.sources.length} sources</span>
              <div className="flex space-x-1">
                {scene.sources.slice(0, 3).map((source, index) => (
                  <span key={index} className="text-xs">
                    {getSourceIcon(source.type)}
                  </span>
                ))}
                {scene.sources.length > 3 && (
                  <span className="text-xs">+{scene.sources.length - 3}</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwitchScene(scene.id);
                }}
                disabled={scene.isActive}
                className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                  scene.isActive
                    ? 'bg-red-600 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {scene.isActive ? 'LIVE' : 'Go Live'}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateScene(scene.id);
                }}
                className="p-2 bg-gray-600 hover:bg-gray-500 rounded text-white"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete scene "${scene.name}"?`)) {
                    onDeleteScene(scene.id);
                  }
                }}
                disabled={scene.isActive}
                className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Scene Sources */}
      {selectedScene && (
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Sources - {selectedScene.name}</h4>
            <button
              onClick={() => setShowSourceDialog(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Source</span>
            </button>
          </div>

          <div className="space-y-2">
            {selectedScene.sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between bg-gray-600 rounded p-3"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getSourceIcon(source.type)}</span>
                  <div>
                    <p className="text-white font-medium">{source.name}</p>
                    <p className="text-gray-400 text-sm">{source.type}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onUpdateSource(selectedScene.id, source.id, { visible: !source.visible })}
                    className={`p-2 rounded ${source.visible ? 'text-green-500' : 'text-gray-500'}`}
                  >
                    {source.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => onUpdateSource(selectedScene.id, source.id, { enabled: !source.enabled })}
                    className={`p-2 rounded ${source.enabled ? 'text-blue-500' : 'text-gray-500'}`}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  <button className="p-2 text-gray-400 hover:text-white">
                    <Move className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => onRemoveSource(selectedScene.id, source.id)}
                    className="p-2 text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {selectedScene.sources.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No sources in this scene</p>
                <p className="text-sm">Add sources to start building your scene</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Scene Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-white font-semibold mb-4">Create New Scene</h3>
            <input
              type="text"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              placeholder="Scene name"
              className="w-full bg-gray-700 text-white px-3 py-2 rounded mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={handleCreateScene}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewSceneName('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Dialog */}
      {showSourceDialog && selectedScene && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-white font-semibold mb-4">Add Source</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'screen', name: 'Screen Capture', icon: '🖥️' },
                { type: 'webcam', name: 'Webcam', icon: '📹' },
                { type: 'audio', name: 'Audio Source', icon: '🎵' },
                { type: 'image', name: 'Image', icon: '🖼️' },
                { type: 'text', name: 'Text', icon: '📝' },
                { type: 'browser', name: 'Browser Source', icon: '🌐' }
              ].map((sourceType) => (
                <button
                  key={sourceType.type}
                  onClick={() => {
                    onAddSource(selectedScene.id, {
                      type: sourceType.type as any,
                      name: sourceType.name,
                      enabled: true,
                      visible: true,
                      position: { x: 0, y: 0 },
                      size: { width: 1920, height: 1080 },
                      rotation: 0,
                      opacity: 1
                    });
                    setShowSourceDialog(false);
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded flex flex-col items-center space-y-2"
                >
                  <span className="text-2xl">{sourceType.icon}</span>
                  <span className="text-sm">{sourceType.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSourceDialog(false)}
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
