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
  SmartEditingOptions,
  Timeline,
  MulticamGroup,
  MulticamAngle,
  SyncPoint,
  PodcastModeSettings,
  CameraSwitchEvent,
  MulticamPreview
} from '../types/videoEditorTypes';

interface VideoEditorState {
  // Project state
  currentProject: VideoProject | null;
  projectModified: boolean;

  // Multiple Timeline state
  timelines: Timeline[];
  activeTimelineId: string | null;

  // Playback state
  playback: PlaybackState;

  // Timeline state
  viewport: TimelineViewport;
  selection: TimelineSelection;
  currentTool: EditingTool;

  // Multicam state
  multicamGroups: MulticamGroup[];
  activeMulticamGroup: string | null;
  multicamPreview: MulticamPreview | null;
  cameraSwitchEvents: CameraSwitchEvent[];

  // Podcast mode state
  podcastMode: PodcastModeSettings;
  isPodcastModeActive: boolean;

  // UI state
  previewQuality: 'low' | 'medium' | 'high';
  showWaveforms: boolean;
  showThumbnails: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showMulticamPreview: boolean;
  multicamPreviewLayout: 'grid' | 'sidebar' | 'overlay';

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

  // Actions - Multiple Timeline Management
  createTimeline: (name: string, settings?: ProjectSettings) => string;
  removeTimeline: (timelineId: string) => void;
  switchTimeline: (timelineId: string) => void;
  updateTimeline: (timelineId: string, updates: Partial<Timeline>) => void;
  duplicateTimeline: (timelineId: string, newName: string) => string;

  // Actions - Multicam Management
  createMulticamGroup: (name: string, trackIds: string[]) => string;
  removeMulticamGroup: (groupId: string) => void;
  addTrackToMulticamGroup: (groupId: string, trackId: string, angle: number) => void;
  removeTrackFromMulticamGroup: (groupId: string, trackId: string) => void;
  switchMulticamAngle: (groupId: string, angle: number, time?: number) => void;
  addSyncPoint: (groupId: string, time: number, trackOffsets: { [trackId: string]: number }) => void;
  autoSyncMulticam: (groupId: string) => Promise<void>;

  // Actions - Podcast Mode
  enablePodcastMode: (settings: PodcastModeSettings) => void;
  disablePodcastMode: () => void;
  addPodcastSpeaker: (speaker: Omit<PodcastSpeaker, 'id'>) => string;
  removePodcastSpeaker: (speakerId: string) => void;
  switchToSpeaker: (speakerId: string, time?: number) => void;
  setQuickSwitchKey: (key: string, trackId: string) => void;

  // Actions - Camera Switching
  addCameraSwitchEvent: (time: number, fromAngle: number, toAngle: number, transitionType?: 'cut' | 'fade' | 'dissolve') => void;
  removeCameraSwitchEvent: (eventId: string) => void;
  updateCameraSwitchEvent: (eventId: string, updates: Partial<CameraSwitchEvent>) => void;

  // Actions - Multicam Preview
  toggleMulticamPreview: () => void;
  setMulticamPreviewLayout: (layout: 'grid' | 'sidebar' | 'overlay') => void;
  updateMulticamPreview: (preview: MulticamPreview) => void;
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

const defaultPodcastMode: PodcastModeSettings = {
  enabled: false,
  speakers: [],
  autoSwitchOnSpeaker: false,
  switchTransitionDuration: 0.5,
  showSpeakerLabels: true,
  quickSwitchKeys: {}
};

export const useVideoEditorStore = create<VideoEditorState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentProject: null,
    projectModified: false,

    // Multiple Timeline state
    timelines: [],
    activeTimelineId: null,

    // Multicam state
    multicamGroups: [],
    activeMulticamGroup: null,
    multicamPreview: null,
    cameraSwitchEvents: [],

    // Podcast mode state
    podcastMode: defaultPodcastMode,
    isPodcastModeActive: false,

    playback: defaultPlaybackState,
    viewport: defaultViewport,
    selection: defaultSelection,
    currentTool: defaultTool,
    previewQuality: 'medium',
    showWaveforms: true,
    showThumbnails: true,
    snapToGrid: true,
    gridSize: 1,
    showMulticamPreview: false,
    multicamPreviewLayout: 'grid',
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

    setSmartEditingOptions: (options) => set({ smartEditingOptions: options }),

    // Multiple Timeline Management Actions
    createTimeline: (name, settings) => {
      const timelineId = crypto.randomUUID();
      const newTimeline: Timeline = {
        id: timelineId,
        name,
        tracks: [],
        duration: 0,
        settings: settings || defaultProjectSettings,
        markers: [],
        created: new Date(),
        modified: new Date()
      };

      set((state) => ({
        timelines: [...state.timelines, newTimeline],
        activeTimelineId: state.activeTimelineId || timelineId,
        projectModified: true
      }));

      return timelineId;
    },

    removeTimeline: (timelineId) => {
      set((state) => ({
        timelines: state.timelines.filter(timeline => timeline.id !== timelineId),
        activeTimelineId: state.activeTimelineId === timelineId
          ? (state.timelines.length > 1 ? state.timelines[0].id : null)
          : state.activeTimelineId,
        projectModified: true
      }));
    },

    switchTimeline: (timelineId) => {
      const { timelines } = get();
      const timeline = timelines.find(t => t.id === timelineId);
      if (!timeline) return;

      set((state) => ({
        activeTimelineId: timelineId,
        // Update current project tracks to match the active timeline
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: timeline.tracks
        } : null
      }));
    },

    updateTimeline: (timelineId, updates) => {
      set((state) => ({
        timelines: state.timelines.map(timeline =>
          timeline.id === timelineId
            ? { ...timeline, ...updates, modified: new Date() }
            : timeline
        ),
        projectModified: true
      }));
    },

    duplicateTimeline: (timelineId, newName) => {
      const { timelines } = get();
      const originalTimeline = timelines.find(t => t.id === timelineId);
      if (!originalTimeline) return '';

      const newTimelineId = crypto.randomUUID();
      const duplicatedTimeline: Timeline = {
        ...originalTimeline,
        id: newTimelineId,
        name: newName,
        created: new Date(),
        modified: new Date(),
        tracks: originalTimeline.tracks.map(track => ({
          ...track,
          id: crypto.randomUUID(),
          clips: track.clips.map(clip => ({
            ...clip,
            id: crypto.randomUUID()
          }))
        }))
      };

      set((state) => ({
        timelines: [...state.timelines, duplicatedTimeline],
        projectModified: true
      }));

      return newTimelineId;
    },

    // Multicam Management Actions
    createMulticamGroup: (name, trackIds) => {
      const groupId = crypto.randomUUID();
      const newGroup: MulticamGroup = {
        id: groupId,
        name,
        tracks: trackIds,
        syncPoints: [],
        activeAngle: 0,
        angles: trackIds.map((trackId, index) => ({
          id: crypto.randomUUID(),
          name: `Angle ${index + 1}`,
          trackId,
          cameraNumber: index + 1,
          color: `hsl(${(index * 60) % 360}, 70%, 50%)`
        }))
      };

      // Update tracks to mark them as multicam sources
      set((state) => ({
        multicamGroups: [...state.multicamGroups, newGroup],
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(track =>
            trackIds.includes(track.id)
              ? {
                  ...track,
                  isMulticamSource: true,
                  multicamGroupId: groupId,
                  cameraAngle: trackIds.indexOf(track.id)
                }
              : track
          )
        } : null,
        activeMulticamGroup: state.activeMulticamGroup || groupId,
        projectModified: true
      }));

      return groupId;
    },

    removeMulticamGroup: (groupId) => {
      set((state) => ({
        multicamGroups: state.multicamGroups.filter(group => group.id !== groupId),
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(track =>
            track.multicamGroupId === groupId
              ? {
                  ...track,
                  isMulticamSource: false,
                  multicamGroupId: undefined,
                  cameraAngle: undefined
                }
              : track
          )
        } : null,
        activeMulticamGroup: state.activeMulticamGroup === groupId ? null : state.activeMulticamGroup,
        projectModified: true
      }));
    },

    addTrackToMulticamGroup: (groupId, trackId, angle) => {
      set((state) => ({
        multicamGroups: state.multicamGroups.map(group =>
          group.id === groupId ? {
            ...group,
            tracks: [...group.tracks, trackId],
            angles: [...group.angles, {
              id: crypto.randomUUID(),
              name: `Angle ${angle + 1}`,
              trackId,
              cameraNumber: angle + 1,
              color: `hsl(${(angle * 60) % 360}, 70%, 50%)`
            }]
          } : group
        ),
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(track =>
            track.id === trackId
              ? {
                  ...track,
                  isMulticamSource: true,
                  multicamGroupId: groupId,
                  cameraAngle: angle
                }
              : track
          )
        } : null,
        projectModified: true
      }));
    },

    removeTrackFromMulticamGroup: (groupId, trackId) => {
      set((state) => ({
        multicamGroups: state.multicamGroups.map(group =>
          group.id === groupId ? {
            ...group,
            tracks: group.tracks.filter(id => id !== trackId),
            angles: group.angles.filter(angle => angle.trackId !== trackId)
          } : group
        ),
        currentProject: state.currentProject ? {
          ...state.currentProject,
          tracks: state.currentProject.tracks.map(track =>
            track.id === trackId
              ? {
                  ...track,
                  isMulticamSource: false,
                  multicamGroupId: undefined,
                  cameraAngle: undefined
                }
              : track
          )
        } : null,
        projectModified: true
      }));
    },

    switchMulticamAngle: (groupId, angle, time) => {
      const currentTime = time || get().playback.currentTime;

      set((state) => ({
        multicamGroups: state.multicamGroups.map(group =>
          group.id === groupId ? { ...group, activeAngle: angle } : group
        ),
        cameraSwitchEvents: [...state.cameraSwitchEvents, {
          id: crypto.randomUUID(),
          time: currentTime,
          fromAngle: state.multicamGroups.find(g => g.id === groupId)?.activeAngle || 0,
          toAngle: angle,
          transitionType: 'cut',
          transitionDuration: 0
        }],
        projectModified: true
      }));
    },

    addSyncPoint: (groupId, time, trackOffsets) => {
      const syncPoint: SyncPoint = {
        id: crypto.randomUUID(),
        time,
        trackOffsets,
        type: 'manual'
      };

      set((state) => ({
        multicamGroups: state.multicamGroups.map(group =>
          group.id === groupId ? {
            ...group,
            syncPoints: [...group.syncPoints, syncPoint].sort((a, b) => a.time - b.time)
          } : group
        ),
        projectModified: true
      }));
    },

    autoSyncMulticam: async (groupId) => {
      // TODO: Implement automatic audio-based synchronization
      // This would analyze audio waveforms to find sync points
      console.log('Auto-sync multicam group:', groupId);
    },

    // Podcast Mode Actions
    enablePodcastMode: (settings) => {
      set({
        podcastMode: settings,
        isPodcastModeActive: true,
        projectModified: true
      });
    },

    disablePodcastMode: () => {
      set((state) => ({
        podcastMode: { ...state.podcastMode, enabled: false },
        isPodcastModeActive: false,
        projectModified: true
      }));
    },

    addPodcastSpeaker: (speaker) => {
      const speakerId = crypto.randomUUID();
      const newSpeaker: PodcastSpeaker = {
        ...speaker,
        id: speakerId
      };

      set((state) => ({
        podcastMode: {
          ...state.podcastMode,
          speakers: [...state.podcastMode.speakers, newSpeaker]
        },
        projectModified: true
      }));

      return speakerId;
    },

    removePodcastSpeaker: (speakerId) => {
      set((state) => ({
        podcastMode: {
          ...state.podcastMode,
          speakers: state.podcastMode.speakers.filter(s => s.id !== speakerId)
        },
        projectModified: true
      }));
    },

    switchToSpeaker: (speakerId, time) => {
      const { podcastMode, playback } = get();
      const speaker = podcastMode.speakers.find(s => s.id === speakerId);
      if (!speaker) return;

      const currentTime = time || playback.currentTime;

      // Find the multicam group that contains this speaker's track
      const { multicamGroups } = get();
      const group = multicamGroups.find(g => g.tracks.includes(speaker.trackId));
      if (group) {
        const angle = group.angles.findIndex(a => a.trackId === speaker.trackId);
        if (angle !== -1) {
          get().switchMulticamAngle(group.id, angle, currentTime);
        }
      }
    },

    setQuickSwitchKey: (key, trackId) => {
      set((state) => ({
        podcastMode: {
          ...state.podcastMode,
          quickSwitchKeys: {
            ...state.podcastMode.quickSwitchKeys,
            [key]: trackId
          }
        },
        projectModified: true
      }));
    },

    // Camera Switching Actions
    addCameraSwitchEvent: (time, fromAngle, toAngle, transitionType = 'cut') => {
      const event: CameraSwitchEvent = {
        id: crypto.randomUUID(),
        time,
        fromAngle,
        toAngle,
        transitionType,
        transitionDuration: transitionType === 'cut' ? 0 : 0.5
      };

      set((state) => ({
        cameraSwitchEvents: [...state.cameraSwitchEvents, event].sort((a, b) => a.time - b.time),
        projectModified: true
      }));
    },

    removeCameraSwitchEvent: (eventId) => {
      set((state) => ({
        cameraSwitchEvents: state.cameraSwitchEvents.filter(e => e.id !== eventId),
        projectModified: true
      }));
    },

    updateCameraSwitchEvent: (eventId, updates) => {
      set((state) => ({
        cameraSwitchEvents: state.cameraSwitchEvents.map(event =>
          event.id === eventId ? { ...event, ...updates } : event
        ),
        projectModified: true
      }));
    },

    // Multicam Preview Actions
    toggleMulticamPreview: () => {
      set((state) => ({
        showMulticamPreview: !state.showMulticamPreview
      }));
    },

    setMulticamPreviewLayout: (layout) => {
      set({ multicamPreviewLayout: layout });
    },

    updateMulticamPreview: (preview) => {
      set({ multicamPreview: preview });
    }
  }))
);
