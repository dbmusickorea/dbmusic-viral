import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dbmusic.viral',
  appName: '더블비뮤직',
  webDir: 'out',
  server: {
    url: 'https://dbmusic-viral.vercel.app',
    cleartext: true
  },
  ios: {
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;