import React from 'react';
import { motion } from 'framer-motion';
import { Video, Scissors, Radio, Settings, Folder } from 'lucide-react';

interface SidebarProps {
  currentView: 'recorder' | 'editor' | 'streaming' | 'settings';
  onViewChange: (view: 'recorder' | 'editor' | 'streaming' | 'settings') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    {
      id: 'recorder' as const,
      icon: Video,
      label: 'Recorder',
      description: 'Capture screen, webcam & audio'
    },
    {
      id: 'streaming' as const,
      icon: Radio,
      label: 'Live Stream',
      description: 'Stream live to your audience'
    },
    {
      id: 'editor' as const,
      icon: Scissors,
      label: 'Editor',
      description: 'Edit and enhance your videos'
    }
  ];

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`sidebar-item w-full p-3 text-left ${
                  isActive
                    ? 'sidebar-item-active text-white'
                    : 'sidebar-item-inactive'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-600 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="relative flex items-center space-x-3">
                  <Icon size={20} />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-700">
        <div className="space-y-2">
          <button className="w-full p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-150 flex items-center space-x-2">
            <Folder size={16} />
            <span className="text-sm">Projects</span>
          </button>
          <button
            onClick={() => onViewChange('settings')}
            className={`w-full p-2 rounded-lg transition-colors duration-150 flex items-center space-x-2 ${
              currentView === 'settings'
                ? 'text-white bg-blue-600'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Settings size={16} />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
