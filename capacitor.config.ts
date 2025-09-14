import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f718139e09214562b04f6519c248b00c',
  appName: 'agenda-medica-app',
  webDir: 'dist',
  server: {
    url: 'https://f718139e-0921-4562-b04f-6519c248b00c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;