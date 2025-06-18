import React from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  RotateCcw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { SaveStatus } from '../../hooks/useSettingsManager';

interface SettingsHeaderProps {
  hasUnsavedChanges: boolean;
  saveStatus: SaveStatus;
  onSave: () => void;
  onReset: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  hasUnsavedChanges,
  saveStatus,
  onSave,
  onReset
}) => {
  const getSaveButtonIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return <Save size={16} />;
    }
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'success':
        return 'Saved!';
      case 'error':
        return 'Error';
      default:
        return hasUnsavedChanges ? 'Save Now' : 'All Saved';
    }
  };

  return (
    <div className="p-6 border-b border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SettingsIcon size={24} className="text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">Configure KwikShot preferences</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onReset}
            className="btn-secondary flex items-center space-x-2"
            disabled={saveStatus === 'saving'}
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
          
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges || saveStatus === 'saving'}
            className={`btn-primary flex items-center space-x-2 ${
              !hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : ''
            } ${
              saveStatus === 'error' ? 'bg-red-600 hover:bg-red-700' : ''
            }`}
          >
            {getSaveButtonIcon()}
            <span>{getSaveButtonText()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
