/**
 * Offline Storage Manager for MedicoAgenda
 * Handles local data persistence and synchronization
 */

interface StorageItem<T> {
  data: T;
  timestamp: number;
  synced: boolean;
}

interface PendingAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: string;
  data: any;
  timestamp: number;
}

interface StorageStats {
  sizeBytes: number;
  itemCount: number;
  pendingActions: number;
  lastSync: Date | null;
}

class OfflineStorage {
  private readonly storageKey = 'medicoagenda_offline_data';
  private readonly pendingActionsKey = 'medicoagenda_pending_actions';
  private readonly maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  constructor() {
    // Clean old data on initialization
    this.cleanOldData();
  }

  /**
   * Save data to localStorage with metadata
   */
  saveData<T>(key: string, data: T): boolean {
    try {
      const storage = this.getStorage();
      storage[key] = {
        data,
        timestamp: Date.now(),
        synced: navigator.onLine
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
      return true;
    } catch (error) {
      console.error('Error saving offline data:', error);
      return false;
    }
  }

  /**
   * Retrieve data from localStorage
   */
  getData<T>(key: string): T | null {
    try {
      const storage = this.getStorage();
      const item = storage[key];
      
      if (!item) return null;
      
      // Check if data is expired
      if (Date.now() - item.timestamp > this.maxAge) {
        this.removeData(key);
        return null;
      }
      
      return item.data as T;
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return null;
    }
  }

  /**
   * Remove specific data from localStorage
   */
  removeData(key: string): boolean {
    try {
      const storage = this.getStorage();
      delete storage[key];
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
      return true;
    } catch (error) {
      console.error('Error removing offline data:', error);
      return false;
    }
  }

  /**
   * Add pending action for later synchronization
   */
  addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>): string {
    try {
      const actions = this.getPendingActions();
      const newAction: PendingAction = {
        ...action,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      
      actions.push(newAction);
      localStorage.setItem(this.pendingActionsKey, JSON.stringify(actions));
      
      return newAction.id;
    } catch (error) {
      console.error('Error adding pending action:', error);
      throw error;
    }
  }

  /**
   * Get all pending actions
   */
  getPendingActions(): PendingAction[] {
    try {
      const actions = localStorage.getItem(this.pendingActionsKey);
      return actions ? JSON.parse(actions) : [];
    } catch (error) {
      console.error('Error retrieving pending actions:', error);
      return [];
    }
  }

  /**
   * Remove pending action after successful synchronization
   */
  removePendingAction(actionId: string): boolean {
    try {
      const actions = this.getPendingActions();
      const filteredActions = actions.filter(action => action.id !== actionId);
      localStorage.setItem(this.pendingActionsKey, JSON.stringify(filteredActions));
      return true;
    } catch (error) {
      console.error('Error removing pending action:', error);
      return false;
    }
  }

  /**
   * Clear all pending actions
   */
  clearPendingActions(): boolean {
    try {
      localStorage.removeItem(this.pendingActionsKey);
      return true;
    } catch (error) {
      console.error('Error clearing pending actions:', error);
      return false;
    }
  }

  /**
   * Clean old data based on timestamp
   */
  cleanOldData(maxAge: number = this.maxAge): number {
    try {
      const storage = this.getStorage();
      const now = Date.now();
      let removedCount = 0;
      
      Object.keys(storage).forEach(key => {
        if (now - storage[key].timestamp > maxAge) {
          delete storage[key];
          removedCount++;
        }
      });
      
      if (removedCount > 0) {
        localStorage.setItem(this.storageKey, JSON.stringify(storage));
      }
      
      return removedCount;
    } catch (error) {
      console.error('Error cleaning old data:', error);
      return 0;
    }
  }

  /**
   * Clear all offline data
   */
  clearAllData(): boolean {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.pendingActionsKey);
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  /**
   * Export all offline data as backup
   */
  exportBackup(): string {
    try {
      const storage = this.getStorage();
      const pendingActions = this.getPendingActions();
      
      const backup = {
        data: storage,
        pendingActions,
        exportDate: new Date().toISOString(),
        version: '1.0',
        userAgent: navigator.userAgent
      };
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medicoagenda_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return backup.exportDate;
    } catch (error) {
      console.error('Error exporting backup:', error);
      throw error;
    }
  }

  /**
   * Import backup data
   */
  async importBackup(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      // Validate backup format
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup format');
      }
      
      // Import data
      if (backup.data) {
        localStorage.setItem(this.storageKey, JSON.stringify(backup.data));
      }
      
      // Import pending actions
      if (backup.pendingActions) {
        localStorage.setItem(this.pendingActionsKey, JSON.stringify(backup.pendingActions));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing backup:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): StorageStats {
    try {
      const storage = this.getStorage();
      const pendingActions = this.getPendingActions();
      
      // Calculate storage size
      const storageString = localStorage.getItem(this.storageKey) || '{}';
      const pendingActionsString = localStorage.getItem(this.pendingActionsKey) || '[]';
      const totalSize = new Blob([storageString + pendingActionsString]).size;
      
      // Find last sync time
      let lastSyncTimestamp = 0;
      Object.values(storage).forEach((item: StorageItem<any>) => {
        if (item.synced && item.timestamp > lastSyncTimestamp) {
          lastSyncTimestamp = item.timestamp;
        }
      });
      
      return {
        sizeBytes: totalSize,
        itemCount: Object.keys(storage).length,
        pendingActions: pendingActions.length,
        lastSync: lastSyncTimestamp > 0 ? new Date(lastSyncTimestamp) : null
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        sizeBytes: 0,
        itemCount: 0,
        pendingActions: 0,
        lastSync: null
      };
    }
  }

  /**
   * Check if device has enough storage space
   */
  async checkStorageQuota(): Promise<{ available: number; used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0)
        };
      } catch (error) {
        console.error('Error checking storage quota:', error);
      }
    }
    
    // Fallback estimation
    return {
      used: this.getStorageStats().sizeBytes,
      quota: 5 * 1024 * 1024, // Assume 5MB quota
      available: 5 * 1024 * 1024 - this.getStorageStats().sizeBytes
    };
  }

  /**
   * Mark data as synced
   */
  markAsSynced(key: string): boolean {
    try {
      const storage = this.getStorage();
      if (storage[key]) {
        storage[key].synced = true;
        storage[key].timestamp = Date.now();
        localStorage.setItem(this.storageKey, JSON.stringify(storage));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking data as synced:', error);
      return false;
    }
  }

  /**
   * Get all keys in storage
   */
  getAllKeys(): string[] {
    try {
      const storage = this.getStorage();
      return Object.keys(storage);
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Check if data exists and is fresh
   */
  hasValidData(key: string, maxAge: number = this.maxAge): boolean {
    try {
      const storage = this.getStorage();
      const item = storage[key];
      
      if (!item) return false;
      
      return (Date.now() - item.timestamp) <= maxAge;
    } catch (error) {
      console.error('Error checking data validity:', error);
      return false;
    }
  }

  /**
   * Private method to get storage object
   */
  private getStorage(): Record<string, StorageItem<any>> {
    try {
      const storage = localStorage.getItem(this.storageKey);
      return storage ? JSON.parse(storage) : {};
    } catch (error) {
      console.error('Error accessing storage:', error);
      return {};
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Export types
export type {
  StorageItem,
  PendingAction,
  StorageStats
};

// Export utility functions
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isOnline = (): boolean => navigator.onLine;

export const onConnectionChange = (callback: (online: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};