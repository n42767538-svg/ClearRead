import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clearread.app',
  appName: 'ClearRead',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
