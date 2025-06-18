import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface RecordingCompleteNotificationProps {
  isVisible: boolean;
  onOpenEditor: () => void;
}

export const RecordingCompleteNotification: React.FC<RecordingCompleteNotificationProps> = ({
  isVisible,
  onOpenEditor
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 border-green-500/50 bg-green-900/20"
    >
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle size={24} className="text-green-500" />
        <div>
          <h3 className="text-lg font-semibold text-green-400">Recording Complete!</h3>
          <p className="text-sm text-green-300">Your recording has been saved and is ready for editing.</p>
        </div>
      </div>

      <motion.button
        onClick={onOpenEditor}
        className="btn-primary"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Open in Editor
      </motion.button>
    </motion.div>
  );
};
