// Editing Tools Component - Trim & Cut Tools for precise video editing
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MousePointer2,
  Scissors,
  Move,
  RotateCcw,
  RotateCw,
  Undo,
  Redo,
  Copy,
  Trash2,
  Split,
  Merge,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { EditingTool } from '../../../types/videoEditorTypes';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';

interface EditingToolsProps {
  className?: string;
}

export const EditingTools: React.FC<EditingToolsProps> = ({ className = '' }) => {
  const [activeToolGroup, setActiveToolGroup] = useState<string>('selection');

  const {
    currentTool,
    selection,
    setCurrentTool,
    undo,
    redo,
    canUndo,
    canRedo,
    removeClip,
    splitClip,
    playback
  } = useVideoEditorStore();

  // Tool definitions
  const toolGroups = [
    {
      id: 'selection',
      name: 'Selection',
      tools: [
        {
          id: 'select',
          name: 'Select',
          icon: MousePointer2,
          cursor: 'default',
          shortcut: 'V',
          description: 'Select and move clips'
        },
        {
          id: 'trim',
          name: 'Trim',
          icon: Move,
          cursor: 'ew-resize',
          shortcut: 'T',
          description: 'Trim clip edges'
        }
      ]
    },
    {
      id: 'cutting',
      name: 'Cutting',
      tools: [
        {
          id: 'razor',
          name: 'Razor',
          icon: Scissors,
          cursor: 'crosshair',
          shortcut: 'C',
          description: 'Cut clips at playhead'
        },
        {
          id: 'split',
          name: 'Split',
          icon: Split,
          cursor: 'crosshair',
          shortcut: 'S',
          description: 'Split clip at current time'
        }
      ]
    },
    {
      id: 'editing',
      name: 'Editing',
      tools: [
        {
          id: 'slip',
          name: 'Slip',
          icon: AlignCenter,
          cursor: 'grab',
          shortcut: 'Y',
          description: 'Slip clip content'
        },
        {
          id: 'slide',
          name: 'Slide',
          icon: AlignLeft,
          cursor: 'grab',
          shortcut: 'U',
          description: 'Slide clip position'
        },
        {
          id: 'ripple',
          name: 'Ripple',
          icon: AlignRight,
          cursor: 'grab',
          shortcut: 'B',
          description: 'Ripple edit mode'
        },
        {
          id: 'roll',
          name: 'Roll',
          icon: RotateCw,
          cursor: 'grab',
          shortcut: 'N',
          description: 'Roll edit mode'
        }
      ]
    }
  ];

  // Handle tool selection
  const handleToolSelect = (toolId: string) => {
    const tool = toolGroups
      .flatMap(group => group.tools)
      .find(t => t.id === toolId);
    
    if (tool) {
      const editingTool: EditingTool = {
        type: toolId as any,
        cursor: tool.cursor
      };
      setCurrentTool(editingTool);
    }
  };

  // Handle quick actions
  const handleSplitAtPlayhead = () => {
    if (selection.clips.length === 0) return;
    
    selection.clips.forEach(clipId => {
      splitClip(clipId, playback.currentTime);
    });
  };

  const handleDeleteSelected = () => {
    if (selection.clips.length === 0) return;
    
    selection.clips.forEach(clipId => {
      removeClip(clipId);
    });
  };

  const handleCopySelected = () => {
    // TODO: Implement clipboard functionality
    console.log('Copy selected clips:', selection.clips);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      
      // Tool shortcuts
      const toolShortcuts: Record<string, string> = {
        'v': 'select',
        't': 'trim',
        'c': 'razor',
        's': 'split',
        'y': 'slip',
        'u': 'slide',
        'b': 'ripple',
        'n': 'roll'
      };
      
      const toolId = toolShortcuts[e.key.toLowerCase()];
      if (toolId) {
        e.preventDefault();
        handleToolSelect(toolId);
        return;
      }
      
      // Action shortcuts
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selection.clips.length > 0) {
            e.preventDefault();
            handleDeleteSelected();
          }
          break;
        case 'x':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleDeleteSelected();
          }
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleCopySelected();
          }
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              if (canRedo()) redo();
            } else {
              if (canUndo()) undo();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selection.clips, canUndo, canRedo, undo, redo]);

  return (
    <div className={`editing-tools bg-gray-800 border-b border-gray-700 ${className}`}>
      <div className="flex items-center justify-between p-3">
        {/* Tool Groups */}
        <div className="flex items-center space-x-6">
          {toolGroups.map(group => (
            <div key={group.id} className="flex items-center space-x-1">
              <span className="text-xs text-gray-400 font-medium mr-2">
                {group.name}
              </span>
              
              {group.tools.map(tool => {
                const Icon = tool.icon;
                const isActive = currentTool.type === tool.id;
                
                return (
                  <motion.button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={`${tool.name} (${tool.shortcut}) - ${tool.description}`}
                  >
                    <Icon size={18} />
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {/* Undo/Redo */}
          <div className="flex items-center space-x-1 mr-4">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className="btn-ghost p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={18} />
            </button>
            
            <button
              onClick={redo}
              disabled={!canRedo()}
              className="btn-ghost p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo size={18} />
            </button>
          </div>

          {/* Clip Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleSplitAtPlayhead}
              disabled={selection.clips.length === 0}
              className="btn-ghost p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Split at playhead (S)"
            >
              <Split size={18} />
            </button>
            
            <button
              onClick={handleCopySelected}
              disabled={selection.clips.length === 0}
              className="btn-ghost p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy selected (Ctrl+C)"
            >
              <Copy size={18} />
            </button>
            
            <button
              onClick={handleDeleteSelected}
              disabled={selection.clips.length === 0}
              className="btn-ghost p-2 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete selected (Delete)"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tool Info Bar */}
      {currentTool && (
        <div className="px-3 pb-2">
          <div className="text-xs text-gray-400">
            Current tool: <span className="text-white font-medium">
              {toolGroups
                .flatMap(g => g.tools)
                .find(t => t.id === currentTool.type)?.name || currentTool.type}
            </span>
            {selection.clips.length > 0 && (
              <span className="ml-4">
                Selected: <span className="text-blue-400">{selection.clips.length} clip(s)</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
