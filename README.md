# 🎬 KwikShot

<div align="center">

> **🚀 Built by the [AugmentCode.com](https://www.augmentcode.com) Community using AugmentCode Tool**
>
> *Empowering developers to build better software faster through AI-assisted development*

![KwikShot Logo](https://img.shields.io/badge/KwikShot-Screen%20Recorder-blue?style=for-the-badge&logo=video&logoColor=white)

**Professional Screen Recorder, Video Editor & Live Streaming Platform**

*Capture, edit, and stream your content with professional quality*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-36.4.0-47848F?style=flat&logo=electron&logoColor=white)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[![GitHub stars](https://img.shields.io/github/stars/your-username/kwikshot?style=social)](https://github.com/your-username/kwikshot/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/your-username/kwikshot?style=social)](https://github.com/your-username/kwikshot/network/members)
[![GitHub issues](https://img.shields.io/github/issues/your-username/kwikshot)](https://github.com/your-username/kwikshot/issues)
[![GitHub release](https://img.shields.io/github/v/release/your-username/kwikshot)](https://github.com/your-username/kwikshot/releases)

[Download](#-installation) • [Features](#-features) • [Screenshots](#-screenshots) • [Documentation](#-usage) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 🎥 **Recording Capabilities**
- **Multi-Source Recording**: Capture screen, webcam, and audio simultaneously
- **High-Quality Output**: Support for 1080p, 1440p, and 4K recording
- **Flexible Frame Rates**: 30 FPS and 60 FPS options
- **Real-time Preview**: See what you're recording in real-time

### ✂️ **Video Editing**
- **Timeline Editor**: Professional timeline with drag-and-drop functionality
- **Trim & Cut**: Precise video trimming and cutting tools
- **Multiple Tracks**: Separate video and audio track management
- **Export Options**: Multiple format support (MP4, MOV, WebM)

### 📡 **Live Streaming**
- **Multi-Platform Streaming**: Stream to YouTube, Twitch, Facebook Live, and custom RTMP servers
- **Real-time Streaming**: Low-latency streaming with hardware acceleration
- **Stream Management**: Start, stop, pause, and resume streams with one click
- **Stream Monitoring**: Real-time metrics including bitrate, FPS, and connection status
- **Custom RTMP**: Support for any RTMP-compatible streaming service
- **WebRTC Support**: Browser-based streaming for modern platforms

### 🎨 **Modern Interface**
- **Dark Theme**: Beautiful dark UI with glass morphism effects
- **Responsive Design**: Adaptive layout for different screen sizes
- **Smooth Animations**: Framer Motion powered transitions
- **Keyboard Shortcuts**: Efficient workflow with hotkeys

### ⚡ **Performance**
- **Cross-Platform**: Windows, macOS, and Linux support
- **Auto-Updates**: Built-in update mechanism
- **Lightweight**: Optimized for performance and low resource usage
- **Native Integration**: Deep OS integration for seamless experience

---

## 📸 Screenshots

<div align="center">

### 🎥 Recording Interface
*Intuitive recording controls with real-time preview*


### ✂️ Video Editor
*Professional timeline editor with drag-and-drop functionality*


### 📡 Live Streaming Interface
*Professional streaming controls with real-time metrics*

### 🎨 Modern Dark UI
*Beautiful dark theme with glass morphism effects*


</div>

---

## 📋 Table of Contents

- [🚀 Installation](#-installation)
- [📖 Usage](#-usage)
- [📡 Live Streaming](#-live-streaming) ⭐ **New Feature!**
- [🛠️ Tech Stack](#️-tech-stack)
- [🤝 Contributing](#-contributing)
- [🎯 Roadmap](#-roadmap)
- [📞 Support](#-support)

---

## 🚀 Installation

### Download Pre-built Binaries

**Windows**
```bash
# Download the latest Windows installer
curl -L -o kwikshot-setup.exe https://github.com/your-username/kwikshot/releases/latest/download/kwikshot-setup.exe
```

**macOS**
```bash
# Download the latest macOS DMG
curl -L -o kwikshot.dmg https://github.com/your-username/kwikshot/releases/latest/download/kwikshot.dmg
```

**Linux**
```bash
# Download the latest Linux AppImage
curl -L -o kwikshot.AppImage https://github.com/your-username/kwikshot/releases/latest/download/kwikshot.AppImage
chmod +x kwikshot.AppImage
```

### Build from Source

**Prerequisites**
- Node.js 18+
- npm or yarn
- Git

**Clone and Install**
```bash
git clone https://github.com/your-username/kwikshot.git
cd kwikshot
npm install
```

**Development**
```bash
npm run dev
```

**Build for Production**
```bash
# Build for current platform
npm run build

# Build for all platforms
npm run dist

# Platform-specific builds
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

### 🐳 Docker Development (Recommended)

**Prerequisites**
- Docker
- Make (included on macOS/Linux, install via chocolatey/scoop on Windows)

**Quick Start with Docker**
```bash
# Clone the repository
git clone https://github.com/your-username/kwikshot.git
cd kwikshot

# Build the Docker image
make build

# Start the development server (default port 3000)
make start

# Or start on a custom port
make start HOST_PORT=4545
# Alternative syntax: HOST_PORT=4545 make start
```

**Docker Commands**
```bash
# Build the Docker image
make build

# Start the container
make start

# Start with custom host port
make start HOST_PORT=8080
HOST_PORT=4545 make start

# Stop the container
make stop

# Restart the container
make restart

# View container logs
make logs

# Check container status
make status

# Run tests
make test

# Clean up (remove container and image)
make clean

# Show help with all available commands
make help
```

**Port Configuration**
- **Default**: Application runs on http://localhost:3000
- **Custom Port**: Use `HOST_PORT=XXXX make start` to run on a different port
- **Container Port**: The app always runs on port 3000 inside the container
- **Host Port**: The port you access from your browser (configurable)

---

## 📖 Usage

### Quick Start

**For Development (Docker)**
```bash
git clone https://github.com/your-username/kwikshot.git
cd kwikshot
make build && make start
# Open http://localhost:3000 in your browser
```

**For End Users**
1. **Launch KwikShot** from your applications menu
2. **Select Recording Sources** - Choose your screen, webcam, and microphone
3. **Configure Settings** - Set resolution, frame rate, and quality
4. **Start Recording** - Click the record button to begin
5. **Edit Your Video** - Switch to the editor to trim and enhance
6. **Export** - Save your final video in your preferred format

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Start/Stop Recording | `Ctrl/Cmd + R` |
| Pause Recording | `Ctrl/Cmd + P` |
| Switch to Editor | `Ctrl/Cmd + E` |
| Export Video | `Ctrl/Cmd + S` |
| Play/Pause | `Space` |
| Go Live | `Ctrl/Cmd + L` |

---

## 📡 Live Streaming

KwikShot includes powerful live streaming capabilities that allow you to broadcast directly to popular platforms or any custom RTMP server.

### 🚀 Quick Start

1. **Navigate to Live Stream**: Click the "Live Stream" tab in the sidebar
2. **Configure Stream Settings**: Set up your streaming platform and quality settings
3. **Test Your Setup**: Use the preview to ensure everything looks good
4. **Go Live**: Click "Start Stream" to begin broadcasting

### 🎯 Supported Platforms

#### **Popular Streaming Services**
- **YouTube Live**: Direct integration with YouTube's streaming API
- **Twitch**: Stream to Twitch with optimized settings
- **Facebook Live**: Broadcast to Facebook Live
- **Custom RTMP**: Any RTMP-compatible service

#### **Configuration Examples**

**YouTube Live**
```json
{
  "platform": "youtube",
  "streamKey": "your-youtube-stream-key",
  "server": "rtmp://a.rtmp.youtube.com/live2/",
  "quality": "1080p",
  "bitrate": 4500
}
```

**Twitch**
```json
{
  "platform": "twitch",
  "streamKey": "your-twitch-stream-key",
  "server": "rtmp://live.twitch.tv/live/",
  "quality": "1080p",
  "bitrate": 6000
}
```

**Custom RTMP Server**
```json
{
  "platform": "custom",
  "streamKey": "your-stream-key",
  "server": "rtmp://your-server.com/live/",
  "quality": "720p",
  "bitrate": 3000
}
```

### ⚙️ Stream Configuration

#### **Video Settings**
- **Resolution**: 720p, 1080p, 1440p, 4K
- **Frame Rate**: 30 FPS, 60 FPS
- **Bitrate**: 1000-8000 kbps (auto-calculated based on quality)
- **Encoder**: Hardware (recommended) or Software encoding

#### **Audio Settings**
- **Sample Rate**: 44.1 kHz, 48 kHz
- **Bitrate**: 128 kbps, 192 kbps, 320 kbps
- **Channels**: Mono, Stereo

#### **Advanced Options**
- **Keyframe Interval**: 2-4 seconds (recommended: 2s)
- **Buffer Size**: Auto or manual configuration
- **Low Latency Mode**: Enable for real-time interaction
- **Hardware Acceleration**: GPU encoding for better performance

### 📊 Stream Monitoring

KwikShot provides real-time monitoring of your stream:

- **Connection Status**: Live connection health indicator
- **Bitrate**: Current upload bitrate and target bitrate
- **Frame Rate**: Actual vs target frame rate
- **Dropped Frames**: Monitor for performance issues
- **Stream Duration**: Total streaming time
- **Viewer Count**: (when supported by platform)

### 🛠️ Setup Instructions

#### **1. Get Your Stream Key**

**YouTube Live**
1. Go to [YouTube Studio](https://studio.youtube.com)
2. Click "Go Live" → "Stream"
3. Copy your "Stream key"
4. Copy the "Stream URL" (usually `rtmp://a.rtmp.youtube.com/live2/`)

**Twitch**
1. Go to [Twitch Creator Dashboard](https://dashboard.twitch.tv)
2. Navigate to "Settings" → "Stream"
3. Copy your "Primary Stream key"
4. Server URL is `rtmp://live.twitch.tv/live/`

**Facebook Live**
1. Go to [Facebook Live Producer](https://www.facebook.com/live/producer)
2. Create a new live video
3. Copy the "Server URL" and "Stream Key"

#### **2. Configure KwikShot**

1. **Open Live Stream Tab**: Click the radio icon in the sidebar
2. **Select Platform**: Choose your streaming platform or "Custom RTMP"
3. **Enter Credentials**:
   - **Stream Key**: Paste your stream key
   - **Server URL**: Enter the RTMP server URL
4. **Set Quality**: Choose resolution and bitrate based on your internet speed
5. **Test Connection**: Use the "Test Stream" button to verify settings

#### **3. Optimize Your Settings**

**Internet Speed Recommendations**
- **720p 30fps**: 3-5 Mbps upload
- **1080p 30fps**: 5-8 Mbps upload
- **1080p 60fps**: 8-12 Mbps upload
- **1440p 60fps**: 12-20 Mbps upload

**Hardware Requirements**
- **CPU**: Intel i5-8400 / AMD Ryzen 5 2600 or better
- **GPU**: NVIDIA GTX 1060 / AMD RX 580 or better (for hardware encoding)
- **RAM**: 8GB minimum, 16GB recommended

### 🎮 Stream Controls

#### **Basic Controls**
- **Start Stream**: Begin broadcasting to your configured platform
- **Stop Stream**: End the current stream
- **Pause Stream**: Temporarily pause the stream (if supported)
- **Resume Stream**: Resume a paused stream

#### **Advanced Features**
- **Scene Switching**: Switch between different recording sources
- **Audio Mixing**: Adjust microphone and system audio levels
- **Stream Preview**: See exactly what your viewers will see
- **Recording While Streaming**: Save a local copy while streaming live

### 🔧 Troubleshooting

#### **Common Issues**

**Stream Won't Start**
```bash
# Check your stream key and server URL
# Verify internet connection (test with speedtest)
# Ensure firewall isn't blocking RTMP traffic
```

**Poor Stream Quality**
```bash
# Reduce bitrate or resolution
# Enable hardware encoding if available
# Close other bandwidth-intensive applications
# Check for dropped frames in stream monitor
```

**Audio Issues**
```bash
# Check audio device selection
# Verify audio levels aren't too high/low
# Test with different audio sample rates
# Ensure exclusive mode is disabled for audio devices
```

**Connection Drops**
```bash
# Check internet stability
# Reduce bitrate to match upload speed
# Use wired connection instead of WiFi
# Contact your ISP if issues persist
```

#### **Performance Optimization**

**For Better Performance**
1. **Use Hardware Encoding**: Enable GPU encoding in settings
2. **Close Unnecessary Apps**: Free up CPU and memory
3. **Wired Connection**: Use Ethernet instead of WiFi
4. **Dedicated Streaming PC**: Use a separate computer for streaming (advanced)

**Quality vs Performance Balance**
- **High Quality**: 1080p60, 6000 kbps (requires powerful hardware)
- **Balanced**: 1080p30, 4500 kbps (good for most setups)
- **Performance**: 720p30, 3000 kbps (works on older hardware)

### 📱 Platform-Specific Tips

#### **YouTube Live**
- Enable "Low Latency" for real-time chat interaction
- Use 1080p for best quality (YouTube compresses heavily)
- Schedule streams in advance for better discoverability

#### **Twitch**
- Use 6000 kbps max bitrate (Twitch limit)
- Enable "Low Latency Mode" for better chat interaction
- Consider using 936p (1664x936) for better quality at 6000 kbps

#### **Facebook Live**
- Use square (1:1) or vertical (9:16) aspect ratios for mobile viewers
- Enable captions for better accessibility
- Stream to Facebook Pages for business content

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Desktop Framework**: Electron 36
- **Styling**: Tailwind CSS 3 + Framer Motion
- **Video Processing**: FFmpeg
- **State Management**: Zustand
- **Build Tool**: Webpack 5
- **Icons**: Lucide React

---

## 🏗️ Project Structure

```
kwikshot/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React frontend
│   │   ├── components/ # UI components
│   │   ├── styles/     # CSS and styling
│   │   └── utils/      # Utility functions
│   └── shared/         # Shared types and utilities
├── build/              # Build configuration
├── dist/               # Built application
└── release/            # Distribution packages
```

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

**Option 1: Docker (Recommended)**
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/kwikshot.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Start development environment: `make build && make start`
5. Make your changes and test: `make test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

**Option 2: Local Development**
1. Fork the repository
2. Clone your fork and install dependencies: `npm install`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Start development server: `npm run dev`
5. Make your changes and test thoroughly
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

**Built by the Community**

This project was developed by the amazing community at **[www.augmentcode.com](https://www.augmentcode.com)** using the **AugmentCode** development tool.

AugmentCode empowers developers to build better software faster through AI-assisted development and collaborative coding tools.

---

## 🎯 Roadmap

### ✅ Recently Completed
- [x] **Live Streaming**: Direct streaming to YouTube, Twitch, Facebook Live, and custom RTMP servers
- [x] **Stream Monitoring**: Real-time metrics including bitrate, FPS, and connection status
- [x] **Multi-Platform Support**: Integrated streaming to popular platforms with optimized settings
- [x] **Modern UI**: Dark theme with glass morphism effects
- [x] **Cross-platform**: Windows, macOS, and Linux support

### 🚧 In Progress
- [ ] **Advanced Stream Features**: Stream overlays, scene switching, and multi-streaming
- [ ] **Stream Recording**: Save local copies while streaming live

### 📋 Upcoming Features
- [ ] **Advanced Editing**: Color correction, filters, and effects
- [ ] **Cloud Storage**: Integration with Google Drive, Dropbox, and OneDrive
- [ ] **Collaboration**: Real-time collaborative editing
- [ ] **Mobile App**: Companion mobile app for remote control
- [ ] **AI Features**: Auto-transcription and smart editing suggestions
- [ ] **Plugin System**: Third-party integrations and custom extensions

---

## 📊 System Requirements

### Minimum Requirements
- **OS**: Windows 10, macOS 10.14, or Ubuntu 18.04+
- **RAM**: 4 GB
- **Storage**: 500 MB free space
- **Graphics**: DirectX 11 compatible

### Recommended Requirements
- **OS**: Windows 11, macOS 12+, or Ubuntu 20.04+
- **RAM**: 8 GB or more
- **Storage**: 2 GB free space
- **Graphics**: Dedicated GPU for hardware acceleration

---

## 🔧 Configuration

### Recording Settings
```json
{
  "video": {
    "resolution": "1920x1080",
    "frameRate": 30,
    "quality": "high",
    "codec": "h264"
  },
  "audio": {
    "sampleRate": 44100,
    "bitRate": 128,
    "channels": 2
  }
}
```

### Export Formats
- **MP4**: Best for general use and sharing
- **MOV**: Ideal for professional editing workflows
- **WebM**: Perfect for web deployment
- **AVI**: Legacy format support

---

## 🔧 Troubleshooting

### Docker Issues

**Port Already in Use**
```bash
# Error: Bind for 0.0.0.0:3000 failed: port is already allocated
# Solution: Use a different port
HOST_PORT=4545 make start
```

**Container Won't Start**
```bash
# Check container status
make status

# View logs for errors
make logs

# Clean up and rebuild
make clean
make build
make start
```

**Permission Issues (Linux)**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in, then try again
```

### Make Command Not Found

**Windows**
```bash
# Install via Chocolatey
choco install make

# Or via Scoop
scoop install make
```

**macOS**
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

---

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-username/kwikshot/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-username/kwikshot/discussions)
- 💬 **Community**: [AugmentCode Community](https://www.augmentcode.com)
- 📚 **Documentation**: [Wiki](https://github.com/your-username/kwikshot/wiki)

---

<div align="center">

**Made with ❤️ by the [AugmentCode](https://www.augmentcode.com) Community**

⭐ Star this repo if you find it helpful!

</div>
