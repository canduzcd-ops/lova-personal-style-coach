import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Network } from '@capacitor/network';
import { syncService } from '../services/syncService';

interface NetworkContextValue {
  isOnline: boolean;
  connectionType: string;
  isSyncing: boolean;
  lastSyncTime: number | null;
  triggerSync: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState('wifi');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  useEffect(() => {
    let listenerHandle: any = null;

    const init = async () => {
      // Check initial network status
      const checkNetworkStatus = async () => {
        try {
          const status = await Network.getStatus();
          setIsOnline(status.connected);
          setConnectionType(status.connectionType);
          console.log('[Network] Initial status:', status);
        } catch (error) {
          console.error('[Network] Error checking status:', error);
          // Fallback to browser API
          setIsOnline(navigator.onLine);
        }
      };

      await checkNetworkStatus();

      // Listen to network status changes
      listenerHandle = await Network.addListener('networkStatusChange', (status: any) => {
        console.log('[Network] Status changed:', status);
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);

        // Trigger sync when coming back online
        if (status.connected && !isOnline) {
          console.log('[Network] Back online, triggering sync...');
          triggerSync();
        }
      });

      // Fallback: Browser online/offline events
      const handleOnline = () => {
        console.log('[Network] Browser online event');
        setIsOnline(true);
        triggerSync();
      };

      const handleOffline = () => {
        console.log('[Network] Browser offline event');
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    };

    init();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    };
  }, []);

  const triggerSync = async () => {
    if (!isOnline) {
      console.log('[Network] Cannot sync - offline');
      return;
    }

    if (isSyncing) {
      console.log('[Network] Sync already in progress');
      return;
    }

    setIsSyncing(true);
    console.log('[Network] Starting sync...');

    try {
      const syncedCount = await syncService.syncAll();
      setLastSyncTime(Date.now());
      console.log(`[Network] Sync completed - ${syncedCount} changes synced`);
    } catch (error) {
      console.error('[Network] Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const value: NetworkContextValue = {
    isOnline,
    connectionType,
    isSyncing,
    lastSyncTime,
    triggerSync,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = (): NetworkContextValue => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};
