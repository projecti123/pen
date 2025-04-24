module.exports = {
  expo: {
    name: 'PenTalk',
    slug: 'pentalk',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'pentalk',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.pentalk.app',
      buildNumber: '1',
      infoPlist: {
        NSPhotoLibraryUsageDescription: 'Allow PenTalk to access your photos to upload profile pictures and share images.',
        NSCameraUsageDescription: 'Allow PenTalk to access your camera to take photos for your profile.',
        NSUserTrackingUsageDescription: 'This identifier will be used to deliver personalized ads to you.'
      },
      config: {
        usesNonExemptEncryption: false
      },
      associatedDomains: [],
      entitlements: {
        'com.apple.developer.applesignin': ['Default'],
        'com.apple.developer.in-app-payments': ['merchant.com.pentalk.app']
      }
    },
    android: {
      package: 'com.pentalk.app',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'ACCESS_MEDIA_LOCATION'
      ],
      config: {
        googleMobileAdsAppId: 'ca-app-pub-3940256099942544~3347511713'
      }
    },
    plugins: [
      'expo-router',
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow PenTalk to access your photos.',
          cameraPermission: 'Allow PenTalk to access your camera.'
        }
      ],
      [
        'react-native-google-mobile-ads',
        {
          android: 'ca-app-pub-3940256099942544~3347511713',
          ios: 'ca-app-pub-3940256099942544~1458002511',
          config: {
            androidAppId: 'ca-app-pub-3940256099942544~3347511713',
            iosAppId: 'ca-app-pub-3940256099942544~1458002511',
            delayAppMeasurementInit: true
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "1196a581-c84c-4b7d-b906-a3a489c7ad22"
      }
    }
  }
};
