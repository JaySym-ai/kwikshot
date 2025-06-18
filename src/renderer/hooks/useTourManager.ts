import { useState, useEffect } from 'react';
import { useNotifications } from '../components/common/SmartNotifications';

export type TourType = 'streaming' | 'recording';
export type AppView = 'recorder' | 'editor' | 'streaming' | 'settings';

export const useTourManager = () => {
  const [showTour, setShowTour] = useState(false);
  const [tourType, setTourType] = useState<TourType>('streaming');
  const notifications = useNotifications();

  useEffect(() => {
    // Check if user is new and should see the tour
    const hasSeenTour = localStorage.getItem('has-seen-tour');
    if (!hasSeenTour) {
      // Show tour after a brief delay
      setTimeout(() => {
        setShowTour(true);
        setTourType('recording'); // Start with recording tour since that's the default view
      }, 1000);
    }

    // Add tour data attributes to elements
    const addTourAttributes = () => {
      // Add data attributes for tour targeting
      const header = document.querySelector('.title-bar');
      if (header) header.setAttribute('data-tour', 'header');

      // Add more tour attributes as needed
    };

    addTourAttributes();
  }, []);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('has-seen-tour', 'true');
    notifications.success(
      'Welcome to KwikShot!',
      'You\'re all set to start recording and streaming. Explore the features and create amazing content!'
    );
  };

  const handleViewChange = (view: AppView) => {
    // Show appropriate tour when switching to streaming for the first time
    if (view === 'streaming' && !localStorage.getItem('has-seen-streaming-tour')) {
      setTimeout(() => {
        setTourType('streaming');
        setShowTour(true);
        localStorage.setItem('has-seen-streaming-tour', 'true');
      }, 500);
    }
  };

  return {
    showTour,
    tourType,
    handleTourComplete,
    handleViewChange,
    notifications
  };
};
