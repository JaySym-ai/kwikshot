// Drag & Drop Hook - Timeline editing and clip arrangement
// Built using AugmentCode tool - www.augmentcode.com

import { useCallback, useState } from 'react';
import { DragData, DropTarget } from '../types/videoEditorTypes';
import { useVideoEditorStore } from '../stores/videoEditorStore';

interface DragDropState {
  isDragging: boolean;
  dragData: DragData | null;
  dropTarget: DropTarget | null;
  dragPreview: HTMLElement | null;
}

export const useDragDrop = () => {
  const [state, setState] = useState<DragDropState>({
    isDragging: false,
    dragData: null,
    dropTarget: null,
    dragPreview: null
  });

  const {
    addClip,
    moveClip,
    snapToGrid,
    gridSize,
    viewport
  } = useVideoEditorStore();

  // Start drag operation
  const startDrag = useCallback((data: DragData, element?: HTMLElement) => {
    setState(prev => ({
      ...prev,
      isDragging: true,
      dragData: data,
      dragPreview: element || null
    }));

    // Create drag preview if element provided
    if (element) {
      const preview = element.cloneNode(true) as HTMLElement;
      preview.style.position = 'fixed';
      preview.style.pointerEvents = 'none';
      preview.style.zIndex = '9999';
      preview.style.opacity = '0.8';
      preview.style.transform = 'rotate(5deg)';
      document.body.appendChild(preview);
      
      setState(prev => ({ ...prev, dragPreview: preview }));
    }
  }, []);

  // Update drop target during drag
  const updateDropTarget = useCallback((target: DropTarget | null) => {
    setState(prev => ({ ...prev, dropTarget: target }));
  }, []);

  // End drag operation
  const endDrag = useCallback(() => {
    // Clean up drag preview
    if (state.dragPreview) {
      document.body.removeChild(state.dragPreview);
    }

    setState({
      isDragging: false,
      dragData: null,
      dropTarget: null,
      dragPreview: null
    });
  }, [state.dragPreview]);

  // Handle successful drop
  const handleDrop = useCallback((dropTarget: DropTarget) => {
    if (!state.dragData) return false;

    try {
      const { dragData } = state;
      let dropTime = dropTarget.position;

      // Apply grid snapping
      if (snapToGrid) {
        dropTime = Math.round(dropTime / gridSize) * gridSize;
      }

      switch (dragData.type) {
        case 'file':
          // Handle file drop (video/audio import)
          handleFileDrop(dragData.data, dropTarget.trackId, dropTime);
          break;

        case 'clip':
          // Handle clip move
          handleClipMove(dragData.data, dropTarget.trackId, dropTime, dropTarget.insertMode);
          break;

        case 'effect':
          // Handle effect drop
          handleEffectDrop(dragData.data, dropTarget.trackId, dropTime);
          break;

        case 'transition':
          // Handle transition drop
          handleTransitionDrop(dragData.data, dropTarget.trackId, dropTime);
          break;

        default:
          console.warn('Unknown drag data type:', dragData.type);
          return false;
      }

      endDrag();
      return true;
    } catch (error) {
      console.error('Error handling drop:', error);
      endDrag();
      return false;
    }
  }, [state.dragData, snapToGrid, gridSize, endDrag]);

  // Handle file drop (import media)
  const handleFileDrop = useCallback((fileData: any, trackId: string, time: number) => {
    const { type, name, path, duration, width, height, frameRate, sampleRate, channels } = fileData;

    if (type.startsWith('video/')) {
      // Create video clip
      const videoClip = {
        id: crypto.randomUUID(),
        name,
        type: 'video' as const,
        filePath: path,
        duration: duration || 10,
        startTime: time,
        endTime: time + (duration || 10),
        trimStart: 0,
        trimEnd: duration || 10,
        trackId,
        locked: false,
        muted: false,
        volume: 1,
        effects: [],
        transitions: {},
        width: width || 1920,
        height: height || 1080,
        frameRate: frameRate || 30,
        codec: 'h264',
        hasAudio: true,
        transform: {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          opacity: 1
        }
      };

      addClip(videoClip, trackId);
    } else if (type.startsWith('audio/')) {
      // Create audio clip
      const audioClip = {
        id: crypto.randomUUID(),
        name,
        type: 'audio' as const,
        filePath: path,
        duration: duration || 10,
        startTime: time,
        endTime: time + (duration || 10),
        trimStart: 0,
        trimEnd: duration || 10,
        trackId,
        locked: false,
        muted: false,
        volume: 1,
        effects: [],
        transitions: {},
        sampleRate: sampleRate || 48000,
        channels: channels || 2,
        bitRate: 320,
        audioGain: 0
      };

      addClip(audioClip, trackId);
    }
  }, [addClip]);

  // Handle clip move between tracks
  const handleClipMove = useCallback((
    clipData: any,
    targetTrackId: string,
    time: number,
    insertMode: 'insert' | 'overwrite' | 'replace'
  ) => {
    // For now, just move the clip
    // In a full implementation, this would handle different insert modes
    moveClip(clipData.id, targetTrackId, time);
  }, [moveClip]);

  // Handle effect drop
  const handleEffectDrop = useCallback((effectData: any, trackId: string, time: number) => {
    // TODO: Implement effect application
    console.log('Effect drop:', effectData, trackId, time);
  }, []);

  // Handle transition drop
  const handleTransitionDrop = useCallback((transitionData: any, trackId: string, time: number) => {
    // TODO: Implement transition application
    console.log('Transition drop:', transitionData, trackId, time);
  }, []);

  // Calculate drop position from mouse coordinates
  const calculateDropPosition = useCallback((
    mouseX: number,
    mouseY: number,
    containerRect: DOMRect,
    trackHeight: number
  ) => {
    const x = mouseX - containerRect.left + viewport.scrollLeft;
    const y = mouseY - containerRect.top;

    // Calculate time position
    const time = viewport.startTime + (x / viewport.pixelsPerSecond);

    // Calculate track index
    const trackIndex = Math.floor(y / trackHeight);

    return {
      time: Math.max(0, time),
      trackIndex
    };
  }, [viewport]);

  // Check if drop is valid
  const isValidDrop = useCallback((dragData: DragData, dropTarget: DropTarget) => {
    if (!dragData || !dropTarget) return false;

    switch (dragData.type) {
      case 'file':
        // Check if file type matches track type
        const fileType = dragData.data.type;
        if (fileType.startsWith('video/')) {
          return true; // Video files can go on any track
        } else if (fileType.startsWith('audio/')) {
          return true; // Audio files can go on any track
        }
        return false;

      case 'clip':
        // Clips can be moved between compatible tracks
        return true;

      case 'effect':
      case 'transition':
        // Effects and transitions can be applied to any track
        return true;

      default:
        return false;
    }
  }, []);

  // Get visual feedback for drag operation
  const getDragFeedback = useCallback(() => {
    if (!state.isDragging || !state.dragData) return null;

    return {
      type: state.dragData.type,
      isValid: state.dropTarget ? isValidDrop(state.dragData, state.dropTarget) : false,
      dropTarget: state.dropTarget
    };
  }, [state.isDragging, state.dragData, state.dropTarget, isValidDrop]);

  // Update drag preview position
  const updateDragPreview = useCallback((x: number, y: number) => {
    if (state.dragPreview) {
      state.dragPreview.style.left = `${x + 10}px`;
      state.dragPreview.style.top = `${y + 10}px`;
    }
  }, [state.dragPreview]);

  return {
    // State
    isDragging: state.isDragging,
    dragData: state.dragData,
    dropTarget: state.dropTarget,

    // Actions
    startDrag,
    updateDropTarget,
    endDrag,
    handleDrop,

    // Utilities
    calculateDropPosition,
    isValidDrop,
    getDragFeedback,
    updateDragPreview
  };
};
