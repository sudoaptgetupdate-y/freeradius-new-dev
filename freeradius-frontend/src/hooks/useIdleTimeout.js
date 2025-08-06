// src/hooks/useIdleTimeout.js
import { useState, useEffect, useRef } from 'react';

export const useIdleTimeout = (onIdle, idleTimeout = 600000) => {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutId = useRef(null);

  const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

  const startTimer = () => {
    timeoutId.current = setTimeout(() => {
      setIsIdle(true);
      onIdle();
    }, idleTimeout);
  };

  const resetTimer = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    startTimer();
  };

  useEffect(() => {
    startTimer();

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [onIdle, idleTimeout]);

  return isIdle;
};