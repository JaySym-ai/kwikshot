import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShortcutsSettings } from './ShortcutsSettings';
import { FoldersSettings } from './FoldersSettings';
import { GeneralSettings } from './GeneralSettings';
import { SettingsHeader } from './SettingsHeader';
import { SettingsSidebar, SettingsTab } from './SettingsSidebar';
import { useSettingsManager } from '../../hooks/useSettingsManager';

interface SettingsProps {
  onClose?: () => void;
}

export const Settings: React.FC<SettingsProps> = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const {
    isLoading,
    hasUnsavedChanges,
    saveStatus,
    handleSave,
    handleReset
  } = useSettingsManager();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'shortcuts':
        return <ShortcutsSettings />;
      case 'folders':
        return <FoldersSettings />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <SettingsHeader
        hasUnsavedChanges={hasUnsavedChanges}
        saveStatus={saveStatus}
        onSave={handleSave}
        onReset={handleReset}
      />

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <SettingsSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
