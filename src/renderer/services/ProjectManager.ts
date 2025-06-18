// Project Manager Service - Project file format and persistence
// Built using AugmentCode tool - www.augmentcode.com

import { VideoProject, ProjectSettings } from '../types/videoEditorTypes';

export interface ProjectFileFormat {
  version: string;
  project: VideoProject;
  metadata: {
    created: string;
    modified: string;
    application: string;
    version: string;
  };
}

export class ProjectManager {
  private static readonly FILE_VERSION = '1.0.0';
  private static readonly FILE_EXTENSION = '.kwikshot';
  
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private autoSaveEnabled = true;
  private autoSaveIntervalMs = 30000; // 30 seconds

  /**
   * Create a new project with default settings
   */
  createNewProject(name: string, settings?: Partial<ProjectSettings>): VideoProject {
    const defaultSettings: ProjectSettings = {
      name,
      width: 1920,
      height: 1080,
      frameRate: 30,
      sampleRate: 48000,
      duration: 0,
      backgroundColor: '#000000',
      ...settings
    };

    const project: VideoProject = {
      id: crypto.randomUUID(),
      name,
      version: ProjectManager.FILE_VERSION,
      created: new Date(),
      modified: new Date(),
      settings: defaultSettings,
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
      metadata: {
        author: 'KwikShot User',
        description: '',
        tags: []
      }
    };

    return project;
  }

  /**
   * Save project to file
   */
  async saveProject(project: VideoProject, filePath?: string): Promise<string> {
    try {
      // Update modification time
      project.modified = new Date();

      // Create project file format
      const projectFile: ProjectFileFormat = {
        version: ProjectManager.FILE_VERSION,
        project,
        metadata: {
          created: project.created.toISOString(),
          modified: project.modified.toISOString(),
          application: 'KwikShot',
          version: ProjectManager.FILE_VERSION
        }
      };

      // Convert to JSON
      const jsonData = JSON.stringify(projectFile, null, 2);

      // Determine file path
      const finalPath = filePath || this.generateFilePath(project.name);

      // Save file using Electron API
      if (window.electronAPI) {
        await window.electronAPI.saveFile(finalPath, jsonData);
      } else {
        // Fallback for development/browser environment
        this.downloadFile(jsonData, `${project.name}${ProjectManager.FILE_EXTENSION}`);
      }

      return finalPath;
    } catch (error) {
      console.error('Error saving project:', error);
      throw new Error('Failed to save project file');
    }
  }

  /**
   * Load project from file
   */
  async loadProject(filePath: string): Promise<VideoProject> {
    try {
      let jsonData: string;

      // Load file using Electron API
      if (window.electronAPI) {
        jsonData = await window.electronAPI.loadFile(filePath);
      } else {
        // Fallback for development/browser environment
        throw new Error('File loading not supported in browser environment');
      }

      // Parse project file
      const projectFile: ProjectFileFormat = JSON.parse(jsonData);

      // Validate file format
      this.validateProjectFile(projectFile);

      // Convert date strings back to Date objects
      projectFile.project.created = new Date(projectFile.project.created);
      projectFile.project.modified = new Date(projectFile.project.modified);

      return projectFile.project;
    } catch (error) {
      console.error('Error loading project:', error);
      throw new Error('Failed to load project file');
    }
  }

  /**
   * Export project data for backup or sharing
   */
  async exportProject(project: VideoProject): Promise<string> {
    try {
      const exportData = {
        ...project,
        exportedAt: new Date().toISOString(),
        exportedBy: 'KwikShot Video Editor'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting project:', error);
      throw new Error('Failed to export project');
    }
  }

  /**
   * Import project from exported data
   */
  async importProject(exportData: string): Promise<VideoProject> {
    try {
      const data = JSON.parse(exportData);
      
      // Remove export-specific fields
      delete data.exportedAt;
      delete data.exportedBy;

      // Validate and convert dates
      if (data.created) data.created = new Date(data.created);
      if (data.modified) data.modified = new Date(data.modified);

      // Generate new ID for imported project
      data.id = crypto.randomUUID();
      data.name = `${data.name} (Imported)`;

      return data as VideoProject;
    } catch (error) {
      console.error('Error importing project:', error);
      throw new Error('Failed to import project');
    }
  }

  /**
   * Get recent projects list
   */
  async getRecentProjects(): Promise<{ name: string; path: string; modified: Date }[]> {
    try {
      if (window.electronAPI) {
        const recentFiles = await window.electronAPI.getRecentFiles();
        return recentFiles.map(file => ({
          name: file.name,
          path: file.path,
          modified: new Date(file.modified)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting recent projects:', error);
      return [];
    }
  }

  /**
   * Enable auto-save functionality
   */
  enableAutoSave(project: VideoProject, onSave?: (success: boolean) => void): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    if (!this.autoSaveEnabled) return;

    this.autoSaveInterval = setInterval(async () => {
      try {
        const autoSavePath = this.generateAutoSavePath(project.name);
        await this.saveProject(project, autoSavePath);
        onSave?.(true);
      } catch (error) {
        console.error('Auto-save failed:', error);
        onSave?.(false);
      }
    }, this.autoSaveIntervalMs);
  }

  /**
   * Disable auto-save
   */
  disableAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Set auto-save interval
   */
  setAutoSaveInterval(intervalMs: number): void {
    this.autoSaveIntervalMs = intervalMs;
  }

  /**
   * Create project backup
   */
  async createBackup(project: VideoProject): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = this.generateBackupPath(project.name, timestamp);
      
      await this.saveProject(project, backupPath);
      return backupPath;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create project backup');
    }
  }

  /**
   * Validate project file format
   */
  private validateProjectFile(projectFile: any): void {
    if (!projectFile.version) {
      throw new Error('Invalid project file: missing version');
    }

    if (!projectFile.project) {
      throw new Error('Invalid project file: missing project data');
    }

    if (!projectFile.project.id || !projectFile.project.name) {
      throw new Error('Invalid project file: missing required project fields');
    }

    // Check version compatibility
    const fileVersion = projectFile.version;
    const currentVersion = ProjectManager.FILE_VERSION;
    
    if (fileVersion !== currentVersion) {
      console.warn(`Project file version ${fileVersion} differs from current version ${currentVersion}`);
      // In a real implementation, you might want to handle version migration here
    }
  }

  /**
   * Generate file path for project
   */
  private generateFilePath(projectName: string): string {
    const sanitizedName = projectName.replace(/[^a-zA-Z0-9\s-_]/g, '');
    return `${sanitizedName}${ProjectManager.FILE_EXTENSION}`;
  }

  /**
   * Generate auto-save file path
   */
  private generateAutoSavePath(projectName: string): string {
    const sanitizedName = projectName.replace(/[^a-zA-Z0-9\s-_]/g, '');
    return `${sanitizedName}_autosave${ProjectManager.FILE_EXTENSION}`;
  }

  /**
   * Generate backup file path
   */
  private generateBackupPath(projectName: string, timestamp: string): string {
    const sanitizedName = projectName.replace(/[^a-zA-Z0-9\s-_]/g, '');
    return `${sanitizedName}_backup_${timestamp}${ProjectManager.FILE_EXTENSION}`;
  }

  /**
   * Download file in browser environment
   */
  private downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.disableAutoSave();
  }
}
