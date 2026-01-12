// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.racalabs.thelova',
  appName: 'TheLova',
  webDir: 'dist',
  server: {
    // Android WebView'da Firebase Auth'un düzgün çalışması için
    androidScheme: 'https',
    // Firebase Auth redirect URL'lerini izin ver
    allowNavigation: [
      'https://*.firebaseapp.com',
      'https://*.googleapis.com',
      'https://accounts.google.com',
    ],
  },
  android: {
    // WebView ayarları
    allowMixedContent: true,
    // Firebase Auth için deep link
    // Bu, Google Sign-In redirect'inin yakalanmasını sağlar
    webContentsDebuggingEnabled: true,
  },
  
  // ✅ Camera plugin ayarları
  plugins: {
    Camera: {
      // Android 13+ için gerekli izin ayarları
      androidxExifInterface: true,
    },
  },

  // ✅ Google Play Billing (cordova-plugin-purchase) için gerekli
  cordova: {
    preferences: {
      // Play Console -> Para kazanma kurulumu -> Lisanslama -> Base64 RSA public key
      BILLING_KEY: 'BURAYA_PLAY_CONSOLE_RSA_KEY_BASE64',
    },
  },
};

export default config;
