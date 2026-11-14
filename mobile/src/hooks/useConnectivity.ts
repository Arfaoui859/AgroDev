import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Live connectivity state. `isOnline` is optimistic on first render (true) so
 * screens fetch immediately; NetInfo corrects it as soon as it reports.
 */
export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let mounted = true;
    NetInfo.fetch().then((state) => {
      if (mounted) setIsOnline(state.isConnected !== false);
    });
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected !== false);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { isOnline };
}
