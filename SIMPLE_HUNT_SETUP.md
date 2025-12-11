# Simple Hunt Mode Setup

## Overview
A clean, straightforward Pokemon Hunt implementation with:
- **Real GPS location tracking**
- **Native maps (Google Maps/Apple Maps)**
- **Simple Pokemon spawning system**
- **Distance-based catch mechanics**
- **Clean, responsive UI**

## Features

### ✅ Core Functionality
- **GPS Location**: Uses `react-native-geolocation-service` for accurate positioning
- **Native Maps**: Google Maps (Android) / Apple Maps (iOS) integration
- **Pokemon Spawning**: Random Pokemon spawn within 500m of user location
- **Catch Mechanics**: Distance-based catch probability (closer = higher chance)
- **Real-time Tracking**: Live location updates during hunt mode

### ✅ User Experience
- **Simple Controls**: Start/Stop hunt with single button
- **Visual Feedback**: Pokemon markers on map with sprites and names
- **Status Display**: Shows number of nearby Pokemon
- **Location Centering**: Button to center map on user location
- **Permission Handling**: Proper location permission requests

## Setup Instructions

### 1. Android Configuration

#### Add Location Permission
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

#### Google Maps API Key (Required for Android)
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
</application>
```

### 2. iOS Configuration

#### Add Location Permission
```xml
<!-- ios/MyReactNativeApp/Info.plist -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to show Pokemon nearby.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs location access to show Pokemon nearby.</string>
```

### 3. Build and Test

```bash
# Clean install
npm install

# iOS (if needed)
cd ios && pod install && cd ..

# Run on Android
npm run android

# Run on iOS  
npm run ios
```

## How It Works

### 1. Location Acquisition
- App requests location permission on Hunt screen load
- Gets current GPS coordinates with high accuracy
- Sets up map region centered on user location

### 2. Hunt Mode
- **Start Hunt**: Begins location tracking and Pokemon spawning
- **Pokemon Spawning**: Random Pokemon appear every 15 seconds within 500m
- **Location Updates**: Tracks user movement every 10 meters
- **Stop Hunt**: Clears all Pokemon and stops tracking

### 3. Pokemon Interaction
- **Tap Pokemon**: Shows alert with distance and options
- **View Details**: Navigate to Pokemon detail screen
- **Catch Attempt**: Distance-based success probability
- **Success**: Pokemon removed from map
- **Failure**: Pokemon remains, can try again

### 4. Catch Mechanics
- **Distance Check**: Must be within 50m to attempt catch
- **Success Rate**: Closer distance = higher catch probability
- **Feedback**: Clear success/failure messages

## Pokemon Pool
Currently includes 8 popular Pokemon:
- Bulbasaur, Charmander, Squirtle (starters)
- Pikachu (mascot)
- Meowth, Psyduck, Cubone, Magikarp (classics)

## Performance Features
- **Efficient Spawning**: Limited to reasonable number of Pokemon
- **Memory Management**: Automatic cleanup when stopping hunt
- **Battery Optimization**: Smart location update intervals
- **Smooth UI**: Responsive map interactions

## Troubleshooting

### Location Issues
- **Permission Denied**: Check app settings for location access
- **No GPS**: Move to area with better GPS signal
- **Inaccurate Location**: Ensure high-accuracy location is enabled

### Map Issues
- **Blank Map (Android)**: Verify Google Maps API key is configured
- **No Pokemon**: Ensure hunt mode is started and location is available
- **Performance**: Close other apps if map is slow

### Build Issues
- **Android**: Ensure Google Play Services are installed
- **iOS**: Check location permissions in Info.plist
- **General**: Clean build if having issues (`npm run android --reset-cache`)

## Testing Checklist
- [ ] Location permission granted
- [ ] Map loads and shows user location
- [ ] Hunt mode starts successfully
- [ ] Pokemon spawn on map
- [ ] Pokemon markers are interactive
- [ ] Catch mechanics work properly
- [ ] Location updates during movement
- [ ] Stop hunt clears Pokemon
- [ ] Performance is smooth

## Future Enhancements
- Add more Pokemon to spawn pool
- Implement biome-based spawning
- Add rarity system
- Include sound effects
- Add Pokemon collection tracking
- Implement push notifications

This simple implementation provides a solid foundation for Pokemon hunting with clean code and reliable functionality.