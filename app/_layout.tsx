import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'flick_onboarding_completed';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const done = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!done) {
          router.replace('/(onboarding)/welcome');
        } else {
          router.replace('/(app)');
        }
      } catch {
        router.replace('/(app)');
      } finally {
        setReady(true);
      }
    }
    checkOnboarding();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <>
      <StatusBar style="auto" />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
