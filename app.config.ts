import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Flick',
  slug: 'flick',

  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'reelcounter',
  userInterfaceStyle: 'automatic',
  android: {
    package: 'com.reelcounter.flick',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#0E0E10',
    },
    permissions: [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
    ],
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#0E0E10',
      },
    ],
    './plugins/withReelCounter',
  ],


  extra: {
    eas: {
      projectId: '763d024d-e827-4761-8741-bd84cd41abd0',
    },
  },

  experiments: {
    typedRoutes: true,
  },
};


export default config;
