import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.dbmusic.viral',
  appName: '더블비뮤직',
  webDir: 'out',
  server: {
    url: 'https://app.doubleb.kr',
    cleartext: true
  },
  ios: {
    contentInset: 'never',
    scheme: 'dbmusic',
  },
  android: {
    backgroundColor: '#ffffff',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false
    },
    Keyboard: {
      resize: KeyboardResize.Native,
      style: KeyboardStyle.Light
    }
  }
};

export default config;