// Transcription Editor Component - Edit video based on transcription
// Built using AugmentCode tool - www.augmentcode.com

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Scissors,
  Trash2,
  Volume2,
  VolumeX,
  Clock,
  Edit3,
  Save,
  Undo,
  FastForward,
  SkipForward,
  Search,
  Filter
} from 'lucide-react';
import { TranscriptionResult, TranscriptionSegment, TranscriptionWord } from '../../../types/videoEditorTypes';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';

interface TranscriptionEditorProps {
  transcription: TranscriptionResult;
  onSegmentEdit: (segmentId: string, action: 'cut' | 'delete' | 'speed-up' | 'silence') => void;
  onWordEdit: (wordId: string, action: 'cut' | 'delete') => void;
  className?: string;
}

export const TranscriptionEditor: React.FC<TranscriptionEditorProps> = ({
  transcription,
  onSegmentEdit,
  onWordEdit,
  className = ''
}) => {
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'speech' | 'silence' | 'noise'>('all');
  const [editMode, setEditMode] = useState<'segment' | 'word'>('segment');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const transcriptionRef = useRef<HTMLDivElement>(null);

  const {
    playback,
    seek,
    play,
    pause,
    splitClip,
    removeClip,
    updateClip
  } = useVideoEditorStore();

  // Filter segments based on search and type
  const filteredSegments = transcription.segments.filter(segment => {
    const matchesSearch = searchQuery === '' || 
      segment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      segment.words.some(word => word.word.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || segment.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Handle segment selection
  const handleSegmentClick = (segmentId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      setSelectedSegments(prev => 
        prev.includes(segmentId) 
          ? prev.filter(id => id !== segmentId)
          : [...prev, segmentId]
      );
    } else {
      // Single select
      setSelectedSegments([segmentId]);
      
      // Seek to segment time
      const segment = transcription.segments.find(s => s.id === segmentId);
      if (segment) {
        seek(segment.startTime);
      }
    }
  };

  // Handle word selection
  const handleWordClick = (wordId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (editMode !== 'word') return;
    
    if (event.ctrlKey || event.metaKey) {
      setSelectedWords(prev => 
        prev.includes(wordId) 
          ? prev.filter(id => id !== wordId)
          : [...prev, wordId]
      );
    } else {
      setSelectedWords([wordId]);
      
      // Seek to word time
      const word = transcription.segments
        .flatMap(s => s.words)
        .find(w => w.id === wordId);
      if (word) {
        seek(word.startTime);
      }
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action: 'cut' | 'delete' | 'speed-up' | 'silence') => {
    if (editMode === 'segment') {
      selectedSegments.forEach(segmentId => onSegmentEdit(segmentId, action));
      setSelectedSegments([]);
    } else {
      selectedWords.forEach(wordId => onWordEdit(wordId, action === 'silence' ? 'delete' : action));
      setSelectedWords([]);
    }
  };

  // Auto-scroll to current playback position
  useEffect(() => {
    if (!transcriptionRef.current) return;
    
    const currentSegment = transcription.segments.find(segment =>
      playback.currentTime >= segment.startTime && playback.currentTime <= segment.endTime
    );
    
    if (currentSegment) {
      const segmentElement = document.getElementById(`segment-${currentSegment.id}`);
      if (segmentElement) {
        segmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [playback.currentTime, transcription.segments]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Get segment style based on type and selection
  const getSegmentStyle = (segment: TranscriptionSegment, isSelected: boolean) => {
    const baseStyle = 'p-3 rounded-lg cursor-pointer transition-all duration-200 border-2';
    
    if (isSelected) {
      return `${baseStyle} border-blue-500 bg-blue-900/30`;
    }
    
    switch (segment.type) {
      case 'silence':
        return `${baseStyle} border-red-500/30 bg-red-900/20 hover:bg-red-900/30`;
      case 'music':
        return `${baseStyle} border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/30`;
      case 'noise':
        return `${baseStyle} border-yellow-500/30 bg-yellow-900/20 hover:bg-yellow-900/30`;
      default:
        return `${baseStyle} border-gray-600 bg-gray-800 hover:bg-gray-700`;
    }
  };

  // Get word style based on selection
  const getWordStyle = (word: TranscriptionWord, isSelected: boolean) => {
    const baseStyle = 'inline-block px-1 py-0.5 rounded cursor-pointer transition-colors';
    
    if (isSelected) {
      return `${baseStyle} bg-blue-500 text-white`;
    }
    
    if (editMode === 'word') {
      return `${baseStyle} hover:bg-gray-600`;
    }
    
    return baseStyle;
  };

  return (
    <div className={`transcription-editor flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Transcription Editor</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditMode(editMode === 'segment' ? 'word' : 'segment')}
              className={`btn-ghost text-sm ${editMode === 'word' ? 'bg-blue-900/30 text-blue-400' : ''}`}
            >
              {editMode === 'segment' ? 'Segment Mode' : 'Word Mode'}
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transcription..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 text-sm"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="input text-sm w-32"
          >
            <option value="all">All</option>
            <option value="speech">Speech</option>
            <option value="silence">Silence</option>
            <option value="noise">Noise</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkAction('cut')}
              disabled={(editMode === 'segment' ? selectedSegments : selectedWords).length === 0}
              className="btn-ghost text-sm disabled:opacity-50"
              title="Cut selected"
            >
              <Scissors size={16} />
            </button>
            
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={(editMode === 'segment' ? selectedSegments : selectedWords).length === 0}
              className="btn-ghost text-sm text-red-400 disabled:opacity-50"
              title="Delete selected"
            >
              <Trash2 size={16} />
            </button>
            
            <button
              onClick={() => handleBulkAction('speed-up')}
              disabled={(editMode === 'segment' ? selectedSegments : selectedWords).length === 0}
              className="btn-ghost text-sm disabled:opacity-50"
              title="Speed up selected"
            >
              <FastForward size={16} />
            </button>
            
            {editMode === 'segment' && (
              <button
                onClick={() => handleBulkAction('silence')}
                disabled={selectedSegments.length === 0}
                className="btn-ghost text-sm disabled:opacity-50"
                title="Mark as silence"
              >
                <VolumeX size={16} />
              </button>
            )}
          </div>

          <div className="text-sm text-gray-400">
            {editMode === 'segment' 
              ? `${selectedSegments.length} segments selected`
              : `${selectedWords.length} words selected`
            }
          </div>
        </div>
      </div>

      {/* Transcription Content */}
      <div 
        ref={transcriptionRef}
        className="flex-1 overflow-auto p-4 custom-scrollbar space-y-3"
      >
        {filteredSegments.map((segment) => {
          const isSelected = selectedSegments.includes(segment.id);
          const isCurrentSegment = playback.currentTime >= segment.startTime && 
                                  playback.currentTime <= segment.endTime;
          
          return (
            <motion.div
              key={segment.id}
              id={`segment-${segment.id}`}
              className={`${getSegmentStyle(segment, isSelected)} ${
                isCurrentSegment ? 'ring-2 ring-blue-400' : ''
              }`}
              onClick={(e) => handleSegmentClick(segment.id, e)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Segment Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-gray-400">
                    {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    segment.type === 'silence' ? 'bg-red-900/50 text-red-300' :
                    segment.type === 'music' ? 'bg-purple-900/50 text-purple-300' :
                    segment.type === 'noise' ? 'bg-yellow-900/50 text-yellow-300' :
                    'bg-green-900/50 text-green-300'
                  }`}>
                    {segment.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {Math.round(segment.confidence * 100)}%
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      seek(segment.startTime);
                      play();
                    }}
                    className="text-gray-400 hover:text-white p-1"
                    title="Play from here"
                  >
                    <Play size={14} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSegmentEdit(segment.id, 'cut');
                    }}
                    className="text-gray-400 hover:text-white p-1"
                    title="Cut segment"
                  >
                    <Scissors size={14} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSegmentEdit(segment.id, 'delete');
                    }}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete segment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Segment Content */}
              <div className="text-sm leading-relaxed">
                {segment.type === 'silence' ? (
                  <div className="italic text-gray-400 flex items-center">
                    <VolumeX size={16} className="mr-2" />
                    Silence ({segment.duration.toFixed(1)}s)
                  </div>
                ) : segment.type === 'music' ? (
                  <div className="italic text-purple-300 flex items-center">
                    <Volume2 size={16} className="mr-2" />
                    Music ({segment.duration.toFixed(1)}s)
                  </div>
                ) : segment.type === 'noise' ? (
                  <div className="italic text-yellow-300 flex items-center">
                    <Volume2 size={16} className="mr-2" />
                    Background noise ({segment.duration.toFixed(1)}s)
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Text with word-level editing */}
                    <div className="leading-relaxed">
                      {segment.words.map((word, wordIndex) => {
                        const isWordSelected = selectedWords.includes(word.id);
                        const isCurrentWord = editMode === 'word' && 
                                            playback.currentTime >= word.startTime && 
                                            playback.currentTime <= word.endTime;
                        
                        return (
                          <span
                            key={word.id}
                            className={`${getWordStyle(word, isWordSelected)} ${
                              isCurrentWord ? 'bg-blue-600' : ''
                            }`}
                            onClick={(e) => handleWordClick(word.id, e)}
                            title={`${word.word} (${formatTime(word.startTime)} - ${formatTime(word.endTime)}) - ${Math.round(word.confidence * 100)}%`}
                          >
                            {word.word}
                            {wordIndex < segment.words.length - 1 && ' '}
                          </span>
                        );
                      })}
                    </div>
                    
                    {/* Speaker info */}
                    {segment.speaker && (
                      <div className="text-xs text-gray-400">
                        Speaker: {segment.speaker}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        
        {filteredSegments.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>No segments found matching your search</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>
            {transcription.segments.length} segments • {transcription.wordCount} words
          </div>
          <div>
            Duration: {formatTime(transcription.duration)} • Language: {transcription.language}
          </div>
        </div>
      </div>
    </div>
  );
};
