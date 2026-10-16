import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { DailySummary, SessionStats, ReelCountedEvent } from '../../../types';

const LINKING_ERROR =
  `The package 'reelcounter-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ android: "• You rebuilt the app after installing the package\n", default: '' }) +
  '• You are not using Expo Go\n';

// The native module exposed through NativeModules
const ReelCounterNative = NativeModules.ReelCounter
  ? NativeModules.ReelCounter
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const eventEmitter = NativeModules.ReelCounter
  ? new NativeEventEmitter(NativeModules.ReelCounter)
  : null;

export interface ReelCounterModuleType {
  // Permissions
  isAccessibilityEnabled(): Promise<boolean>;
  isOverlayEnabled(): Promise<boolean>;
  openAccessibilitySettings(): void;
  openOverlaySettings(): void;

  // Statistics
  getTodayCount(): Promise<number>;
  getYesterdayCount(): Promise<number>;
  getLast7DaysTotal(): Promise<number>;
  getAllTimeTotal(): Promise<number>;
  getDailySummary(limit: number): Promise<DailySummary[]>;
  getSessionStats(): Promise<SessionStats>;

  // Preferences
  getOverlayPreference(): Promise<boolean>;
  setOverlayPreference(enabled: boolean): Promise<void>;

  // Data management
  clearAllData(): Promise<void>;
}

const ReelCounter: ReelCounterModuleType = ReelCounterNative;

// Event subscription helpers
export function addReelCountedListener(
  listener: (data: ReelCountedEvent) => void
) {
  if (!eventEmitter) return { remove: () => {} };
  const subscription = eventEmitter.addListener('onReelCounted', listener);
  return subscription;
}

export { DailySummary, SessionStats, ReelCountedEvent };
export default ReelCounter;
