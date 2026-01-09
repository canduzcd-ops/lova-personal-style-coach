const config = {
    appId: 'com.racalabs.thelova',
    appName: 'TheLova',
    webDir: 'dist',
    server: {
        // Android WebView'da Firebase Auth'un düzgün çalışması için
        androidScheme: 'https',
    },
    android: {
        // WebView ayarları
        allowMixedContent: true,
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
