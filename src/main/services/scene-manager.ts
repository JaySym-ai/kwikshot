import { EventEmitter } from 'events';
import Store from 'electron-store';
import { Scene, StreamSource, SceneTransition } from '../../shared/streaming-types';

interface SceneStore {
  scenes: Scene[];
  activeSceneId: string | null;
}

export class SceneManager extends EventEmitter {
  private store: Store<SceneStore>;
  private scenes: Map<string, Scene> = new Map();
  private activeScene: Scene | null = null;
  private transitionInProgress = false;

  constructor() {
    super();
    this.store = new Store<SceneStore>({
      name: 'scenes',
      defaults: {
        scenes: [],
        activeSceneId: null
      }
    });

    this.loadScenes();
  }

  /**
   * Create a new scene
   */
  createScene(name: string): Scene {
    const scene: Scene = {
      id: this.generateId(),
      name,
      sources: [],
      isActive: false,
      transitions: [
        { type: 'cut', duration: 0 },
        { type: 'fade', duration: 500 },
        { type: 'slide', duration: 300, direction: 'left' }
      ]
    };

    this.scenes.set(scene.id, scene);
    this.saveScenes();
    this.emit('scene-created', scene);

    return scene;
  }

  /**
   * Delete a scene
   */
  deleteScene(sceneId: string): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    // Can't delete the active scene
    if (scene.isActive) {
      throw new Error('Cannot delete the active scene');
    }

    this.scenes.delete(sceneId);
    this.saveScenes();
    this.emit('scene-deleted', sceneId);

    return true;
  }

  /**
   * Get all scenes
   */
  getScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * Get a specific scene
   */
  getScene(sceneId: string): Scene | null {
    return this.scenes.get(sceneId) || null;
  }

  /**
   * Get the active scene
   */
  getActiveScene(): Scene | null {
    return this.activeScene;
  }

  /**
   * Switch to a different scene
   */
  async switchToScene(sceneId: string, transition?: SceneTransition): Promise<void> {
    if (this.transitionInProgress) {
      throw new Error('Scene transition already in progress');
    }

    const newScene = this.scenes.get(sceneId);
    if (!newScene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    if (this.activeScene?.id === sceneId) {
      return; // Already active
    }

    this.transitionInProgress = true;
    this.emit('transition-started', { from: this.activeScene, to: newScene, transition });

    try {
      // Apply transition
      if (transition && transition.duration > 0) {
        await this.applyTransition(this.activeScene, newScene, transition);
      }

      // Update active scene
      if (this.activeScene) {
        this.activeScene.isActive = false;
      }

      newScene.isActive = true;
      this.activeScene = newScene;

      // Update store
      this.store.set('activeSceneId', sceneId);
      this.saveScenes();

      this.emit('scene-switched', newScene);
    } finally {
      this.transitionInProgress = false;
      this.emit('transition-completed', newScene);
    }
  }

  /**
   * Add a source to a scene
   */
  addSourceToScene(sceneId: string, source: Omit<StreamSource, 'id'>): StreamSource {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    const newSource: StreamSource = {
      ...source,
      id: this.generateId()
    };

    scene.sources.push(newSource);
    this.saveScenes();
    this.emit('source-added', sceneId, newSource);

    return newSource;
  }

  /**
   * Remove a source from a scene
   */
  removeSourceFromScene(sceneId: string, sourceId: string): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    const sourceIndex = scene.sources.findIndex(s => s.id === sourceId);
    if (sourceIndex === -1) return false;

    const removedSource = scene.sources.splice(sourceIndex, 1)[0];
    this.saveScenes();
    this.emit('source-removed', sceneId, removedSource);

    return true;
  }

  /**
   * Update a source in a scene
   */
  updateSource(sceneId: string, sourceId: string, updates: Partial<StreamSource>): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    const source = scene.sources.find(s => s.id === sourceId);
    if (!source) return false;

    Object.assign(source, updates);
    this.saveScenes();
    this.emit('source-updated', sceneId, source);

    return true;
  }

  /**
   * Reorder sources in a scene
   */
  reorderSources(sceneId: string, sourceIds: string[]): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    const reorderedSources: StreamSource[] = [];
    
    // Add sources in the specified order
    sourceIds.forEach(id => {
      const source = scene.sources.find(s => s.id === id);
      if (source) {
        reorderedSources.push(source);
      }
    });

    // Add any sources not in the reorder list
    scene.sources.forEach(source => {
      if (!sourceIds.includes(source.id)) {
        reorderedSources.push(source);
      }
    });

    scene.sources = reorderedSources;
    this.saveScenes();
    this.emit('sources-reordered', sceneId, sourceIds);

    return true;
  }

  /**
   * Duplicate a scene
   */
  duplicateScene(sceneId: string, newName?: string): Scene | null {
    const originalScene = this.scenes.get(sceneId);
    if (!originalScene) return null;

    const duplicatedScene: Scene = {
      id: this.generateId(),
      name: newName || `${originalScene.name} (Copy)`,
      sources: originalScene.sources.map(source => ({
        ...source,
        id: this.generateId()
      })),
      isActive: false,
      transitions: [...originalScene.transitions]
    };

    this.scenes.set(duplicatedScene.id, duplicatedScene);
    this.saveScenes();
    this.emit('scene-created', duplicatedScene);

    return duplicatedScene;
  }

  /**
   * Rename a scene
   */
  renameScene(sceneId: string, newName: string): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    scene.name = newName;
    this.saveScenes();
    this.emit('scene-renamed', sceneId, newName);

    return true;
  }

  /**
   * Generate scene preview (placeholder implementation)
   */
  async generatePreview(sceneId: string): Promise<string | null> {
    const scene = this.scenes.get(sceneId);
    if (!scene) return null;

    // TODO: Implement actual preview generation
    // This would involve compositing all sources in the scene
    // and generating a thumbnail image
    
    // For now, return a placeholder
    const canvas = this.createPreviewCanvas(scene);
    return canvas; // base64 encoded image
  }

  private async applyTransition(
    fromScene: Scene | null, 
    toScene: Scene, 
    transition: SceneTransition
  ): Promise<void> {
    return new Promise((resolve) => {
      // Simulate transition duration
      setTimeout(() => {
        resolve();
      }, transition.duration);
    });
  }

  private createPreviewCanvas(scene: Scene): string {
    // Placeholder implementation
    // In a real implementation, this would use Canvas API or similar
    // to composite all sources and create a thumbnail
    
    const canvas = Buffer.from('placeholder-preview-data').toString('base64');
    return `data:image/png;base64,${canvas}`;
  }

  private loadScenes(): void {
    const data = this.store.store;
    
    data.scenes.forEach(scene => {
      this.scenes.set(scene.id, scene);
      if (scene.isActive) {
        this.activeScene = scene;
      }
    });

    // If no active scene but scenes exist, activate the first one
    if (!this.activeScene && this.scenes.size > 0) {
      const firstScene = Array.from(this.scenes.values())[0];
      firstScene.isActive = true;
      this.activeScene = firstScene;
      this.store.set('activeSceneId', firstScene.id);
    }
  }

  private saveScenes(): void {
    const scenes = Array.from(this.scenes.values());
    this.store.set('scenes', scenes);
  }

  private generateId(): string {
    return `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.removeAllListeners();
    this.scenes.clear();
    this.activeScene = null;
  }
}
