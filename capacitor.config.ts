import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studycompanion.app',
  appName: 'Study Companion',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    App: {
      backgroundColor: '#0f172a',
    },
  },
};

export default config;
