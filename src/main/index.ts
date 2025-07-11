import { app, BrowserWindow, ipcMain, desktopCapturer, systemPreferences, session, dialog, shell, globalShortcut } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as isDev from 'electron-is-dev';
import { StreamManager } from './streaming/stream-manager';

class KwikShotApp {
  private mainWindow: BrowserWindow | null = null;
  private streamManager: StreamManager | null = null;
  private registeredShortcuts: Map<string, string> = new Map();

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    // Handle app ready
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupIpcHandlers();
      this.requestPermissions();
      
      if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    });

    // Handle window closed
    app.on('window-all-closed', () => {
      if (this.streamManager) {
        this.streamManager.destroy();
      }
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Handle app activate (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  private createMainWindow(): void {
    // Set up session permissions for screen capture
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === 'media') {
        // Allow media permissions for screen recording
        callback(true);
      } else {
        callback(false);
      }
    });

    // Handle display media permissions (Electron 20+)
    if (session.defaultSession.setDisplayMediaRequestHandler) {
      session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
        // Allow all display media requests - grant access to primary display
        desktopCapturer.getSources({ types: ['screen'] }).then(sources => {
          if (sources.length > 0) {
            callback({ video: sources[0], audio: 'loopback' });
          } else {
            callback({});
          }
        });
      });
    }

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      titleBarStyle: 'hiddenInset',
      backgroundColor: '#0f172a',
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,

        allowRunningInsecureContent: false,
        preload: path.join(__dirname, '../preload/index.js'),
      },
    });

    // Load the app
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private async requestPermissions(): Promise<void> {
    // Request screen recording permission on macOS
    if (process.platform === 'darwin') {
      const cameraStatus = systemPreferences.getMediaAccessStatus('camera');
      const micStatus = systemPreferences.getMediaAccessStatus('microphone');

      if (cameraStatus !== 'granted') {
        await systemPreferences.askForMediaAccess('camera');
      }
      if (micStatus !== 'granted') {
        await systemPreferences.askForMediaAccess('microphone');
      }
    }
  }

  private setupIpcHandlers(): void {
    // Initialize stream manager
    this.streamManager = new StreamManager();

    // Set up streaming event forwarding
    this.streamManager.on('metrics-update', (metrics: any) => {
      this.mainWindow?.webContents.send('stream-metrics-update', metrics);
    });

    this.streamManager.on('error', (error: any) => {
      this.mainWindow?.webContents.send('stream-error', error);
    });

    this.streamManager.on('status-change', (status: any) => {
      this.mainWindow?.webContents.send('stream-status-change', status);
    });

    // Get available screens for recording
    ipcMain.handle('get-sources', async () => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['window', 'screen'],
          thumbnailSize: { width: 150, height: 150 }
        });
        return sources;
      } catch (error) {
        console.error('Error getting sources:', error);
        return [];
      }
    });

    // Get user media devices
    ipcMain.handle('get-media-devices', async () => {
      try {
        // This will be handled in the renderer process
        return { success: true };
      } catch (error) {
        console.error('Error getting media devices:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    // Handle app quit
    ipcMain.handle('quit-app', () => {
      app.quit();
    });

    // Handle minimize window
    ipcMain.handle('minimize-window', () => {
      this.mainWindow?.minimize();
    });

    // Handle maximize window
    ipcMain.handle('maximize-window', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    // Handle directory selection
    ipcMain.handle('select-directory', async () => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow!, {
          properties: ['openDirectory', 'createDirectory'],
          title: 'Select Folder'
        });

        if (!result.canceled && result.filePaths.length > 0) {
          return result.filePaths[0];
        }
        return null;
      } catch (error) {
        console.error('Error selecting directory:', error);
        return null;
      }
    });

    // Handle file saving
    ipcMain.handle('save-file', async (event, data: any, filename: string) => {
      try {
        // This would implement actual file saving logic
        console.log('Saving file:', filename);
        return true;
      } catch (error) {
        console.error('Error saving file:', error);
        return false;
      }
    });

    // Handle settings loading
    ipcMain.handle('get-settings', async () => {
      try {
        const userDataPath = app.getPath('userData');
        const settingsPath = path.join(userDataPath, 'settings.json');

        if (fs.existsSync(settingsPath)) {
          const settingsData = fs.readFileSync(settingsPath, 'utf8');
          return JSON.parse(settingsData);
        }
        return null;
      } catch (error) {
        console.error('Error loading settings:', error);
        return null;
      }
    });

    // Handle settings saving
    ipcMain.handle('save-settings', async (event, settings: any) => {
      try {
        const userDataPath = app.getPath('userData');
        const settingsPath = path.join(userDataPath, 'settings.json');

        // Ensure the directory exists
        if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
        }

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        return true;
      } catch (error) {
        console.error('Error saving settings:', error);
        return false;
      }
    });

    // Handle opening folders
    ipcMain.handle('open-folder', async (event, folderPath: string) => {
      try {
        // Expand home directory if needed
        const expandedPath = folderPath.startsWith('~')
          ? path.join(os.homedir(), folderPath.slice(1))
          : folderPath;

        await shell.openPath(expandedPath);
        return true;
      } catch (error) {
        console.error('Error opening folder:', error);
        return false;
      }
    });
    // Streaming IPC handlers
    ipcMain.handle('start-rtmp-stream', async (_, config, settings) => {
      try {
        if (!this.streamManager) {
          throw new Error('Stream manager not initialized');
        }
        await this.streamManager.startRTMPStream(config, settings);
      } catch (error) {
        console.error('Failed to start RTMP stream:', error);
        throw error;
      }
    });

    // Enhanced streaming handlers
    ipcMain.handle('authenticate-platform', async (_, platform, config) => {
      try {
        if (!this.streamManager) {
          throw new Error('Stream manager not initialized');
        }
        await this.streamManager.authenticatePlatform(platform, config);
      } catch (error) {
        console.error('Failed to authenticate platform:', error);
        throw error;
      }
    });

    ipcMain.handle('get-stream-key', async (_, platform) => {
      try {
        if (!this.streamManager) {
          throw new Error('Stream manager not initialized');
        }
        return await this.streamManager.getStreamKey(platform);
      } catch (error) {
        console.error('Failed to get stream key:', error);
        throw error;
      }
    });

    ipcMain.handle('set-recording-config', async (_, config) => {
      try {
        if (!this.streamManager) {
          throw new Error('Stream manager not initialized');
        }
        this.streamManager.setRecordingConfig(config);
      } catch (error) {
        console.error('Failed to set recording config:', error);
        throw error;
      }
    });

    ipcMain.handle('start-recording', async () => {
      try {
        if (!this.streamManager) {
          throw new Error('Stream manager not initialized');
        }
        await this.streamManager.startRecording();
      } catch (error) {
        console.error('Failed to start recording:', error);
        throw error;
      }
    });

    ipcMain.handle('stop-recording', async () => {
      try {
        if (!this.streamManager) {
          throw new Error('Stream manager not initialized');
        }
        await this.streamManager.stopRecording();
      } catch (error) {
        console.error('Failed to stop recording:', error);
        throw error;
      }
    });

    ipcMain.handle('get-network-stats', () => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getNetworkStats();
    });

    ipcMain.handle('get-hardware-capabilities', async () => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return await this.streamManager.getHardwareCapabilities();
    });

    ipcMain.handle('start-webrtc-stream', async (_, config, settings) => {
      try {
        if (!this.streamManager) {
          throw new Error('Stream manager not initialized');
        }
        await this.streamManager.startWebRTCStream(config, settings);
      } catch (error) {
        console.error('Failed to start WebRTC stream:', error);
        throw error;
      }
    });

    ipcMain.handle('stop-stream', async () => {
      try {
        if (!this.streamManager) {
          throw new Error('Stream manager not initialized');
        }
        await this.streamManager.stopStream();
      } catch (error) {
        console.error('Failed to stop stream:', error);
        throw error;
      }
    });

    ipcMain.handle('pause-stream', async () => {
      try {
        if (!this.streamManager) {
          throw new Error('Stream manager not initialized');
        }
        await this.streamManager.pauseStream();
      } catch (error) {
        console.error('Failed to pause stream:', error);
        throw error;
      }
    });

    ipcMain.handle('resume-stream', async () => {
      try {
        if (!this.streamManager) {
          throw new Error('Stream manager not initialized');
        }
        await this.streamManager.resumeStream();
      } catch (error) {
        console.error('Failed to resume stream:', error);
        throw error;
      }
    });

    ipcMain.handle('get-stream-metrics', () => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getMetrics();
    });

    // Scene management handlers
    ipcMain.handle('get-scenes', () => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getSceneManager().getScenes();
    });

    ipcMain.handle('create-scene', (_, name) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getSceneManager().createScene(name);
    });

    ipcMain.handle('delete-scene', (_, sceneId) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getSceneManager().deleteScene(sceneId);
    });

    ipcMain.handle('switch-scene', async (_, sceneId, transition) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      await this.streamManager.getSceneManager().switchToScene(sceneId, transition);
    });

    ipcMain.handle('rename-scene', (_, sceneId, newName) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getSceneManager().renameScene(sceneId, newName);
    });

    ipcMain.handle('duplicate-scene', (_, sceneId) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getSceneManager().duplicateScene(sceneId);
    });

    ipcMain.handle('add-source-to-scene', (_, sceneId, source) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getSceneManager().addSourceToScene(sceneId, source);
    });

    ipcMain.handle('remove-source-from-scene', (_, sceneId, sourceId) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getSceneManager().removeSourceFromScene(sceneId, sourceId);
    });

    ipcMain.handle('update-source', (_, sceneId, sourceId, updates) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getSceneManager().updateSource(sceneId, sourceId, updates);
    });

    // Audio mixer handlers
    ipcMain.handle('get-mixer-state', () => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getAudioMixer().getMixerState();
    });

    ipcMain.handle('add-audio-source', (_, source) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getAudioMixer().addAudioSource(source);
    });

    ipcMain.handle('remove-audio-source', (_, sourceId) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getAudioMixer().removeAudioSource(sourceId);
    });

    ipcMain.handle('update-audio-source', (_, sourceId, updates) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getAudioMixer().updateAudioSource(sourceId, updates);
    });

    ipcMain.handle('set-master-volume', (_, volume) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      this.streamManager.getAudioMixer().setMasterVolume(volume);
    });

    ipcMain.handle('set-master-mute', (_, muted) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      this.streamManager.getAudioMixer().setMasterMute(muted);
    });

    ipcMain.handle('set-monitoring', (_, enabled) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      this.streamManager.getAudioMixer().setMonitoring(enabled);
    });

    ipcMain.handle('add-audio-filter', (_, sourceId, filter) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getAudioMixer().addFilter(sourceId, filter);
    });

    ipcMain.handle('remove-audio-filter', (_, sourceId, filterId) => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getAudioMixer().removeFilter(sourceId, filterId);
    });

    ipcMain.handle('get-audio-levels', () => {
      if (!this.streamManager) {
        throw new Error('Stream manager not initialized');
      }
      return this.streamManager.getAudioMixer().getAudioLevels();
    });

    // Global hotkey handlers
    ipcMain.handle('register-global-shortcut', async (_, accelerator: string, action: string) => {
      try {
        // Unregister existing shortcut for this action
        const existingAccelerator = this.registeredShortcuts.get(action);
        if (existingAccelerator) {
          globalShortcut.unregister(existingAccelerator);
        }

        // Register new shortcut
        const success = globalShortcut.register(accelerator, () => {
          this.mainWindow?.webContents.send('global-shortcut-triggered', action);
        });

        if (success) {
          this.registeredShortcuts.set(action, accelerator);
          return { success: true };
        } else {
          return { success: false, error: 'Failed to register shortcut' };
        }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    ipcMain.handle('unregister-global-shortcut', async (_, action: string) => {
      try {
        const accelerator = this.registeredShortcuts.get(action);
        if (accelerator) {
          globalShortcut.unregister(accelerator);
          this.registeredShortcuts.delete(action);
        }
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    ipcMain.handle('unregister-all-shortcuts', async () => {
      try {
        globalShortcut.unregisterAll();
        this.registeredShortcuts.clear();
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    ipcMain.handle('is-shortcut-registered', async (_, accelerator: string) => {
      try {
        return { registered: globalShortcut.isRegistered(accelerator) };
      } catch (error) {
        return { registered: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });
  }
}

// Initialize the app
new KwikShotApp();
