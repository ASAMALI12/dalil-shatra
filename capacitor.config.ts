import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daliliraq.app',
  appName: 'دليل العراق',
  webDir: 'dist',
  server: {
    url: 'https://asamali12.github.io/dalil-shatra/',
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff',
  },
};

export default config;
