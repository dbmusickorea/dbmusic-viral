import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dbmusic.viral',
  appName: 'DBMUSIC',
  webDir: 'out',
  server: {
    url: 'https://dbmusic-viral.vercel.app',
    cleartext: true
  }
};

export default config;