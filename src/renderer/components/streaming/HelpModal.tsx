import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-800 rounded-xl p-6 w-96 max-h-96 overflow-y-auto"
          >
            <h3 className="text-white font-semibold mb-4">Quick Help</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div>
                <h4 className="font-medium text-white">Getting Started</h4>
                <p>Use the setup wizard to configure your streaming platform and settings.</p>
              </div>
              <div>
                <h4 className="font-medium text-white">Dashboard</h4>
                <p>Control your stream, view status, and monitor performance.</p>
              </div>
              <div>
                <h4 className="font-medium text-white">Scenes</h4>
                <p>Create and manage different scenes with various sources.</p>
              </div>
              <div>
                <h4 className="font-medium text-white">Audio</h4>
                <p>Mix audio sources and apply professional effects.</p>
              </div>
              <div>
                <h4 className="font-medium text-white">Analytics</h4>
                <p>Monitor stream performance and network quality.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            >
              Got it!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
