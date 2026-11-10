import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Database } from 'lucide-react';

interface OfflineIndicatorProps {
  unsyncedCount: number;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  unsyncedCount,
  onSyncNow,
  isSyncing,
}) => {
  const { isOnline, isSimulated, toggleSimulateOffline } = useOnlineStatus();

  return (
    <>
      {/* Floating Offline Notification when offline or simulated offline */}
      {!isOnline && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-4 z-50 max-w-md bg-amber-600 text-white rounded-xl shadow-2xl p-3.5 border border-amber-500/80 flex items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-lg bg-amber-700">
              <WifiOff className="w-4 h-4 text-white" />
            </span>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>Offline Mode Active</span>
                {isSimulated && (
                  <span className="text-[10px] bg-amber-800 text-amber-200 px-1.5 py-0.2 rounded font-normal">
                    Simulated
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-100">
                All reports are saved locally. {unsyncedCount > 0 ? `${unsyncedCount} report(s) queued for sync.` : 'Local database active.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isSimulated ? (
              <button
                onClick={() => toggleSimulateOffline(false)}
                className="px-2.5 py-1 bg-white text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-50 shadow-sm"
              >
                Go Online
              </button>
            ) : null}
          </div>
        </aside>
      )}
    </>
  );
};
