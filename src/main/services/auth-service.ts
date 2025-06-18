import { EventEmitter } from 'events';
import { BrowserWindow, session } from 'electron';
import Store from 'electron-store';
import axios from 'axios';
import { AuthToken, PlatformAuthConfig } from '../../shared/streaming-types';

interface StoredAuth {
  [platform: string]: AuthToken;
}

export class AuthService extends EventEmitter {
  private store: Store<StoredAuth>;
  private authWindows: Map<string, BrowserWindow> = new Map();

  constructor() {
    super();
    this.store = new Store<StoredAuth>({
      name: 'auth-tokens',
      encryptionKey: 'kwikshot-auth-encryption-key'
    });
  }

  /**
   * Initiate OAuth flow for a platform
   */
  async authenticate(platform: string, config: PlatformAuthConfig): Promise<AuthToken> {
    return new Promise((resolve, reject) => {
      try {
        const authUrl = this.buildAuthUrl(config);
        const authWindow = this.createAuthWindow(authUrl);
        
        this.authWindows.set(platform, authWindow);

        // Handle successful authentication
        authWindow.webContents.on('will-redirect', async (event, url) => {
          if (url.startsWith(config.redirectUri)) {
            const urlParams = new URL(url);
            const code = urlParams.searchParams.get('code');
            const error = urlParams.searchParams.get('error');

            if (error) {
              authWindow.close();
              this.authWindows.delete(platform);
              reject(new Error(`Authentication failed: ${error}`));
              return;
            }

            if (code) {
              try {
                const token = await this.exchangeCodeForToken(code, config);
                token.platform = platform;
                
                // Store the token
                this.storeToken(platform, token);
                
                authWindow.close();
                this.authWindows.delete(platform);
                
                this.emit('authenticated', platform, token);
                resolve(token);
              } catch (tokenError) {
                authWindow.close();
                this.authWindows.delete(platform);
                reject(tokenError);
              }
            }
          }
        });

        // Handle window closed
        authWindow.on('closed', () => {
          this.authWindows.delete(platform);
          reject(new Error('Authentication window was closed'));
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get stored authentication token for a platform
   */
  getToken(platform: string): AuthToken | null {
    const token = this.store.get(platform);
    if (!token) return null;

    // Check if token is expired
    if (new Date() >= new Date(token.expiresAt)) {
      this.store.delete(platform);
      return null;
    }

    return token;
  }

  /**
   * Refresh an expired token
   */
  async refreshToken(platform: string, config: PlatformAuthConfig): Promise<AuthToken | null> {
    const storedToken = this.store.get(platform);
    if (!storedToken?.refreshToken) return null;

    try {
      const response = await axios.post(config.tokenUrl, {
        grant_type: 'refresh_token',
        refresh_token: storedToken.refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret
      });

      const newToken: AuthToken = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || storedToken.refreshToken,
        expiresAt: new Date(Date.now() + (response.data.expires_in * 1000)),
        scope: response.data.scope?.split(' ') || storedToken.scope,
        platform
      };

      this.storeToken(platform, newToken);
      this.emit('token-refreshed', platform, newToken);
      
      return newToken;
    } catch (error) {
      console.error(`Failed to refresh token for ${platform}:`, error);
      this.store.delete(platform);
      return null;
    }
  }

  /**
   * Revoke authentication for a platform
   */
  async revokeAuth(platform: string): Promise<void> {
    const token = this.getToken(platform);
    if (token) {
      // TODO: Call platform-specific revocation endpoints
      this.store.delete(platform);
      this.emit('revoked', platform);
    }
  }

  /**
   * Check if user is authenticated for a platform
   */
  isAuthenticated(platform: string): boolean {
    return this.getToken(platform) !== null;
  }

  /**
   * Get all authenticated platforms
   */
  getAuthenticatedPlatforms(): string[] {
    const allTokens = this.store.store;
    return Object.keys(allTokens).filter(platform => this.isAuthenticated(platform));
  }

  private buildAuthUrl(config: PlatformAuthConfig): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state: Math.random().toString(36).substring(7) // CSRF protection
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  private createAuthWindow(url: string): BrowserWindow {
    const authWindow = new BrowserWindow({
      width: 500,
      height: 700,
      show: true,
      modal: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    authWindow.loadURL(url);
    return authWindow;
  }

  private async exchangeCodeForToken(code: string, config: PlatformAuthConfig): Promise<AuthToken> {
    const response = await axios.post(config.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + (response.data.expires_in * 1000)),
      scope: response.data.scope?.split(' ') || config.scopes,
      platform: ''
    };
  }

  private storeToken(platform: string, token: AuthToken): void {
    this.store.set(platform, token);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.authWindows.forEach(window => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
    this.authWindows.clear();
  }
}
