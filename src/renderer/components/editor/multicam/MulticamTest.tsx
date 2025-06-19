// Multicam Test Component - Test multicam functionality
// Built using AugmentCode tool - www.augmentcode.com

import React, { useEffect } from 'react';
import { useVideoEditorStore } from '../../../stores/videoEditorStore';
import { ProjectSettings } from '../../../types/videoEditorTypes';

export const MulticamTest: React.FC = () => {
  const {
    currentProject,
    createNewProject,
    addTrack,
    createMulticamGroup,
    switchMulticamAngle,
    enablePodcastMode,
    multicamGroups,
    podcastMode
  } = useVideoEditorStore();

  useEffect(() => {
    // Create a test project if none exists
    if (!currentProject) {
      const testSettings: ProjectSettings = {
        name: 'Multicam Test Project',
        width: 1920,
        height: 1080,
        frameRate: 30,
        sampleRate: 48000,
        duration: 300, // 5 minutes
        backgroundColor: '#000000'
      };
      
      createNewProject(testSettings);
    }
  }, [currentProject, createNewProject]);

  const createTestMulticamSetup = () => {
    if (!currentProject) return;

    // Add multiple video tracks for multicam
    const track1Id = addTrack('video', 'Camera 1 - Main');
    const track2Id = addTrack('video', 'Camera 2 - Close-up');
    const track3Id = addTrack('video', 'Camera 3 - Wide');
    const audioTrackId = addTrack('audio', 'Audio Mix');

    // Create multicam group
    const groupId = createMulticamGroup('Main Multicam Group', [track1Id, track2Id, track3Id]);
    
    console.log('Created multicam group:', groupId);
    console.log('Tracks:', [track1Id, track2Id, track3Id, audioTrackId]);
  };

  const testCameraSwitching = () => {
    if (multicamGroups.length === 0) {
      alert('Please create a multicam setup first');
      return;
    }

    const group = multicamGroups[0];
    
    // Test switching between angles
    setTimeout(() => switchMulticamAngle(group.id, 0), 1000);
    setTimeout(() => switchMulticamAngle(group.id, 1), 2000);
    setTimeout(() => switchMulticamAngle(group.id, 2), 3000);
    setTimeout(() => switchMulticamAngle(group.id, 0), 4000);
    
    console.log('Testing camera switching sequence...');
  };

  const testPodcastMode = () => {
    enablePodcastMode({
      enabled: true,
      speakers: [
        {
          id: 'speaker-1',
          name: 'Host',
          trackId: currentProject?.tracks[0]?.id || '',
          color: '#3b82f6',
          avatar: undefined,
          voiceProfile: undefined
        },
        {
          id: 'speaker-2',
          name: 'Guest',
          trackId: currentProject?.tracks[1]?.id || '',
          color: '#10b981',
          avatar: undefined,
          voiceProfile: undefined
        }
      ],
      autoSwitchOnSpeaker: true,
      switchTransitionDuration: 0.5,
      showSpeakerLabels: true,
      quickSwitchKeys: {
        '1': currentProject?.tracks[0]?.id || '',
        '2': currentProject?.tracks[1]?.id || ''
      }
    });
    
    console.log('Enabled podcast mode');
  };

  return (
    <div className="multicam-test p-6 bg-gray-800 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Multicam Test Panel</h3>
      
      <div className="space-y-4">
        {/* Project Status */}
        <div className="bg-gray-700 p-4 rounded">
          <h4 className="font-semibold mb-2">Project Status</h4>
          <p>Project: {currentProject ? currentProject.name : 'No project loaded'}</p>
          <p>Tracks: {currentProject?.tracks.length || 0}</p>
          <p>Multicam Groups: {multicamGroups.length}</p>
          <p>Podcast Mode: {podcastMode.enabled ? 'Enabled' : 'Disabled'}</p>
        </div>

        {/* Test Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={createTestMulticamSetup}
            className="btn-primary p-3 rounded"
            disabled={!currentProject}
          >
            Create Test Multicam Setup
          </button>
          
          <button
            onClick={testCameraSwitching}
            className="btn-secondary p-3 rounded"
            disabled={multicamGroups.length === 0}
          >
            Test Camera Switching
          </button>
          
          <button
            onClick={testPodcastMode}
            className="btn-accent p-3 rounded"
            disabled={!currentProject || currentProject.tracks.length < 2}
          >
            Enable Podcast Mode
          </button>
        </div>

        {/* Multicam Groups Info */}
        {multicamGroups.length > 0 && (
          <div className="bg-gray-700 p-4 rounded">
            <h4 className="font-semibold mb-2">Multicam Groups</h4>
            {multicamGroups.map((group, index) => (
              <div key={group.id} className="mb-2 p-2 bg-gray-600 rounded">
                <p className="font-medium">{group.name}</p>
                <p className="text-sm text-gray-300">
                  Angles: {group.angles.length} | Active: {group.activeAngle + 1}
                </p>
                <p className="text-sm text-gray-300">
                  Sync Points: {group.syncPoints.length}
                </p>
                <div className="flex space-x-2 mt-2">
                  {group.angles.map((angle, angleIndex) => (
                    <button
                      key={angle.id}
                      onClick={() => switchMulticamAngle(group.id, angleIndex)}
                      className={`px-2 py-1 text-xs rounded ${
                        angleIndex === group.activeAngle
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-500 text-gray-200'
                      }`}
                    >
                      {angle.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="bg-gray-700 p-4 rounded">
          <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p><kbd className="bg-gray-600 px-1 rounded">1-9</kbd> Switch camera angles</p>
            <p><kbd className="bg-gray-600 px-1 rounded">Space</kbd> Play/Pause</p>
            <p><kbd className="bg-gray-600 px-1 rounded">Ctrl+S</kbd> Save project</p>
            <p><kbd className="bg-gray-600 px-1 rounded">Ctrl+N</kbd> New project</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded">
          <h4 className="font-semibold mb-2 text-blue-300">Test Instructions</h4>
          <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
            <li>Click "Create Test Multicam Setup" to add tracks and create a multicam group</li>
            <li>Use "Test Camera Switching" to see automated angle switching</li>
            <li>Try manual switching using the angle buttons or number keys 1-3</li>
            <li>Enable "Podcast Mode" to test speaker-focused editing</li>
            <li>Check the browser console for debug information</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
