// Changelog Data - Track changes and updates to KwikShot
// Built using AugmentCode tool - www.augmentcode.com

export interface ChangelogEntry {
  id: string;
  date: string;
  version?: string;
  type: 'feature' | 'improvement' | 'bugfix' | 'breaking';
  title: string;
  description: string;
  author?: string;
  tags?: string[];
  changes?: string[]; // Support for both formats
}

export const changelogData: ChangelogEntry[] = [
  {
    id: 'readme-cleanup-2025-06-19',
    date: '2025-06-19',
    version: '2.0.2',
    type: 'improvement',
    title: 'README Documentation Cleanup',
    description: 'Fixed duplicate sections and merge conflicts in README documentation',
    author: 'AugmentCode AI Assistant',
    tags: ['documentation', 'readme', 'cleanup'],
    changes: [
      'Removed duplicate "Advanced Recording Capabilities" section',
      'Cleaned up merge conflict markers throughout the document',
      'Consolidated roadmap phases and progress tracking',
      'Updated project status to reflect current completion state',
      'Reorganized development timeline and priorities',
      'Fixed inconsistent phase numbering and descriptions'
    ]
  },
  {
    id: 'multicam-timeline-2025-01-18',
    date: '2025-01-18',
    version: '2.1.0',
    type: 'feature',
    title: 'Multiple Timeline Support with Multicam Editing',
    description: `Added comprehensive multiple timeline support with advanced multicam editing capabilities:

**Multiple Timeline Features:**
• Create and manage multiple timelines within a single project
• Switch between timelines seamlessly
• Independent track management per timeline
• Timeline duplication and versioning

**Multicam Editing:**
• Multicam group creation and management
• Automatic audio-based synchronization
• Manual sync point adjustment
• Real-time multicam preview with grid, sidebar, and overlay layouts
• Quick camera angle switching with keyboard shortcuts (1-9)
• Camera switching events with transition support (cut, fade, dissolve)
• Sync controls with confidence scoring

**Podcast Mode:**
• Specialized podcast editing interface
• Speaker-focused camera switching
• Quick switch keys for rapid editing
• Auto-switch based on speaker activity
• Speaker profile management with voice recognition
• Streamlined cutting and editing workflow

**Technical Improvements:**
• Enhanced video editor store with multicam state management
• New MulticamManager service for synchronization algorithms
• Comprehensive type definitions for multicam workflows
• Performance optimizations for multiple video streams`,
    author: 'AugmentCode AI Assistant',
    tags: ['multicam', 'timeline', 'podcast', 'synchronization', 'video-editing']
  },
  {
    id: 'editor-modes-2025-01-18',
    date: '2025-01-18',
    version: '2.1.0',
    type: 'feature',
    title: 'Editor Mode System',
    description: `Implemented dynamic editor mode system with three distinct editing modes:

**Standard Mode:**
• Traditional single-timeline editing
• Full feature access for basic video editing
• Optimized for simple projects

**Multicam Mode:**
• Multi-camera timeline interface
• Synchronized playback across multiple angles
• Advanced switching and preview capabilities
• Professional multicam workflow support

**Podcast Mode:**
• Speaker-centric editing interface
• Simplified controls for conversation editing
• Quick speaker switching and cut management
• Optimized for podcast and interview content

The editor automatically switches modes based on project content and user preferences.`,
    author: 'AugmentCode AI Assistant',
    tags: ['editor-modes', 'ui', 'workflow', 'user-experience']
  },
  {
    id: 'multicam-components-2025-01-18',
    date: '2025-01-18',
    version: '2.1.0',
    type: 'feature',
    title: 'Multicam UI Components',
    description: `Created comprehensive UI components for multicam editing:

**MulticamTimeline Component:**
• Integrated timeline with multicam controls
• Sync controls panel with auto-sync capabilities
• Real-time preview integration
• Keyboard shortcut support

**CameraSwitcher Component:**
• Visual camera angle selection
• Activity indicators for each angle
• Quick switch buttons with preview
• Recent switch history tracking

**MulticamPreview Component:**
• Multiple layout options (grid, sidebar, overlay)
• Real-time preview of all camera angles
• Click-to-switch functionality
• Fullscreen preview mode

**SyncControls Component:**
• Manual and automatic synchronization
• Audio-based sync analysis
• Confidence scoring and validation
• Sync point management

**PodcastMode Component:**
• Speaker management interface
• Quick switch key configuration
• Activity monitoring and auto-switching
• Streamlined podcast editing controls`,
    author: 'AugmentCode AI Assistant',
    tags: ['components', 'ui', 'multicam', 'podcast', 'react']
  },
  {
    id: 'refactoring-2025-06-18',
    date: '2025-06-18',
    version: '2.0.1',
    type: 'improvement',
    title: 'Component Refactoring and Code Organization',
    description: 'Improved code maintainability and organization',
    author: 'Development Team',
    tags: ['refactoring', 'maintainability', 'components'],
    changes: [
      'Refactored large components into smaller, reusable components for better maintainability',
      'Created custom hooks for tour management, recording logic, and streaming state',
      'Extracted UI components for headers, dialogs, and status indicators',
      'Improved code organization and separation of concerns'
    ]
  }
];

export const getChangelogByDate = (date: string): ChangelogEntry[] => {
  return changelogData.filter(entry => entry.date === date);
};

export const getChangelogByVersion = (version: string): ChangelogEntry[] => {
  return changelogData.filter(entry => entry.version === version);
};

export const getChangelogByType = (type: ChangelogEntry['type']): ChangelogEntry[] => {
  return changelogData.filter(entry => entry.type === type);
};

export const getLatestChanges = (count: number = 10): ChangelogEntry[] => {
  return changelogData
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
};

export const searchChangelog = (query: string): ChangelogEntry[] => {
  const lowercaseQuery = query.toLowerCase();
  return changelogData.filter(entry =>
    entry.title?.toLowerCase().includes(lowercaseQuery) ||
    entry.description?.toLowerCase().includes(lowercaseQuery) ||
    entry.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    entry.changes?.some(change => change.toLowerCase().includes(lowercaseQuery))
  );
};
