import React from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';

interface GoLiveButtonProps {
  isVisible: boolean;
  onGoLive: () => void;
}

export const GoLiveButton: React.FC<GoLiveButtonProps> = ({
  isVisible,
  onGoLive
}) => {
  if (!isVisible) return null;

  return (
    <div className="flex justify-center">
      <motion.button
        onClick={onGoLive}
        className="btn-secondary bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 flex items-center space-x-2 px-6 py-3"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Radio size={20} />
        <span>Go Live</span>
      </motion.button>
    </div>
  );
};
