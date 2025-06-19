import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export const useSettingsManager = () => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const {
    isLoading,
    hasUnsavedChanges,
    loadSettings,
    saveSettings,
    resetToDefaults
  } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaveStatus('saving');
    const success = await saveSettings();
    setSaveStatus(success ? 'success' : 'error');
    
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      resetToDefaults();
    }
  };

  return {
    isLoading,
    hasUnsavedChanges,
    saveStatus,
    handleSave,
    handleReset
  };
};
