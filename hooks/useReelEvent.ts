import { useEffect, useRef } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import type { ReelCountedEvent } from '../types';

export function useReelEvent(onReelCounted: (event: ReelCountedEvent) => void) {
  const callbackRef = useRef(onReelCounted);
  callbackRef.current = onReelCounted;

  useEffect(() => {
    if (!NativeModules.ReelCounter) return;
    const emitter = new NativeEventEmitter(NativeModules.ReelCounter);
    const subscription = emitter.addListener('onReelCounted', (data: ReelCountedEvent) => {
      callbackRef.current(data);
    });
    return () => subscription.remove();
  }, []);
}
