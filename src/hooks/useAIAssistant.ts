import { useState, useCallback } from 'react';

export const useAIAssistant = () => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const showAssistant = useCallback(() => {
    setIsVisible(true);
    setIsMinimized(false);
  }, []);

  const hideAssistant = useCallback(() => {
    setIsVisible(false);
    setIsMinimized(true);
  }, []);

  const toggleMinimized = useCallback((minimized: boolean) => {
    setIsMinimized(minimized);
  }, []);

  return {
    isMinimized,
    isVisible,
    showAssistant,
    hideAssistant,
    toggleMinimized,
  };
};