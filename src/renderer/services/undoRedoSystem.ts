// Undo/Redo System - Comprehensive undo/redo for all operations
// Built using AugmentCode tool - www.augmentcode.com

import { UndoRedoAction } from '../types/videoEditorTypes';

export interface UndoRedoState {
  history: UndoRedoAction[];
  currentIndex: number;
  maxHistorySize: number;
}

export class UndoRedoSystem {
  private state: UndoRedoState;
  private listeners: Set<(state: UndoRedoState) => void> = new Set();

  constructor(maxHistorySize: number = 100) {
    this.state = {
      history: [],
      currentIndex: -1,
      maxHistorySize
    };
  }

  /**
   * Execute an action and add it to history
   */
  executeAction(action: UndoRedoAction): void {
    try {
      // Execute the action
      action.execute();

      // Remove any actions after current index (when undoing then doing new action)
      const newHistory = this.state.history.slice(0, this.state.currentIndex + 1);
      
      // Add new action
      newHistory.push(action);

      // Limit history size
      if (newHistory.length > this.state.maxHistorySize) {
        newHistory.shift();
      } else {
        this.state.currentIndex++;
      }

      this.state.history = newHistory;
      this.notifyListeners();
    } catch (error) {
      console.error('Error executing action:', error);
      throw error;
    }
  }

  /**
   * Undo the last action
   */
  undo(): boolean {
    if (!this.canUndo()) return false;

    try {
      const action = this.state.history[this.state.currentIndex];
      action.undo();
      this.state.currentIndex--;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error undoing action:', error);
      return false;
    }
  }

  /**
   * Redo the next action
   */
  redo(): boolean {
    if (!this.canRedo()) return false;

    try {
      this.state.currentIndex++;
      const action = this.state.history[this.state.currentIndex];
      action.execute();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error redoing action:', error);
      this.state.currentIndex--;
      return false;
    }
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.state.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.state.currentIndex < this.state.history.length - 1;
  }

  /**
   * Get current state
   */
  getState(): UndoRedoState {
    return { ...this.state };
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.state.history = [];
    this.state.currentIndex = -1;
    this.notifyListeners();
  }

  /**
   * Get action at specific index
   */
  getAction(index: number): UndoRedoAction | null {
    return this.state.history[index] || null;
  }

  /**
   * Get current action
   */
  getCurrentAction(): UndoRedoAction | null {
    return this.getAction(this.state.currentIndex);
  }

  /**
   * Get next action (for redo)
   */
  getNextAction(): UndoRedoAction | null {
    return this.getAction(this.state.currentIndex + 1);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: UndoRedoState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Create a batch action that groups multiple actions together
   */
  createBatchAction(
    description: string,
    actions: Array<{ execute: () => void; undo: () => void }>
  ): UndoRedoAction {
    return {
      id: crypto.randomUUID(),
      type: 'batch',
      description,
      timestamp: new Date(),
      execute: () => {
        actions.forEach(action => action.execute());
      },
      undo: () => {
        // Undo in reverse order
        actions.slice().reverse().forEach(action => action.undo());
      }
    };
  }
}

// Action factory functions for common operations
export class ActionFactory {
  /**
   * Create an action for adding a clip
   */
  static createAddClipAction(
    clipData: any,
    trackId: string,
    addClipFn: (clip: any, trackId: string) => void,
    removeClipFn: (clipId: string) => void
  ): UndoRedoAction {
    return {
      id: crypto.randomUUID(),
      type: 'add-clip',
      description: `Add clip "${clipData.name}"`,
      timestamp: new Date(),
      execute: () => addClipFn(clipData, trackId),
      undo: () => removeClipFn(clipData.id)
    };
  }

  /**
   * Create an action for removing a clip
   */
  static createRemoveClipAction(
    clipData: any,
    trackId: string,
    addClipFn: (clip: any, trackId: string) => void,
    removeClipFn: (clipId: string) => void
  ): UndoRedoAction {
    return {
      id: crypto.randomUUID(),
      type: 'remove-clip',
      description: `Remove clip "${clipData.name}"`,
      timestamp: new Date(),
      execute: () => removeClipFn(clipData.id),
      undo: () => addClipFn(clipData, trackId)
    };
  }

  /**
   * Create an action for moving a clip
   */
  static createMoveClipAction(
    clipId: string,
    oldTrackId: string,
    newTrackId: string,
    oldPosition: number,
    newPosition: number,
    moveClipFn: (clipId: string, trackId: string, position: number) => void
  ): UndoRedoAction {
    return {
      id: crypto.randomUUID(),
      type: 'move-clip',
      description: 'Move clip',
      timestamp: new Date(),
      execute: () => moveClipFn(clipId, newTrackId, newPosition),
      undo: () => moveClipFn(clipId, oldTrackId, oldPosition)
    };
  }

  /**
   * Create an action for updating clip properties
   */
  static createUpdateClipAction(
    clipId: string,
    oldProperties: any,
    newProperties: any,
    updateClipFn: (clipId: string, properties: any) => void
  ): UndoRedoAction {
    return {
      id: crypto.randomUUID(),
      type: 'update-clip',
      description: 'Update clip properties',
      timestamp: new Date(),
      execute: () => updateClipFn(clipId, newProperties),
      undo: () => updateClipFn(clipId, oldProperties)
    };
  }

  /**
   * Create an action for trimming a clip
   */
  static createTrimClipAction(
    clipId: string,
    oldStart: number,
    oldEnd: number,
    newStart: number,
    newEnd: number,
    trimClipFn: (clipId: string, start: number, end: number) => void
  ): UndoRedoAction {
    return {
      id: crypto.randomUUID(),
      type: 'trim-clip',
      description: 'Trim clip',
      timestamp: new Date(),
      execute: () => trimClipFn(clipId, newStart, newEnd),
      undo: () => trimClipFn(clipId, oldStart, oldEnd)
    };
  }

  /**
   * Create an action for splitting a clip
   */
  static createSplitClipAction(
    originalClipData: any,
    newClipData: any,
    splitTime: number,
    addClipFn: (clip: any, trackId: string) => void,
    removeClipFn: (clipId: string) => void,
    updateClipFn: (clipId: string, properties: any) => void
  ): UndoRedoAction {
    return {
      id: crypto.randomUUID(),
      type: 'split-clip',
      description: `Split clip "${originalClipData.name}"`,
      timestamp: new Date(),
      execute: () => {
        // Update original clip to end at split time
        updateClipFn(originalClipData.id, {
          duration: splitTime - originalClipData.startTime,
          endTime: splitTime,
          trimEnd: originalClipData.trimStart + (splitTime - originalClipData.startTime)
        });
        // Add new clip starting at split time
        addClipFn(newClipData, originalClipData.trackId);
      },
      undo: () => {
        // Remove the new clip
        removeClipFn(newClipData.id);
        // Restore original clip properties
        updateClipFn(originalClipData.id, {
          duration: originalClipData.duration,
          endTime: originalClipData.endTime,
          trimEnd: originalClipData.trimEnd
        });
      }
    };
  }

  /**
   * Create an action for adding a track
   */
  static createAddTrackAction(
    trackData: any,
    addTrackFn: (type: 'video' | 'audio', name?: string) => string,
    removeTrackFn: (trackId: string) => void
  ): UndoRedoAction {
    return {
      id: crypto.randomUUID(),
      type: 'add-track',
      description: `Add ${trackData.type} track`,
      timestamp: new Date(),
      execute: () => addTrackFn(trackData.type, trackData.name),
      undo: () => removeTrackFn(trackData.id)
    };
  }

  /**
   * Create an action for removing a track
   */
  static createRemoveTrackAction(
    trackData: any,
    addTrackFn: (type: 'video' | 'audio', name?: string) => string,
    removeTrackFn: (trackId: string) => void
  ): UndoRedoAction {
    return {
      id: crypto.randomUUID(),
      type: 'remove-track',
      description: `Remove track "${trackData.name}"`,
      timestamp: new Date(),
      execute: () => removeTrackFn(trackData.id),
      undo: () => {
        // Note: This is simplified - in reality you'd need to restore the exact track
        addTrackFn(trackData.type, trackData.name);
      }
    };
  }
}
