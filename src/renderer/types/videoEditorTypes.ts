// Video Editor Type Definitions
// Built using AugmentCode tool - www.augmentcode.com

export interface TimelinePosition {
  seconds: number;
  frames: number;
}

export interface MediaClip {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  filePath: string;
  duration: number;
  startTime: number;
  endTime: number;
  trimStart: number;
  trimEnd: number;
  trackId: string;
  locked: boolean;
  muted: boolean;
  volume: number;
  effects: Effect[];
  transitions: {
    in?: Transition;
    out?: Transition;
  };
}

export interface VideoClip extends MediaClip {
  type: 'video';
  width: number;
  height: number;
  frameRate: number;
  codec: string;
  hasAudio: boolean;
  thumbnail?: string;
  transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    opacity: number;
  };
}

export interface AudioClip extends MediaClip {
  type: 'audio';
  sampleRate: number;
  channels: number;
  bitRate: number;
  waveformData?: Float32Array[];
  audioGain: number;
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio';
  clips: MediaClip[];
  muted: boolean;
  solo: boolean;
  locked: boolean;
  height: number;
  color: string;
  visible: boolean;
}

export interface Transition {
  id: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom';
  duration: number;
  properties: Record<string, any>;
}

export interface Effect {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  properties: Record<string, any>;
}

export interface Marker {
  id: string;
  time: number;
  name: string;
  color: string;
  type: 'chapter' | 'edit' | 'custom';
}

export interface ProjectSettings {
  name: string;
  width: number;
  height: number;
  frameRate: number;
  sampleRate: number;
  duration: number;
  backgroundColor: string;
}

export interface ExportSettings {
  format: 'mp4' | 'mov' | 'webm' | 'avi';
  codec: string;
  quality: 'low' | 'medium' | 'high' | 'custom';
  bitrate?: number;
  width?: number;
  height?: number;
  frameRate?: number;
  audioCodec: string;
  audioBitrate: number;
  outputPath: string;
}

export interface VideoProject {
  id: string;
  name: string;
  version: string;
  created: Date;
  modified: Date;
  settings: ProjectSettings;
  tracks: Track[];
  markers: Marker[];
  exportSettings: ExportSettings;
  metadata: {
    author?: string;
    description?: string;
    tags?: string[];
  };
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  loop: boolean;
  loopStart?: number;
  loopEnd?: number;
}

export interface TimelineViewport {
  startTime: number;
  endTime: number;
  pixelsPerSecond: number;
  scrollLeft: number;
}

export interface EditingTool {
  type: 'select' | 'razor' | 'trim' | 'slip' | 'slide' | 'ripple' | 'roll';
  cursor: string;
}

export interface UndoRedoAction {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  execute: () => void;
  undo: () => void;
}

export interface WaveformData {
  peaks: Float32Array;
  length: number;
  sampleRate: number;
  channels: number;
}

export interface VideoFrame {
  timestamp: number;
  data: ImageData | HTMLCanvasElement;
}

export interface RenderJob {
  id: string;
  type: 'preview' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime: number;
  endTime: number;
  settings: ExportSettings;
  outputPath?: string;
  error?: string;
}

// Event types for timeline interactions
export interface TimelineEvent {
  type: 'clip-select' | 'clip-move' | 'clip-trim' | 'clip-split' | 'playhead-move';
  clipId?: string;
  trackId?: string;
  time?: number;
  position?: { x: number; y: number };
}

// Drag and drop types
export interface DragData {
  type: 'clip' | 'file' | 'effect' | 'transition';
  data: any;
  sourceTrackId?: string;
  sourcePosition?: number;
}

export interface DropTarget {
  trackId: string;
  position: number;
  insertMode: 'insert' | 'overwrite' | 'replace';
}

// Keyboard shortcuts
export interface KeyboardShortcut {
  key: string;
  modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: string;
  description: string;
}

// Timeline selection
export interface TimelineSelection {
  clips: string[];
  tracks: string[];
  timeRange?: {
    start: number;
    end: number;
  };
}

// Audio analysis
export interface AudioAnalysis {
  peaks: number[];
  rms: number[];
  spectralCentroid: number[];
  zeroCrossingRate: number[];
  tempo?: number;
  key?: string;
}

// Video analysis
export interface VideoAnalysis {
  scenes: { start: number; end: number; confidence: number }[];
  motion: number[];
  brightness: number[];
  colorHistogram: number[][];
}

export interface MediaMetadata {
  duration: number;
  width?: number;
  height?: number;
  frameRate?: number;
  sampleRate?: number;
  channels?: number;
  bitRate?: number;
  codec?: string;
  format?: string;
  fileSize: number;
  createdAt?: Date;
}

// Performance monitoring
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cpuUsage: number;
  frameDrops: number;
  lastUpdate: Date;
}

// AI and Smart Editing Types
export interface TranscriptionWord {
  id: string;
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
  speaker?: string;
}

export interface TranscriptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  words: TranscriptionWord[];
  speaker?: string;
  confidence: number;
  type: 'speech' | 'silence' | 'music' | 'noise';
}

export interface TranscriptionResult {
  id: string;
  segments: TranscriptionSegment[];
  language: string;
  confidence: number;
  duration: number;
  wordCount: number;
  speakers: string[];
  metadata: {
    model: string;
    processingTime: number;
    audioQuality: 'low' | 'medium' | 'high';
  };
}

export interface SilenceSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  confidence: number;
  type: 'silence' | 'low-volume' | 'background-noise';
}

export interface SmartEditingOptions {
  autoRemoveSilence: boolean;
  silenceThreshold: number;
  minSilenceDuration: number;
  removeFillerWords: boolean;
  fillerWords: string[];
  generateJumpCuts: boolean;
  enhanceAudio: boolean;
  transcribeVideo: boolean;
}

export interface AIProcessingJob {
  id: string;
  type: 'transcription' | 'silence-detection' | 'audio-enhancement' | 'smart-cut';
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  clipId?: string;
  result?: any;
  error?: string;
  startTime: number;
  endTime?: number;
}
