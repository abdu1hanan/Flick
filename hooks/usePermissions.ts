import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import ReelCounter from '../modules/reelcounter-native/src';
import type { PermissionStatus } from '../types';

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    accessibility: false,
    overlay: false,
  });
  const [loading, setLoading] = useState(true);

  const checkPermissions = useCallback(async () => {
    try {
      const [accessibility, overlay] = await Promise.all([
        ReelCounter.isAccessibilityEnabled(),
        ReelCounter.isOverlayEnabled(),
      ]);
      setPermissions({ accessibility, overlay });
    } catch {
      // Fallback to false if native module not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPermissions();
    });
    return () => subscription.remove();
  }, [checkPermissions]);

  return { permissions, loading, recheck: checkPermissions };
}
