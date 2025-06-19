import React from 'react';
import { motion } from 'framer-motion';
import { 
  Keyboard, 
  Folder, 
  Monitor
} from 'lucide-react';

export type SettingsTab = 'general' | 'shortcuts' | 'folders';

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [
    {
      id: 'general' as const,
      label: 'General',
      icon: Monitor,
      description: 'App preferences and behavior'
    },
    {
      id: 'shortcuts' as const,
      label: 'Shortcuts',
      icon: Keyboard,
      description: 'Keyboard shortcuts'
    },
    {
      id: 'folders' as const,
      label: 'Folders',
      icon: Folder,
      description: 'Default save locations'
    }
  ];

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
      <nav className="space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full p-3 text-left rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <Icon size={20} />
                <div>
                  <div className="font-medium">{tab.label}</div>
                  <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                    {tab.description}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
};
