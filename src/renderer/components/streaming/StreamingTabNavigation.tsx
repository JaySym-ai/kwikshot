import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  Layers, 
  Mic2, 
  BarChart3, 
  Monitor
} from 'lucide-react';

export type StreamingTab = 'dashboard' | 'scenes' | 'audio' | 'monitoring' | 'overlays';

interface StreamingTabNavigationProps {
  activeTab: StreamingTab;
  onTabChange: (tab: StreamingTab) => void;
  isMinimized: boolean;
}

export const StreamingTabNavigation: React.FC<StreamingTabNavigationProps> = ({
  activeTab,
  onTabChange,
  isMinimized
}) => {
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: Radio, description: 'Stream controls and status' },
    { id: 'scenes', name: 'Scenes', icon: Layers, description: 'Manage scenes and sources' },
    { id: 'audio', name: 'Audio', icon: Mic2, description: 'Audio mixing and effects' },
    { id: 'monitoring', name: 'Analytics', icon: BarChart3, description: 'Performance monitoring' },
    { id: 'overlays', name: 'Overlays', icon: Monitor, description: 'Stream overlays and graphics' }
  ];

  if (isMinimized) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex space-x-1 mt-6"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id as StreamingTab)}
            className={`relative flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{tab.name}</span>
            
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
};
