import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { HardwareCapabilities } from '../../shared/streaming-types';

const execAsync = promisify(exec);

export class HardwareDetector {
  private static instance: HardwareDetector;
  private capabilities: HardwareCapabilities | null = null;

  private constructor() {}

  static getInstance(): HardwareDetector {
    if (!HardwareDetector.instance) {
      HardwareDetector.instance = new HardwareDetector();
    }
    return HardwareDetector.instance;
  }

  /**
   * Detect hardware encoding capabilities
   */
  async detectCapabilities(): Promise<HardwareCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const platform = os.platform();
    const capabilities: HardwareCapabilities = {
      nvenc: false,
      quicksync: false,
      vce: false,
      vaapi: false,
      videotoolbox: false
    };

    try {
      // Detect GPU and encoding capabilities
      if (platform === 'win32') {
        await this.detectWindowsCapabilities(capabilities);
      } else if (platform === 'darwin') {
        await this.detectMacCapabilities(capabilities);
      } else {
        await this.detectLinuxCapabilities(capabilities);
      }

      // Get GPU information
      const gpuInfo = await this.getGPUInfo();
      capabilities.gpuName = gpuInfo.name;
      capabilities.gpuMemory = gpuInfo.memory;

    } catch (error) {
      console.error('Hardware detection failed:', error);
    }

    this.capabilities = capabilities;
    return capabilities;
  }

  /**
   * Get the best available encoder
   */
  async getBestEncoder(): Promise<string> {
    const capabilities = await this.detectCapabilities();

    // Priority order: NVENC > QuickSync > VCE > VideoToolbox > x264
    if (capabilities.nvenc) return 'nvenc';
    if (capabilities.quicksync) return 'quicksync';
    if (capabilities.vce) return 'vce';
    if (capabilities.videotoolbox) return 'videotoolbox';
    
    return 'x264'; // Software fallback
  }

  /**
   * Check if hardware encoding is available
   */
  async isHardwareEncodingAvailable(): Promise<boolean> {
    const capabilities = await this.detectCapabilities();
    return capabilities.nvenc || capabilities.quicksync || capabilities.vce || capabilities.videotoolbox;
  }

  /**
   * Get FFmpeg encoder name for the best available hardware encoder
   */
  async getFFmpegEncoder(): Promise<string> {
    const bestEncoder = await this.getBestEncoder();
    
    switch (bestEncoder) {
      case 'nvenc':
        return 'h264_nvenc';
      case 'quicksync':
        return 'h264_qsv';
      case 'vce':
        return 'h264_amf';
      case 'videotoolbox':
        return 'h264_videotoolbox';
      default:
        return 'libx264';
    }
  }

  /**
   * Get recommended encoding settings based on hardware
   */
  async getRecommendedSettings(): Promise<{
    encoder: string;
    preset: string;
    profile: string;
    level: string;
    bFrames: number;
    lookAhead: boolean;
    psychoVisual: boolean;
  }> {
    const capabilities = await this.detectCapabilities();
    const encoder = await this.getBestEncoder();

    if (encoder === 'nvenc') {
      return {
        encoder: 'h264_nvenc',
        preset: 'p4', // Medium quality
        profile: 'high',
        level: '4.1',
        bFrames: 2,
        lookAhead: true,
        psychoVisual: true
      };
    } else if (encoder === 'quicksync') {
      return {
        encoder: 'h264_qsv',
        preset: 'medium',
        profile: 'high',
        level: '4.1',
        bFrames: 2,
        lookAhead: true,
        psychoVisual: false
      };
    } else if (encoder === 'vce') {
      return {
        encoder: 'h264_amf',
        preset: 'balanced',
        profile: 'high',
        level: '4.1',
        bFrames: 2,
        lookAhead: false,
        psychoVisual: false
      };
    } else if (encoder === 'videotoolbox') {
      return {
        encoder: 'h264_videotoolbox',
        preset: 'medium',
        profile: 'high',
        level: '4.1',
        bFrames: 0,
        lookAhead: false,
        psychoVisual: false
      };
    } else {
      return {
        encoder: 'libx264',
        preset: 'fast',
        profile: 'high',
        level: '4.1',
        bFrames: 2,
        lookAhead: false,
        psychoVisual: true
      };
    }
  }

  private async detectWindowsCapabilities(capabilities: HardwareCapabilities): Promise<void> {
    try {
      // Check for NVIDIA GPU (NVENC)
      const { stdout: nvidiaOutput } = await execAsync('nvidia-smi --query-gpu=name --format=csv,noheader,nounits 2>nul || echo ""');
      if (nvidiaOutput.trim()) {
        capabilities.nvenc = true;
      }

      // Check for Intel GPU (QuickSync)
      const { stdout: intelOutput } = await execAsync('wmic path win32_VideoController get name | findstr Intel');
      if (intelOutput.includes('Intel')) {
        capabilities.quicksync = true;
      }

      // Check for AMD GPU (VCE)
      const { stdout: amdOutput } = await execAsync('wmic path win32_VideoController get name | findstr AMD');
      if (amdOutput.includes('AMD') || amdOutput.includes('Radeon')) {
        capabilities.vce = true;
      }

    } catch (error) {
      console.error('Windows hardware detection failed:', error);
    }
  }

  private async detectMacCapabilities(capabilities: HardwareCapabilities): Promise<void> {
    try {
      // VideoToolbox is available on all modern Macs
      capabilities.videotoolbox = true;

      // Check for discrete GPU
      const { stdout } = await execAsync('system_profiler SPDisplaysDataType');
      if (stdout.includes('NVIDIA')) {
        capabilities.nvenc = true;
      }
      if (stdout.includes('AMD') || stdout.includes('Radeon')) {
        capabilities.vce = true;
      }

    } catch (error) {
      console.error('macOS hardware detection failed:', error);
    }
  }

  private async detectLinuxCapabilities(capabilities: HardwareCapabilities): Promise<void> {
    try {
      // Check for NVIDIA GPU
      const { stdout: nvidiaOutput } = await execAsync('nvidia-smi --query-gpu=name --format=csv,noheader,nounits 2>/dev/null || echo ""');
      if (nvidiaOutput.trim()) {
        capabilities.nvenc = true;
      }

      // Check for Intel GPU (VAAPI)
      const { stdout: intelOutput } = await execAsync('lspci | grep VGA | grep Intel || echo ""');
      if (intelOutput.includes('Intel')) {
        capabilities.vaapi = true;
        capabilities.quicksync = true;
      }

      // Check for AMD GPU
      const { stdout: amdOutput } = await execAsync('lspci | grep VGA | grep AMD || echo ""');
      if (amdOutput.includes('AMD')) {
        capabilities.vce = true;
        capabilities.vaapi = true;
      }

    } catch (error) {
      console.error('Linux hardware detection failed:', error);
    }
  }

  private async getGPUInfo(): Promise<{ name?: string; memory?: number }> {
    const platform = os.platform();
    
    try {
      if (platform === 'win32') {
        const { stdout } = await execAsync('wmic path win32_VideoController get name,AdapterRAM /format:csv');
        const lines = stdout.split('\n').filter(line => line.includes(','));
        if (lines.length > 1) {
          const parts = lines[1].split(',');
          return {
            name: parts[2]?.trim(),
            memory: parseInt(parts[1]) / (1024 * 1024) // Convert to MB
          };
        }
      } else if (platform === 'darwin') {
        const { stdout } = await execAsync('system_profiler SPDisplaysDataType | grep -E "(Chipset Model|VRAM)"');
        const lines = stdout.split('\n');
        const nameMatch = lines.find(line => line.includes('Chipset Model'));
        const memoryMatch = lines.find(line => line.includes('VRAM'));
        
        return {
          name: nameMatch?.split(':')[1]?.trim(),
          memory: memoryMatch ? parseInt(memoryMatch.split(':')[1]) : undefined
        };
      } else {
        const { stdout } = await execAsync('lspci | grep VGA');
        return {
          name: stdout.split(':').pop()?.trim()
        };
      }
    } catch (error) {
      console.error('GPU info detection failed:', error);
    }

    return {};
  }

  /**
   * Test encoding performance
   */
  async testEncodingPerformance(encoder: string): Promise<{
    fps: number;
    cpuUsage: number;
    success: boolean;
  }> {
    try {
      const testCommand = `ffmpeg -f lavfi -i testsrc=duration=10:size=1920x1080:rate=30 -c:v ${encoder} -preset fast -f null - 2>&1`;
      const startTime = Date.now();
      
      const { stdout, stderr } = await execAsync(testCommand);
      const duration = Date.now() - startTime;
      
      // Parse FPS from FFmpeg output
      const fpsMatch = stderr.match(/fps=\s*(\d+\.?\d*)/);
      const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 0;
      
      return {
        fps,
        cpuUsage: 0, // Would need additional monitoring
        success: fps > 0
      };
    } catch (error) {
      return {
        fps: 0,
        cpuUsage: 100,
        success: false
      };
    }
  }
}
