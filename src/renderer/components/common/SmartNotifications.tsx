import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  X, 
  Zap,
  Wifi,
  Activity,
  Users,
  Settings
} from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'stream' | 'performance';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  data?: any;
}

interface SmartNotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const SmartNotifications: React.FC<SmartNotificationsProps> = ({
  notifications,
  onDismiss,
  position = 'top-right'
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setVisibleNotifications(notifications);

    // Auto-dismiss non-persistent notifications
    notifications.forEach(notification => {
      if (!notification.persistent && notification.duration !== 0) {
        const duration = notification.duration || 5000;
        setTimeout(() => {
          onDismiss(notification.id);
        }, duration);
      }
    });
  }, [notifications, onDismiss]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'stream':
        return <Activity className="w-5 h-5 text-blue-500" />;
      case 'performance':
        return <Zap className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/20 border-green-500/30';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/30';
      case 'error':
        return 'bg-red-900/20 border-red-500/30';
      case 'stream':
        return 'bg-blue-900/20 border-blue-500/30';
      case 'performance':
        return 'bg-purple-900/20 border-purple-500/30';
      default:
        return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-3 max-w-sm w-full`}>
      <AnimatePresence>
        {visibleNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: position.includes('right') ? 300 : -300, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              delay: index * 0.1 
            }}
            className={`relative overflow-hidden rounded-xl border backdrop-blur-sm ${getBackgroundColor(notification.type)}`}
          >
            {/* Progress bar for timed notifications */}
            {!notification.persistent && notification.duration !== 0 && (
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: (notification.duration || 5000) / 1000, ease: 'linear' }}
                className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
              />
            )}

            <div className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {notification.message}
                  </p>
                  
                  {/* Action button */}
                  {notification.action && (
                    <button
                      onClick={notification.action.onClick}
                      className="mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      {notification.action.label}
                    </button>
                  )}

                  {/* Additional data display */}
                  {notification.data && (
                    <div className="mt-3 p-2 bg-gray-800/50 rounded-lg">
                      {notification.type === 'stream' && notification.data.viewers !== undefined && (
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Users className="w-3 h-3" />
                          <span>{notification.data.viewers} viewers</span>
                        </div>
                      )}
                      
                      {notification.type === 'performance' && notification.data.cpu !== undefined && (
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Activity className="w-3 h-3" />
                          <span>CPU: {notification.data.cpu}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Notification manager hook
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const success = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration: 3000,
      ...options
    });
  };

  const error = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 7000,
      ...options
    });
  };

  const warning = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 5000,
      ...options
    });
  };

  const info = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration: 4000,
      ...options
    });
  };

  const stream = (title: string, message: string, data?: any, options?: Partial<Notification>) => {
    return addNotification({
      type: 'stream',
      title,
      message,
      data,
      duration: 4000,
      ...options
    });
  };

  const performance = (title: string, message: string, data?: any, options?: Partial<Notification>) => {
    return addNotification({
      type: 'performance',
      title,
      message,
      data,
      duration: 6000,
      ...options
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
    stream,
    performance
  };
};

// Smart notification templates
export const createStreamNotifications = (notificationManager: ReturnType<typeof useNotifications>) => {
  return {
    streamStarted: (platform: string, viewers: number = 0) => {
      notificationManager.stream(
        'Stream Started!',
        `Now live on ${platform}`,
        { viewers },
        { persistent: true }
      );
    },

    streamEnded: (duration: string) => {
      notificationManager.success(
        'Stream Ended',
        `Stream duration: ${duration}`,
        { duration: 5000 }
      );
    },

    viewerMilestone: (count: number) => {
      notificationManager.stream(
        'Viewer Milestone!',
        `You now have ${count} viewers watching`,
        { viewers: count },
        { duration: 6000 }
      );
    },

    connectionIssue: (issue: string) => {
      notificationManager.warning(
        'Connection Issue',
        issue,
        { 
          persistent: true,
          action: {
            label: 'Check Settings',
            onClick: () => console.log('Open network settings')
          }
        }
      );
    },

    performanceWarning: (metric: string, value: number) => {
      notificationManager.performance(
        'Performance Warning',
        `High ${metric} usage detected`,
        { [metric.toLowerCase()]: value },
        {
          action: {
            label: 'Optimize',
            onClick: () => console.log('Open performance settings')
          }
        }
      );
    },

    recordingSaved: (filename: string, size: string) => {
      notificationManager.success(
        'Recording Saved',
        `${filename} (${size})`,
        {
          action: {
            label: 'Open Folder',
            onClick: () => console.log('Open recordings folder')
          }
        }
      );
    },

    authenticationSuccess: (platform: string) => {
      notificationManager.success(
        'Authentication Successful',
        `Connected to ${platform}`,
        { duration: 3000 }
      );
    },

    authenticationError: (platform: string, error: string) => {
      notificationManager.error(
        'Authentication Failed',
        `Failed to connect to ${platform}: ${error}`,
        {
          action: {
            label: 'Retry',
            onClick: () => console.log('Retry authentication')
          }
        }
      );
    },

    hardwareOptimized: (encoder: string) => {
      notificationManager.success(
        'Hardware Optimized',
        `Using ${encoder} hardware encoding for better performance`,
        { duration: 4000 }
      );
    },

    sceneChanged: (sceneName: string) => {
      notificationManager.info(
        'Scene Changed',
        `Switched to "${sceneName}"`,
        { duration: 2000 }
      );
    },

    filterApplied: (filterName: string, sourceName: string) => {
      notificationManager.info(
        'Filter Applied',
        `Added ${filterName} to ${sourceName}`,
        { duration: 3000 }
      );
    }
  };
};
