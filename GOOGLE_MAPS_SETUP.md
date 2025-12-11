# Google Maps Setup Guide

## Overview
After migrating to React Native Maps, you need to configure Google Maps API for Android. iOS uses Apple Maps by default and requires no additional setup.

## Android Setup (Required)

### 1. Get Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Maps SDK**
   - Go to "APIs & Services" → "Library"
   - Search for "Maps SDK for Android"
   - Click "Enable"

3. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

4. **Restrict API Key (Recommended)**
   - Click on your API key to edit
   - Under "Application restrictions", select "Android apps"
   - Add your package name: `com.pokeapp` (or your actual package name)
   - Add your SHA-1 certificate fingerprint

### 2. Configure Android App

Add the API key to your Android manifest:

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application>
  <!-- Add this inside the application tag -->
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY_HERE"/>
  
  <!-- Rest of your application config -->
</application>
```

### 3. Get SHA-1 Certificate Fingerprint

For development (debug keystore):
```bash
# On Windows
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android

# On macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the SHA-1 fingerprint and add it to your API key restrictions.

## iOS Setup (No Action Required)

iOS uses Apple Maps by default and doesn't require additional configuration. Just ensure location permissions are properly configured in your Info.plist:

```xml
<!-- ios/MyReactNativeApp/Info.plist -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to show Pokemon nearby.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs location access to show Pokemon nearby.</string>
```

## Testing

### Android
1. Build and run the app: `npm run android`
2. Navigate to Hunt screen
3. Grant location permissions
4. Verify map loads with Google Maps styling
5. Check that Pokemon markers appear

### iOS
1. Build and run the app: `npm run ios`
2. Navigate to Hunt screen
3. Grant location permissions
4. Verify map loads with Apple Maps styling
5. Check that Pokemon markers appear

## Troubleshooting

### Android Issues

**Map shows blank/gray screen:**
- Check API key is correctly added to AndroidManifest.xml
- Verify API key has Maps SDK for Android enabled
- Ensure SHA-1 fingerprint is added to API key restrictions

**"Authorization failure" error:**
- Double-check API key value
- Verify package name matches in API restrictions
- Ensure SHA-1 fingerprint is correct

**Map loads but no styling:**
- Custom map styles only work with Google Maps
- Verify `PROVIDER_GOOGLE` is being used on Android

### iOS Issues

**Map not loading:**
- Check location permissions in Info.plist
- Verify device has location services enabled

**Poor performance:**
- Apple Maps is optimized for iOS devices
- Ensure sufficient device memory

## Cost Considerations

### Google Maps Pricing
- **Free tier**: 28,000 map loads per month
- **After free tier**: $7 per 1,000 additional loads
- **For most apps**: Free tier is sufficient during development

### Apple Maps
- **Completely free** on iOS devices
- No API keys or usage limits

## Security Best Practices

1. **Restrict API Keys**: Always add package name and SHA-1 restrictions
2. **Environment Variables**: Store API keys in environment variables for production
3. **Separate Keys**: Use different API keys for development and production
4. **Monitor Usage**: Set up billing alerts in Google Cloud Console

## Production Deployment

For production apps:

1. **Generate release keystore**
2. **Get release SHA-1 fingerprint**
3. **Add release fingerprint to API key**
4. **Test with release build**
5. **Monitor API usage**

## Alternative: MapLibre (Optional)

If you prefer to avoid Google Maps dependency, you can use MapLibre with React Native Maps:

```typescript
// Alternative free map provider
import { PROVIDER_DEFAULT } from 'react-native-maps';

// Use default provider (MapLibre on Android)
provider={PROVIDER_DEFAULT}
```

This provides basic mapping without requiring API keys, but with limited styling options.