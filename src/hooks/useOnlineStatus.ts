import { useEffect, useState } from 'react';

// Shared state for simulated offline mode to allow interactive testing
let simulatedOffline = false;
const listeners = new Set<(isOnline: boolean) => void>();

export function setSimulatedOffline(offline: boolean) {
  simulatedOffline = offline;
  const isOnline = !simulatedOffline && (typeof navigator !== 'undefined' ? navigator.onLine : true);
  listeners.forEach(fn => fn(isOnline));
}

export function getSimulatedOffline() {
  return simulatedOffline;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (simulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const update = () => {
      if (simulatedOffline) {
        setIsOnline(false);
      } else {
        setIsOnline(navigator.onLine);
      }
    };

    const handleListener = (online: boolean) => {
      setIsOnline(online);
    };

    listeners.add(handleListener);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    return () => {
      listeners.delete(handleListener);
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return {
    isOnline,
    isSimulated: simulatedOffline,
    toggleSimulateOffline: (val?: boolean) => {
      const next = val !== undefined ? val : !simulatedOffline;
      setSimulatedOffline(next);
    }
  };
}
