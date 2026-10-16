import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PixelifySans_400Regular,
  PixelifySans_600SemiBold,
  PixelifySans_700Bold,
} from '@expo-google-fonts/pixelify-sans';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

SplashScreen.preventAutoHideAsync().catch(() => {});

const ONBOARDING_KEY = 'flick_onboarding_completed';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PixelifySans_400Regular,
    PixelifySans_600SemiBold,
    PixelifySans_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      if (!fontsLoaded && !fontError) return;
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
        SplashScreen.hideAsync().catch(() => {});
      }
    }
    checkOnboarding();
  }, [fontsLoaded, fontError]);

  if (!ready || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />

      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#09090B' } }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
