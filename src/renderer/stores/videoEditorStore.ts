// Video Editor State Management Store
// Built using AugmentCode tool - www.augmentcode.com

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  VideoProject,
  Track,
  MediaClip,
  PlaybackState,
  TimelineViewport,
  EditingTool,
  UndoRedoAction,
  TimelineSelection,
  ExportSettings,
  RenderJob,
  Marker,
  ProjectSettings,
  TranscriptionResult,
  AIProcessingJob,
  SmartEditingOptions
} from '../types/videoEditorTypes';

interface VideoEditorState {
  // Project state
  currentProject: VideoProject | null;
  projectModified: boolean;
  
  // Playback state
  playback: PlaybackState;
  
  // Timeline state
  viewport: TimelineViewport;
  selection: TimelineSelection;
  currentTool: EditingTool;
  
  // UI state
  previewQuality: 'low' | 'medium' | 'high';
  showWaveforms: boolean;
  showThumbnails: boolean;
  snapToGrid: boolean;
  gridSize: number;
  
  // Undo/Redo system
  history: UndoRedoAction[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Rendering state
  renderJobs: RenderJob[];
  isExporting: boolean;
  exportProgress: number;
  
  // Error handling
  errors: string[];
  warnings: string[];

  // AI Processing state
  transcriptionResults: Map<string, TranscriptionResult>;
  aiJobs: AIProcessingJob[];
  smartEditingOptions: SmartEditingOptions;
  
  // Actions - Project Management
  createNewProject: (settings: ProjectSettings) => void;
  loadProject: (project: VideoProject) => void;
  saveProject: () => Promise<void>;
  setProjectModified: (modified: boolean) => void;
  
  // Actions - Timeline Management
  addTrack: (type: 'video' | 'audio', name?: string) => string;
  removeTrack: (trackId: string) => void;
  reorderTracks: (trackIds: string[]) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  
  // Actions - Clip Management
  addClip: (clip: MediaClip, trackId: string, position?: number) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<MediaClip>) => void;
  moveClip: (clipId: string, trackId: string, position: number) => void;
  splitClip: (clipId: string, time: number) => void;
  trimClip: (clipId: string, start: number, end: number) => void;
  
  // Actions - Playback Control
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;
  setLoopRegion: (start: number, end: number) => void;
  
  // Actions - Timeline Viewport
  setViewport: (viewport: Partial<TimelineViewport>) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomToSelection: () => void;
  
  // Actions - Selection
  selectClips: (clipIds: string[]) => void;
  selectTracks: (trackIds: string[]) => void;
  selectTimeRange: (start: number, end: number) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // Actions - Tools
  setCurrentTool: (tool: EditingTool) => void;
  
  // Actions - Undo/Redo
  executeAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  
  // Actions - Markers
  addMarker: (time: number, name: string, type?: 'chapter' | 'edit' | 'custom') => void;
  removeMarker: (markerId: string) => void;
  updateMarker: (markerId: string, updates: Partial<Marker>) => void;
  
  // Actions - Export
  startExport: (settings: ExportSettings) => Promise<void>;
  cancelExport: () => void;
  
  // Actions - Error Handling
  addError: (error: string) => void;
  addWarning: (warning: string) => void;
  clearErrors: () => void;
  clearWarnings: () => void;
  
  // Actions - UI Settings
  setPreviewQuality: (quality: 'low' | 'medium' | 'high') => void;
  toggleWaveforms: () => void;
  toggleThumbnails: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;

  // Actions - AI Processing
  addTranscriptionResult: (clipId: string, result: TranscriptionResult) => void;
  getTranscriptionResult: (clipId: string) => TranscriptionResult | undefined;
  addAIJob: (job: AIProcessingJob) => void;
  updateAIJob: (jobId: string, updates: Partial<AIProcessingJob>) => void;
  removeAIJob: (jobId: string) => void;
  setSmartEditingOptions: (options: SmartEditingOptions) => void;
}

const defaultProjectSettings: ProjectSettings = {
  name: 'Untitled Project',
  width: 1920,
  height: 1080,
  frameRate: 30,
  sampleRate: 48000,
  duration: 0,
  backgroundColor: '#000000'
};

const defaultPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1,
  loop: false
};

const defaultViewport: TimelineViewport = {
  startTime: 0,
  endTime: 60,
  pixelsPerSecond: 100,
  scrollLeft: 0
};

const defaultSelection: TimelineSelection = {
  clips: [],
  tracks: []
};

const defaultTool: EditingTool = {
  type: 'select',
  cursor: 'default'
};

export const useVideoEditorStore = create<VideoEditorState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentProject: null,
    projectModified: false,
    playback: defaultPlaybackState,
    viewport: defaultViewport,
    selection: defaultSelection,
    currentTool: defaultTool,
    previewQuality: 'medium',
    showWaveforms: true,
    showThumbnails: true,
    snapToGrid: true,
    gridSize: 1,
    history: [],
    historyIndex: -1,
    maxHistorySize: 100,
    renderJobs: [],
    isExporting: false,
    exportProgress: 0,
    errors: [],
    warnings: [],
    transcriptionResults: new Map(),
    aiJobs: [],
    smartEditingOptions: {
      autoRemoveSilence: true,
      silenceThreshold: -40,
      minSilenceDuration: 0.5,
      removeFillerWords: true,
      fillerWords: ['um', 'uh', 'like', 'you know', 'so', 'actually'],
      generateJumpCuts: true,
      enhanceAudio: true,
      transcribeVideo: true
    },

    // Project Management Actions
    createNewProject: (settings) => {
      const newProject: VideoProject = {
        id: crypto.randomUUID(),
        name: settings.name,
        version: '1.0.0',
        created: new Date(),
        modified: new Date(),
        settings,
        tracks: [],
        markers: [],
        exportSettings: {
          format: 'mp4',
          codec: 'h264',
          quality: 'high',
          audioCodec: 'aac',
          audioBitrate: 128,
          outputPath: ''
        },
        metadata: {}
      };
      
      set({
        currentProject: newProject,
        projectModified: false,
        playback: defaultPlaybackState,
        viewport: defaultViewport,
        selection: defaultSelection,
        history: [],
        historyIndex: -1
      });
    },

    loadProject: (project) => {
      set({
        currentProject: project,
        projectModified: false,
        playback: defaultPlaybackState,
        viewport: defaultViewport,
        selection: defaultSelection,
        history: [],
        historyIndex: -1
      });
    },

    saveProject: async () => {
      const { currentProject } = get();
      if (!currentProject) return;
      
      // TODO: Implement actual save logic with electron file system
      currentProject.modified = new Date();
      set({ projectModified: false });
    },

    setProjectModified: (modified) => set({ projectModified: modified }),

    // Timeline Management Actions
    addTrack: (type, name) => {
      const { currentProject } = get();
      if (!currentProject) return '';
      
      const trackId = crypto.randomUUID();
      const newTrack: Track = {
        id: trackId,
        name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${currentProject.tracks.length + 1}`,
        type,
        clips: [],
        muted: false,
        solo: false,
        locked: false,
        height: type === 'video' ? 80 : 60,
        color: type === 'video' ? '#3b82f6' : '#10b981',
        visible: true
      };
      
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: [...state.currentProject.tracks, newTrack]
        } : null,
        projectModified: true
      }));
      
      return trackId;
    },

    removeTrack: (trackId) => {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.filter(track => track.id !== trackId)
        } : null,
        projectModified: true
      }));
    },

    reorderTracks: (trackIds) => {
      const { currentProject } = get();
      if (!currentProject) return;
      
      const reorderedTracks = trackIds.map(id => 
        currentProject.tracks.find(track => track.id === id)
      ).filter(Boolean) as Track[];
      
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: reorderedTracks
        } : null,
        projectModified: true
      }));
    },

    updateTrack: (trackId, updates) => {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(track =>
            track.id === trackId ? { ...track, ...updates } : track
          )
        } : null,
        projectModified: true
      }));
    },

    // Clip Management Actions
    addClip: (clip, trackId, position) => {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(track =>
            track.id === trackId ? {
              ...track,
              clips: position !== undefined 
                ? [...track.clips.slice(0, position), clip, ...track.clips.slice(position)]
                : [...track.clips, clip]
            } : track
          )
        } : null,
        projectModified: true
      }));
    },

    removeClip: (clipId) => {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(track => ({
            ...track,
            clips: track.clips.filter(clip => clip.id !== clipId)
          }))
        } : null,
        projectModified: true
      }));
    },

    updateClip: (clipId, updates) => {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(track => ({
            ...track,
            clips: track.clips.map(clip =>
              clip.id === clipId ? { ...clip, ...updates } : clip
            )
          }))
        } : null,
        projectModified: true
      }));
    },

    moveClip: (clipId, targetTrackId, position) => {
      const { currentProject } = get();
      if (!currentProject) return;
      
      let clipToMove: MediaClip | null = null;
      
      // Find and remove the clip from its current track
      const tracksWithoutClip = currentProject.tracks.map(track => {
        const clipIndex = track.clips.findIndex(clip => clip.id === clipId);
        if (clipIndex !== -1) {
          clipToMove = track.clips[clipIndex];
          return {
            ...track,
            clips: track.clips.filter(clip => clip.id !== clipId)
          };
        }
        return track;
      });
      
      if (!clipToMove) return;
      
      // Add the clip to the target track
      const finalTracks = tracksWithoutClip.map(track => {
        if (track.id === targetTrackId) {
          clipToMove!.trackId = targetTrackId;
          clipToMove!.startTime = position;
          return {
            ...track,
            clips: [...track.clips, clipToMove!].sort((a, b) => a.startTime - b.startTime)
          };
        }
        return track;
      });
      
      set({
        currentProject: {
          ...currentProject,
          tracks: finalTracks
        },
        projectModified: true
      });
    },

    splitClip: (clipId, time) => {
      // TODO: Implement clip splitting logic
      set({ projectModified: true });
    },

    trimClip: (clipId, start, end) => {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(track => ({
            ...track,
            clips: track.clips.map(clip =>
              clip.id === clipId ? { 
                ...clip, 
                trimStart: start, 
                trimEnd: end,
                duration: end - start
              } : clip
            )
          }))
        } : null,
        projectModified: true
      }));
    },

    // Playback Control Actions
    play: () => set((state) => ({ 
      playback: { ...state.playback, isPlaying: true } 
    })),
    
    pause: () => set((state) => ({ 
      playback: { ...state.playback, isPlaying: false } 
    })),
    
    stop: () => set((state) => ({ 
      playback: { ...state.playback, isPlaying: false, currentTime: 0 } 
    })),
    
    seek: (time) => set((state) => ({ 
      playback: { ...state.playback, currentTime: time } 
    })),
    
    setPlaybackRate: (rate) => set((state) => ({ 
      playback: { ...state.playback, playbackRate: rate } 
    })),
    
    toggleLoop: () => set((state) => ({ 
      playback: { ...state.playback, loop: !state.playback.loop } 
    })),
    
    setLoopRegion: (start, end) => set((state) => ({ 
      playback: { ...state.playback, loopStart: start, loopEnd: end } 
    })),

    // Timeline Viewport Actions
    setViewport: (updates) => set((state) => ({
      viewport: { ...state.viewport, ...updates }
    })),

    zoomIn: () => set((state) => ({
      viewport: { 
        ...state.viewport, 
        pixelsPerSecond: Math.min(state.viewport.pixelsPerSecond * 1.5, 1000) 
      }
    })),

    zoomOut: () => set((state) => ({
      viewport: { 
        ...state.viewport, 
        pixelsPerSecond: Math.max(state.viewport.pixelsPerSecond / 1.5, 10) 
      }
    })),

    zoomToFit: () => {
      const { currentProject } = get();
      if (!currentProject) return;
      
      const duration = currentProject.settings.duration || 60;
      set((state) => ({
        viewport: {
          ...state.viewport,
          startTime: 0,
          endTime: duration,
          pixelsPerSecond: 800 / duration // Assuming 800px timeline width
        }
      }));
    },

    zoomToSelection: () => {
      const { selection } = get();
      if (!selection.timeRange) return;
      
      const duration = selection.timeRange.end - selection.timeRange.start;
      set((state) => ({
        viewport: {
          ...state.viewport,
          startTime: selection.timeRange!.start,
          endTime: selection.timeRange!.end,
          pixelsPerSecond: 800 / duration
        }
      }));
    },

    // Selection Actions
    selectClips: (clipIds) => set((state) => ({
      selection: { ...state.selection, clips: clipIds }
    })),

    selectTracks: (trackIds) => set((state) => ({
      selection: { ...state.selection, tracks: trackIds }
    })),

    selectTimeRange: (start, end) => set((state) => ({
      selection: { ...state.selection, timeRange: { start, end } }
    })),

    clearSelection: () => set({ selection: defaultSelection }),

    selectAll: () => {
      const { currentProject } = get();
      if (!currentProject) return;
      
      const allClipIds = currentProject.tracks.flatMap(track => 
        track.clips.map(clip => clip.id)
      );
      const allTrackIds = currentProject.tracks.map(track => track.id);
      
      set({
        selection: {
          clips: allClipIds,
          tracks: allTrackIds,
          timeRange: { start: 0, end: currentProject.settings.duration }
        }
      });
    },

    // Tool Actions
    setCurrentTool: (tool) => set({ currentTool: tool }),

    // Undo/Redo Actions
    executeAction: (action) => {
      const { history, historyIndex, maxHistorySize } = get();
      
      action.execute();
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(action);
      
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
        projectModified: true
      });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= 0) {
        history[historyIndex].undo();
        set({ 
          historyIndex: historyIndex - 1,
          projectModified: true 
        });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        history[nextIndex].execute();
        set({ 
          historyIndex: nextIndex,
          projectModified: true 
        });
      }
    },

    canUndo: () => get().historyIndex >= 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
    clearHistory: () => set({ history: [], historyIndex: -1 }),

    // Marker Actions
    addMarker: (time, name, type = 'custom') => {
      const marker: Marker = {
        id: crypto.randomUUID(),
        time,
        name,
        color: type === 'chapter' ? '#f59e0b' : type === 'edit' ? '#ef4444' : '#8b5cf6',
        type
      };
      
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          markers: [...state.currentProject.markers, marker].sort((a, b) => a.time - b.time)
        } : null,
        projectModified: true
      }));
    },

    removeMarker: (markerId) => {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          markers: state.currentProject.markers.filter(marker => marker.id !== markerId)
        } : null,
        projectModified: true
      }));
    },

    updateMarker: (markerId, updates) => {
      set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          markers: state.currentProject.markers.map(marker =>
            marker.id === markerId ? { ...marker, ...updates } : marker
          )
        } : null,
        projectModified: true
      }));
    },

    // Export Actions
    startExport: async (settings) => {
      set({ isExporting: true, exportProgress: 0 });
      
      // TODO: Implement actual export logic
      // This would integrate with FFmpeg for video rendering
      
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        set({ exportProgress: i });
      }
      
      set({ isExporting: false, exportProgress: 0 });
    },

    cancelExport: () => {
      set({ isExporting: false, exportProgress: 0 });
    },

    // Error Handling Actions
    addError: (error) => set((state) => ({
      errors: [...state.errors, error]
    })),

    addWarning: (warning) => set((state) => ({
      warnings: [...state.warnings, warning]
    })),

    clearErrors: () => set({ errors: [] }),
    clearWarnings: () => set({ warnings: [] }),

    // UI Settings Actions
    setPreviewQuality: (quality) => set({ previewQuality: quality }),
    toggleWaveforms: () => set((state) => ({ showWaveforms: !state.showWaveforms })),
    toggleThumbnails: () => set((state) => ({ showThumbnails: !state.showThumbnails })),
    toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
    setGridSize: (size) => set({ gridSize: size }),

    // AI Processing Actions
    addTranscriptionResult: (clipId, result) => set((state) => {
      const newMap = new Map(state.transcriptionResults);
      newMap.set(clipId, result);
      return { transcriptionResults: newMap };
    }),

    getTranscriptionResult: (clipId) => {
      const { transcriptionResults } = get();
      return transcriptionResults.get(clipId);
    },

    addAIJob: (job) => set((state) => ({
      aiJobs: [...state.aiJobs, job]
    })),

    updateAIJob: (jobId, updates) => set((state) => ({
      aiJobs: state.aiJobs.map(job =>
        job.id === jobId ? { ...job, ...updates } : job
      )
    })),

    removeAIJob: (jobId) => set((state) => ({
      aiJobs: state.aiJobs.filter(job => job.id !== jobId)
    })),

    setSmartEditingOptions: (options) => set({ smartEditingOptions: options })
  }))
);
