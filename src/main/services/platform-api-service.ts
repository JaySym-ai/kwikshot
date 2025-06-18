import axios, { AxiosInstance } from 'axios';
import { AuthToken } from '../../shared/streaming-types';

export interface StreamInfo {
  streamKey: string;
  rtmpUrl: string;
  title?: string;
  description?: string;
  category?: string;
  privacy?: 'public' | 'unlisted' | 'private';
  thumbnailUrl?: string;
}

export interface ChannelInfo {
  id: string;
  name: string;
  displayName: string;
  avatarUrl?: string;
  followerCount?: number;
  subscriberCount?: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: Date;
  badges?: string[];
  color?: string;
}

export abstract class PlatformAPIService {
  protected client: AxiosInstance;
  protected token: AuthToken | null = null;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000
    });
  }

  setToken(token: AuthToken): void {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token.accessToken}`;
  }

  abstract getChannelInfo(): Promise<ChannelInfo>;
  abstract createStream(title: string, description?: string): Promise<StreamInfo>;
  abstract updateStream(streamId: string, updates: Partial<StreamInfo>): Promise<void>;
  abstract endStream(streamId: string): Promise<void>;
  abstract getStreamKey(): Promise<string>;
}

export class YouTubeAPIService extends PlatformAPIService {
  constructor() {
    super('https://www.googleapis.com/youtube/v3');
  }

  async getChannelInfo(): Promise<ChannelInfo> {
    const response = await this.client.get('/channels', {
      params: {
        part: 'snippet,statistics',
        mine: true
      }
    });

    const channel = response.data.items[0];
    return {
      id: channel.id,
      name: channel.snippet.title,
      displayName: channel.snippet.title,
      avatarUrl: channel.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount)
    };
  }

  async createStream(title: string, description?: string): Promise<StreamInfo> {
    // Create live broadcast
    const broadcastResponse = await this.client.post('/liveBroadcasts', {
      part: 'snippet,status',
      resource: {
        snippet: {
          title,
          description,
          scheduledStartTime: new Date().toISOString()
        },
        status: {
          privacyStatus: 'public'
        }
      }
    });

    // Create live stream
    const streamResponse = await this.client.post('/liveStreams', {
      part: 'snippet,cdn',
      resource: {
        snippet: {
          title: `${title} - Stream`
        },
        cdn: {
          format: '1080p',
          ingestionType: 'rtmp'
        }
      }
    });

    // Bind broadcast to stream
    await this.client.put('/liveBroadcasts/bind', {
      part: 'id',
      id: broadcastResponse.data.id,
      streamId: streamResponse.data.id
    });

    return {
      streamKey: streamResponse.data.cdn.ingestionInfo.streamName,
      rtmpUrl: streamResponse.data.cdn.ingestionInfo.ingestionAddress,
      title,
      description
    };
  }

  async updateStream(streamId: string, updates: Partial<StreamInfo>): Promise<void> {
    await this.client.put(`/liveBroadcasts`, {
      part: 'snippet',
      resource: {
        id: streamId,
        snippet: {
          title: updates.title,
          description: updates.description
        }
      }
    });
  }

  async endStream(streamId: string): Promise<void> {
    await this.client.post('/liveBroadcasts/transition', {
      part: 'status',
      id: streamId,
      broadcastStatus: 'complete'
    });
  }

  async getStreamKey(): Promise<string> {
    const response = await this.client.get('/liveStreams', {
      params: {
        part: 'cdn',
        mine: true
      }
    });

    if (response.data.items.length === 0) {
      throw new Error('No live streams found');
    }

    return response.data.items[0].cdn.ingestionInfo.streamName;
  }
}

export class TwitchAPIService extends PlatformAPIService {
  constructor() {
    super('https://api.twitch.tv/helix');
  }

  setToken(token: AuthToken): void {
    super.setToken(token);
    this.client.defaults.headers.common['Client-Id'] = process.env.TWITCH_CLIENT_ID || '';
  }

  async getChannelInfo(): Promise<ChannelInfo> {
    const response = await this.client.get('/users');
    const user = response.data.data[0];

    const followersResponse = await this.client.get('/channels/followers', {
      params: { broadcaster_id: user.id }
    });

    return {
      id: user.id,
      name: user.login,
      displayName: user.display_name,
      avatarUrl: user.profile_image_url,
      followerCount: followersResponse.data.total
    };
  }

  async createStream(title: string, description?: string): Promise<StreamInfo> {
    const userResponse = await this.client.get('/users');
    const userId = userResponse.data.data[0].id;

    // Update channel information
    await this.client.patch('/channels', {
      broadcaster_id: userId,
      title,
      game_id: '509658' // Just Chatting category
    });

    // Get stream key (requires additional API call or dashboard access)
    const streamKey = await this.getStreamKey();

    return {
      streamKey,
      rtmpUrl: 'rtmp://live.twitch.tv/live',
      title,
      description
    };
  }

  async updateStream(streamId: string, updates: Partial<StreamInfo>): Promise<void> {
    const userResponse = await this.client.get('/users');
    const userId = userResponse.data.data[0].id;

    await this.client.patch('/channels', {
      broadcaster_id: userId,
      title: updates.title
    });
  }

  async endStream(streamId: string): Promise<void> {
    // Twitch streams end automatically when streaming stops
    console.log('Twitch stream ended');
  }

  async getStreamKey(): Promise<string> {
    // Note: Twitch doesn't provide stream key via API for security reasons
    // Users need to get it from their dashboard
    throw new Error('Stream key must be obtained from Twitch Dashboard');
  }
}

export class FacebookAPIService extends PlatformAPIService {
  constructor() {
    super('https://graph.facebook.com/v18.0');
  }

  async getChannelInfo(): Promise<ChannelInfo> {
    const response = await this.client.get('/me', {
      params: {
        fields: 'id,name,picture'
      }
    });

    return {
      id: response.data.id,
      name: response.data.name,
      displayName: response.data.name,
      avatarUrl: response.data.picture?.data?.url
    };
  }

  async createStream(title: string, description?: string): Promise<StreamInfo> {
    const response = await this.client.post('/me/live_videos', {
      title,
      description,
      status: 'LIVE_NOW'
    });

    return {
      streamKey: response.data.stream_url.split('/').pop(),
      rtmpUrl: response.data.stream_url.replace(/\/[^\/]+$/, ''),
      title,
      description
    };
  }

  async updateStream(streamId: string, updates: Partial<StreamInfo>): Promise<void> {
    await this.client.post(`/${streamId}`, {
      title: updates.title,
      description: updates.description
    });
  }

  async endStream(streamId: string): Promise<void> {
    await this.client.post(`/${streamId}`, {
      end_live_video: true
    });
  }

  async getStreamKey(): Promise<string> {
    const response = await this.client.get('/me/live_videos', {
      params: {
        fields: 'stream_url'
      }
    });

    if (response.data.data.length === 0) {
      throw new Error('No active live videos found');
    }

    return response.data.data[0].stream_url.split('/').pop();
  }
}
