import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';

import { MainStackParamList } from '../navigation/types';
import { capitalize } from '../utils/pokemon';
import { useAuth } from '../../AuthContext';
import { PokemonService } from '../services/pokemonService';

type Props = NativeStackScreenProps<MainStackParamList, 'Hunt'>;

type Location = {
  latitude: number;
  longitude: number;
};

type Pokemon = {
  id: string;
  name: string;
  pokemonId: number;
  location: Location;
  sprite: string;
  spawnTime: number;
};

const POKEMON_LIST = [
  { id: 1, name: 'bulbasaur' },
  { id: 4, name: 'charmander' },
  { id: 7, name: 'squirtle' },
  { id: 25, name: 'pikachu' },
  { id: 52, name: 'meowth' },
  { id: 54, name: 'psyduck' },
  { id: 104, name: 'cubone' },
  { id: 129, name: 'magikarp' },
];

// Mock location for testing (San Francisco)
const MOCK_LOCATION: Location = {
  latitude: 37.7749,
  longitude: -122.4194,
};

export const HuntScreen = ({ navigation }: Props) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [isHunting, setIsHunting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const mapRef = useRef<MapView>(null);
  const spawnInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const { user } = useAuth();

  // Request location permissions
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (hasPermission) {
          setHasLocationPermission(true);
          return true;
        }

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission Required',
            message: 'Pokemon Hunt needs access to your location to spawn Pokemon nearby.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          },
        );
        
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasLocationPermission(isGranted);
        return isGranted;
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    
    setHasLocationPermission(true);
    return true;
  };

  // Simple mock location service to avoid Google Play Services issues
  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Requesting location permission...');
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        setError('Location permission is required to hunt Pokemon. Please enable location access in your device settings.');
        setLoading(false);
        return;
      }

      // Simulate getting location (using mock location to avoid Google Play Services)
      console.log('Using mock location to avoid Google Play Services conflicts...');
      
      // Add some randomness to the mock location
      const randomOffset = 0.01;
      const currentLocation = {
        latitude: MOCK_LOCATION.latitude + (Math.random() - 0.5) * randomOffset,
        longitude: MOCK_LOCATION.longitude + (Math.random() - 0.5) * randomOffset,
      };
      
      setLocation(currentLocation);
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLoading(false);
      setError(null);
      console.log('Mock location set successfully:', currentLocation);
    } catch (err) {
      console.error('Location setup error:', err);
      setError('Failed to initialize location services. Please restart the app.');
      setLoading(false);
    }
  }, []);

  // Generate random location near user (5-20 meters)
  const generateNearbyLocation = (userLocation: Location): Location => {
    // Convert meters to degrees (approximate)
    // 1 degree ≈ 111,000 meters at equator
    const minDistance = 5; // 5 meters
    const maxDistance = 20; // 20 meters
    
    // Random distance between 5-20 meters
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    const distanceInDegrees = distance / 111000;
    
    // Random angle
    const angle = Math.random() * 2 * Math.PI;
    
    // Calculate new position
    const deltaLat = distanceInDegrees * Math.cos(angle);
    const deltaLng = distanceInDegrees * Math.sin(angle) / Math.cos(userLocation.latitude * Math.PI / 180);
    
    return {
      latitude: userLocation.latitude + deltaLat,
      longitude: userLocation.longitude + deltaLng,
    };
  };

  // Spawn a random Pokemon
  const spawnPokemon = useCallback(() => {
    if (!location) return;

    const randomPokemon = POKEMON_LIST[Math.floor(Math.random() * POKEMON_LIST.length)];
    const spawnLocation = generateNearbyLocation(location);
    
    const newPokemon: Pokemon = {
      id: `${randomPokemon.id}-${Date.now()}-${Math.random()}`,
      name: randomPokemon.name,
      pokemonId: randomPokemon.id,
      location: spawnLocation,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomPokemon.id}.png`,
      spawnTime: Date.now(),
    };

    setPokemon(prev => [...prev, newPokemon]);
    console.log(`Spawned ${randomPokemon.name} at`, spawnLocation);
  }, [location]);

  // Calculate distance between two points
  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Handle Pokemon tap
  const handlePokemonTap = useCallback((pokemon: Pokemon) => {
    if (!location) return;

    const distance = Math.round(calculateDistance(location, pokemon.location));
    
    // Check if Pokemon is within interaction range (10-15 meters)
    if (distance > 15) {
      Alert.alert(
        `Wild ${capitalize(pokemon.name)}!`,
        `You need to get closer! Distance: ${distance}m away\n(Get within 15m to interact)`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Pokemon is interactable - show AR camera option
    Alert.alert(
      `Wild ${capitalize(pokemon.name)}!`,
      `Distance: ${distance}m away - Ready to catch!`,
      [
        {
          text: 'View Details',
          onPress: () => {
            navigation.navigate('PokemonDetail', {
              pokemonId: pokemon.pokemonId,
              name: pokemon.name,
            });
          },
        },
        {
          text: 'Enter AR Mode',
          onPress: () => {
            // Remove the Pokemon from map and enter AR mode
            setPokemon(prev => prev.filter(p => p.id !== pokemon.id));
            // Navigate to AR Camera tab
            navigation.getParent()?.navigate('ARCameraTab');
          },
        },
        {
          text: 'Quick Catch',
          onPress: () => handleCatchAttempt(pokemon, distance),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [location, navigation]);

  // Handle catch attempt (quick catch without AR)
  const handleCatchAttempt = useCallback(async (pokemon: Pokemon, distance: number) => {
    if (distance > 15) {
      Alert.alert('Too far away!', 'Get within 15m to catch this Pokemon.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to catch Pokemon.');
      return;
    }

    // Better catch probability based on distance
    const catchChance = Math.max(0.4, 1 - (distance / 20));
    const success = Math.random() < catchChance;

    if (success) {
      try {
        // Save to Firebase
        await PokemonService.capturePokemon(user.uid, {
          pokemonId: pokemon.pokemonId,
          pokemonName: pokemon.name,
          location: location || undefined,
          captureMethod: 'quick',
        });

        Alert.alert('Gotcha!', `You caught ${capitalize(pokemon.name)}!`);
        setPokemon(prev => prev.filter(p => p.id !== pokemon.id));
      } catch (error) {
        console.error('Error saving captured Pokemon:', error);
        Alert.alert('Caught!', `You caught ${capitalize(pokemon.name)}! (Save failed - check connection)`);
        setPokemon(prev => prev.filter(p => p.id !== pokemon.id));
      }
    } else {
      Alert.alert('Oh no!', `${capitalize(pokemon.name)} escaped! Try AR mode for better chances!`);
    }
  }, [user, location]);

  // Clean up old Pokemon (remove after 5 minutes)
  const cleanupOldPokemon = useCallback(() => {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    setPokemon(prev => prev.filter(p => (now - p.spawnTime) < maxAge));
  }, []);

  // Start hunting
  const startHunting = useCallback(() => {
    if (!location) {
      Alert.alert('Error', 'Location not available. Please wait for GPS.');
      return;
    }

    setIsHunting(true);
    
    // Spawn initial Pokemon
    spawnPokemon();
    
    // Set up periodic spawning and cleanup
    spawnInterval.current = setInterval(() => {
      // Clean up old Pokemon first
      cleanupOldPokemon();
      
      // Only spawn if we have less than 5 Pokemon on map
      setPokemon(currentPokemon => {
        if (currentPokemon.length < 5) {
          // Trigger spawn in next tick
          setTimeout(spawnPokemon, 100);
        }
        return currentPokemon;
      });
    }, 10000); // Check every 10 seconds

    console.log('Started hunting mode');
  }, [location, spawnPokemon, cleanupOldPokemon]);

  // Stop hunting
  const stopHunting = useCallback(() => {
    setIsHunting(false);
    
    // Clear intervals
    if (spawnInterval.current) {
      clearInterval(spawnInterval.current);
      spawnInterval.current = null;
    }

    // Clear all Pokemon
    setPokemon([]);
    
    console.log('Stopped hunting mode');
  }, []);

  // Center map on user
  const centerOnUser = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [location]);

  // Initialize location on mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spawnInterval.current) {
        clearInterval(spawnInterval.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef5350" />
        <Text style={styles.loadingText}>Setting up hunt mode...</Text>
      </View>
    );
  }

  if (error || !location || !region) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Unable to get location'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={false} // Disable to avoid location service conflicts
        showsMyLocationButton={false}
        mapType="standard"
        onMapReady={() => {
          console.log('Map loaded successfully');
        }}
      >
        {/* User location marker */}
        <Marker
          coordinate={location}
          title="You are here"
          pinColor="blue"
        />
        
        {/* Pokemon markers */}
        {pokemon.map((poke) => {
          const distance = location ? Math.round(calculateDistance(location, poke.location)) : 999;
          const isInteractable = distance <= 15;
          
          return (
            <Marker
              key={poke.id}
              coordinate={poke.location}
              onPress={() => handlePokemonTap(poke)}
            >
              <View style={[
                styles.pokemonMarker,
                isInteractable ? styles.pokemonMarkerInteractable : styles.pokemonMarkerFar
              ]}>
                <Image
                  source={{ uri: poke.sprite }}
                  style={styles.pokemonImage}
                  onError={() => console.log('Failed to load Pokemon sprite')}
                />
                <Text style={[
                  styles.pokemonName,
                  isInteractable ? styles.pokemonNameInteractable : styles.pokemonNameFar
                ]}>
                  {capitalize(poke.name)}
                </Text>
                <Text style={styles.distanceText}>
                  {distance}m
                </Text>
                {isInteractable && (
                  <Text style={styles.interactableText}>
                    📱 Tap to catch!
                  </Text>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Status info */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Pokemon nearby: {pokemon.length}
        </Text>
        {isHunting && (
          <Text style={styles.huntingText}>🎯 Hunting Active</Text>
        )}
        <Text style={styles.mockLocationText}>
          📍 Mock Location Mode (Avoiding GPS conflicts)
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.locateButton}
          onPress={centerOnUser}
        >
          <Text style={styles.locateButtonText}>📍</Text>
        </TouchableOpacity>

        {!isHunting ? (
          <TouchableOpacity
            style={styles.huntButton}
            onPress={startHunting}
          >
            <Text style={styles.huntButtonText}>Start Hunt</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopHunting}
          >
            <Text style={styles.stopButtonText}>Stop Hunt</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef5350',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ef5350',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pokemonMarker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef5350',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    minWidth: 80,
  },
  pokemonMarkerInteractable: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
    borderWidth: 3,
  },
  pokemonMarkerFar: {
    borderColor: '#ff9800',
    backgroundColor: '#fff3e0',
  },
  pokemonImage: {
    width: 40,
    height: 40,
  },
  pokemonName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
    textAlign: 'center',
  },
  pokemonNameInteractable: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  pokemonNameFar: {
    color: '#f57c00',
  },
  distanceText: {
    fontSize: 8,
    color: '#666',
    marginTop: 1,
  },
  interactableText: {
    fontSize: 8,
    color: '#4caf50',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  statusContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  huntingText: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 4,
  },
  mockLocationText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locateButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 2,
    borderColor: '#ef5350',
  },
  locateButtonText: {
    fontSize: 18,
  },
  huntButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  huntButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});