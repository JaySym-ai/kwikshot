import React from 'react';
import { Video, Plus, FolderOpen } from 'lucide-react';

interface EditorEmptyStateProps {
  onNewProject: () => void;
  onOpenProject: () => void;
}

export const EditorEmptyState: React.FC<EditorEmptyStateProps> = ({
  onNewProject,
  onOpenProject
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
      <div className="text-center">
        <Video size={64} className="text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Welcome to KwikShot Editor</h3>
        <p className="text-gray-400 mb-6 max-w-md">
          Create a new project or open an existing one to start editing your videos
        </p>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={onNewProject}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Project</span>
          </button>
          <button
            onClick={onOpenProject}
            className="btn-secondary flex items-center space-x-2"
          >
            <FolderOpen size={20} />
            <span>Open Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};
