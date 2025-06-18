import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { NetworkStats } from '../../shared/streaming-types';

const execAsync = promisify(exec);

export class NetworkMonitor extends EventEmitter {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private lastStats: NetworkStats | null = null;
  private readonly MONITOR_INTERVAL = 5000; // 5 seconds

  constructor() {
    super();
  }

  /**
   * Start network monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectNetworkStats();
    }, this.MONITOR_INTERVAL);

    this.emit('monitoring-started');
  }

  /**
   * Stop network monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoring-stopped');
  }

  /**
   * Get the latest network statistics
   */
  getLatestStats(): NetworkStats | null {
    return this.lastStats;
  }

  /**
   * Test connection to a specific server
   */
  async testConnection(host: string, port: number = 80): Promise<{
    latency: number;
    success: boolean;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      
      // Use ping for latency test
      const { stdout } = await execAsync(`ping -c 1 ${host}`);
      const latency = Date.now() - startTime;
      
      return {
        latency,
        success: true
      };
    } catch (error) {
      return {
        latency: -1,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Measure bandwidth using a speed test
   */
  async measureBandwidth(): Promise<{
    downloadSpeed: number;
    uploadSpeed: number;
  }> {
    try {
      // Simple bandwidth test using curl to download a test file
      const downloadTest = await this.testDownloadSpeed();
      const uploadTest = await this.testUploadSpeed();

      return {
        downloadSpeed: downloadTest,
        uploadSpeed: uploadTest
      };
    } catch (error) {
      console.error('Bandwidth measurement failed:', error);
      return {
        downloadSpeed: 0,
        uploadSpeed: 0
      };
    }
  }

  /**
   * Get recommended bitrate based on network conditions
   */
  getRecommendedBitrate(): number {
    if (!this.lastStats) return 2500; // Default fallback

    const { uploadSpeed, latency, packetLoss } = this.lastStats;
    
    // Conservative approach: use 70% of available upload bandwidth
    let recommendedBitrate = Math.floor(uploadSpeed * 0.7 * 1000); // Convert Mbps to kbps

    // Adjust based on latency
    if (latency > 100) {
      recommendedBitrate *= 0.8; // Reduce by 20% for high latency
    } else if (latency > 50) {
      recommendedBitrate *= 0.9; // Reduce by 10% for moderate latency
    }

    // Adjust based on packet loss
    if (packetLoss > 2) {
      recommendedBitrate *= 0.7; // Reduce by 30% for high packet loss
    } else if (packetLoss > 1) {
      recommendedBitrate *= 0.85; // Reduce by 15% for moderate packet loss
    }

    // Ensure minimum and maximum bounds
    return Math.max(500, Math.min(recommendedBitrate, 8000));
  }

  /**
   * Get connection quality assessment
   */
  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!this.lastStats) return 'fair';

    const { uploadSpeed, latency, packetLoss } = this.lastStats;

    if (uploadSpeed >= 5 && latency <= 30 && packetLoss <= 0.5) {
      return 'excellent';
    } else if (uploadSpeed >= 3 && latency <= 50 && packetLoss <= 1) {
      return 'good';
    } else if (uploadSpeed >= 1.5 && latency <= 100 && packetLoss <= 2) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  private async collectNetworkStats(): Promise<void> {
    try {
      const bandwidth = await this.measureBandwidth();
      const latency = await this.measureLatency();
      const packetLoss = await this.measurePacketLoss();

      const stats: NetworkStats = {
        downloadSpeed: bandwidth.downloadSpeed,
        uploadSpeed: bandwidth.uploadSpeed,
        latency,
        jitter: await this.measureJitter(),
        packetLoss,
        timestamp: new Date()
      };

      this.lastStats = stats;
      this.emit('stats-updated', stats);

      // Emit warnings for poor network conditions
      if (stats.uploadSpeed < 1) {
        this.emit('network-warning', 'Low upload bandwidth detected');
      }
      if (stats.latency > 100) {
        this.emit('network-warning', 'High latency detected');
      }
      if (stats.packetLoss > 2) {
        this.emit('network-warning', 'High packet loss detected');
      }

    } catch (error) {
      console.error('Failed to collect network stats:', error);
      this.emit('error', error);
    }
  }

  private async testDownloadSpeed(): Promise<number> {
    try {
      // Download a 1MB test file and measure speed
      const testUrl = 'https://httpbin.org/bytes/1048576'; // 1MB
      const startTime = Date.now();
      
      await execAsync(`curl -s -o /dev/null "${testUrl}"`);
      
      const duration = (Date.now() - startTime) / 1000; // seconds
      const sizeInMB = 1;
      const speedMbps = (sizeInMB * 8) / duration; // Convert to Mbps
      
      return Math.round(speedMbps * 100) / 100;
    } catch (error) {
      return 0;
    }
  }

  private async testUploadSpeed(): Promise<number> {
    try {
      // Upload test data and measure speed
      const testData = 'x'.repeat(1048576); // 1MB of data
      const startTime = Date.now();
      
      await execAsync(`echo "${testData}" | curl -s -X POST -d @- https://httpbin.org/post`);
      
      const duration = (Date.now() - startTime) / 1000; // seconds
      const sizeInMB = 1;
      const speedMbps = (sizeInMB * 8) / duration; // Convert to Mbps
      
      return Math.round(speedMbps * 100) / 100;
    } catch (error) {
      return 0;
    }
  }

  private async measureLatency(): Promise<number> {
    try {
      const { stdout } = await execAsync('ping -c 4 8.8.8.8');
      const lines = stdout.split('\n');
      const statsLine = lines.find(line => line.includes('avg'));
      
      if (statsLine) {
        const match = statsLine.match(/(\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+)/);
        if (match) {
          return parseFloat(match[2]); // avg latency
        }
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private async measureJitter(): Promise<number> {
    try {
      const { stdout } = await execAsync('ping -c 10 8.8.8.8');
      const lines = stdout.split('\n');
      const times: number[] = [];
      
      lines.forEach(line => {
        const match = line.match(/time=(\d+\.\d+)/);
        if (match) {
          times.push(parseFloat(match[1]));
        }
      });
      
      if (times.length < 2) return 0;
      
      // Calculate jitter as standard deviation
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
      
      return Math.sqrt(variance);
    } catch (error) {
      return 0;
    }
  }

  private async measurePacketLoss(): Promise<number> {
    try {
      const { stdout } = await execAsync('ping -c 10 8.8.8.8');
      const lines = stdout.split('\n');
      const statsLine = lines.find(line => line.includes('packet loss'));
      
      if (statsLine) {
        const match = statsLine.match(/(\d+)% packet loss/);
        if (match) {
          return parseInt(match[1]);
        }
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}
