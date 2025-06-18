export interface HotkeyAction {
  id: string;
  name: string;
  description: string;
  defaultShortcut: string;
  callback: () => void;
}

export interface HotkeyRegistration {
  action: string;
  accelerator: string;
  registered: boolean;
  error?: string;
}

export class HotkeyService {
  private static instance: HotkeyService;
  private actions: Map<string, HotkeyAction> = new Map();
  private registrations: Map<string, HotkeyRegistration> = new Map();
  private isInitialized = false;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): HotkeyService {
    if (!HotkeyService.instance) {
      HotkeyService.instance = new HotkeyService();
    }
    return HotkeyService.instance;
  }

  /**
   * Initialize the hotkey service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set up global shortcut event listener
      window.electronAPI?.onGlobalShortcutTriggered((action: string) => {
        this.handleShortcutTriggered(action);
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize HotkeyService:', error);
      throw error;
    }
  }

  /**
   * Register a hotkey action
   */
  registerAction(action: HotkeyAction): void {
    this.actions.set(action.id, action);
  }

  /**
   * Unregister a hotkey action
   */
  unregisterAction(actionId: string): void {
    this.actions.delete(actionId);
    this.unregisterShortcut(actionId);
  }

  /**
   * Register a global shortcut
   */
  async registerShortcut(actionId: string, accelerator: string): Promise<boolean> {
    try {
      // Check if action exists
      if (!this.actions.has(actionId)) {
        throw new Error(`Action ${actionId} not found`);
      }

      // Unregister existing shortcut for this action
      await this.unregisterShortcut(actionId);

      // Register new shortcut
      const result = await window.electronAPI?.registerGlobalShortcut(accelerator, actionId);
      
      if (result?.success) {
        this.registrations.set(actionId, {
          action: actionId,
          accelerator,
          registered: true,
        });
        return true;
      } else {
        this.registrations.set(actionId, {
          action: actionId,
          accelerator,
          registered: false,
          error: result?.error || 'Unknown error',
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to register shortcut:', error);
      this.registrations.set(actionId, {
        action: actionId,
        accelerator,
        registered: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Unregister a global shortcut
   */
  async unregisterShortcut(actionId: string): Promise<boolean> {
    try {
      const result = await window.electronAPI?.unregisterGlobalShortcut(actionId);
      
      if (result?.success) {
        this.registrations.delete(actionId);
        return true;
      } else {
        console.error('Failed to unregister shortcut:', result?.error);
        return false;
      }
    } catch (error) {
      console.error('Failed to unregister shortcut:', error);
      return false;
    }
  }

  /**
   * Unregister all shortcuts
   */
  async unregisterAllShortcuts(): Promise<boolean> {
    try {
      const result = await window.electronAPI?.unregisterAllShortcuts();
      
      if (result?.success) {
        this.registrations.clear();
        return true;
      } else {
        console.error('Failed to unregister all shortcuts:', result?.error);
        return false;
      }
    } catch (error) {
      console.error('Failed to unregister all shortcuts:', error);
      return false;
    }
  }

  /**
   * Check if a shortcut is already registered
   */
  async isShortcutRegistered(accelerator: string): Promise<boolean> {
    try {
      const result = await window.electronAPI?.isShortcutRegistered(accelerator);
      return result?.registered || false;
    } catch (error) {
      console.error('Failed to check shortcut registration:', error);
      return false;
    }
  }

  /**
   * Get all registered actions
   */
  getActions(): HotkeyAction[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get action by ID
   */
  getAction(actionId: string): HotkeyAction | undefined {
    return this.actions.get(actionId);
  }

  /**
   * Get all registrations
   */
  getRegistrations(): HotkeyRegistration[] {
    return Array.from(this.registrations.values());
  }

  /**
   * Get registration for action
   */
  getRegistration(actionId: string): HotkeyRegistration | undefined {
    return this.registrations.get(actionId);
  }

  /**
   * Register shortcuts from settings
   */
  async registerShortcutsFromSettings(shortcuts: Record<string, string>): Promise<void> {
    const results = await Promise.allSettled(
      Object.entries(shortcuts).map(([actionId, accelerator]) =>
        this.registerShortcut(actionId, accelerator)
      )
    );

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const [actionId] = Object.entries(shortcuts)[index];
        console.error(`Failed to register shortcut for ${actionId}:`, result.reason);
      }
    });
  }

  /**
   * Validate shortcut format
   */
  validateShortcut(accelerator: string): { valid: boolean; error?: string } {
    if (!accelerator || accelerator.trim() === '') {
      return { valid: false, error: 'Shortcut cannot be empty' };
    }

    // Basic validation for Electron accelerator format
    const parts = accelerator.split('+');
    const validModifiers = ['Cmd', 'Ctrl', 'Alt', 'Shift', 'Meta', 'Super'];
    const modifiers = parts.slice(0, -1);
    const key = parts[parts.length - 1];

    // Check if all modifiers are valid
    for (const modifier of modifiers) {
      if (!validModifiers.includes(modifier)) {
        return { valid: false, error: `Invalid modifier: ${modifier}` };
      }
    }

    // Check if key is present
    if (!key || key.trim() === '') {
      return { valid: false, error: 'Key is required' };
    }

    // Check for duplicate modifiers
    const uniqueModifiers = new Set(modifiers);
    if (uniqueModifiers.size !== modifiers.length) {
      return { valid: false, error: 'Duplicate modifiers not allowed' };
    }

    return { valid: true };
  }

  /**
   * Convert platform-specific shortcuts
   */
  normalizePlatformShortcut(accelerator: string): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    if (isMac) {
      return accelerator.replace(/Ctrl/g, 'Cmd');
    } else {
      return accelerator.replace(/Cmd/g, 'Ctrl');
    }
  }

  /**
   * Handle shortcut triggered event
   */
  private handleShortcutTriggered(actionId: string): void {
    const action = this.actions.get(actionId);
    if (action) {
      try {
        action.callback();
      } catch (error) {
        console.error(`Error executing hotkey action ${actionId}:`, error);
      }
    } else {
      console.warn(`Unknown hotkey action triggered: ${actionId}`);
    }
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Clean up shortcuts when the window is about to close
    window.addEventListener('beforeunload', () => {
      this.unregisterAllShortcuts();
    });

    // Handle visibility change to manage shortcuts
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Optionally disable shortcuts when window is hidden
      } else {
        // Re-enable shortcuts when window becomes visible
      }
    });
  }

  /**
   * Get default shortcuts for the current platform
   */
  static getDefaultShortcuts(): Record<string, string> {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? 'Cmd' : 'Ctrl';

    return {
      startRecording: `${cmdKey}+Shift+R`,
      stopRecording: `${cmdKey}+Shift+S`,
      pauseRecording: `${cmdKey}+Shift+P`,
      resumeRecording: `${cmdKey}+Shift+P`,
      takeScreenshot: isMac ? 'Cmd+Shift+4' : 'Ctrl+Shift+4',
      openSettings: isMac ? 'Cmd+,' : 'Ctrl+,',
      togglePreview: `${cmdKey}+Shift+V`,
      toggleFullscreen: isMac ? 'Cmd+Ctrl+F' : 'F11',
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.unregisterAllShortcuts();
    this.actions.clear();
    this.registrations.clear();
    this.isInitialized = false;
  }
}
