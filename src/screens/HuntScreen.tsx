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

  // Generate random location near user
  const generateNearbyLocation = (userLocation: Location): Location => {
    const radius = 0.005; // Roughly 500 meters
    const randomLat = userLocation.latitude + (Math.random() - 0.5) * radius;
    const randomLng = userLocation.longitude + (Math.random() - 0.5) * radius;
    
    return {
      latitude: randomLat,
      longitude: randomLng,
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
    
    Alert.alert(
      `Wild ${capitalize(pokemon.name)}!`,
      `Distance: ${distance}m away`,
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
          text: 'Try to Catch',
          onPress: () => handleCatchAttempt(pokemon, distance),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [location, navigation]);

  // Handle catch attempt
  const handleCatchAttempt = useCallback((pokemon: Pokemon, distance: number) => {
    if (distance > 50) {
      Alert.alert('Too far away!', 'Get closer to catch this Pokemon.');
      return;
    }

    // Simple catch probability
    const catchChance = Math.max(0.3, 1 - (distance / 100));
    const success = Math.random() < catchChance;

    if (success) {
      Alert.alert('Gotcha!', `You caught ${capitalize(pokemon.name)}!`);
      setPokemon(prev => prev.filter(p => p.id !== pokemon.id));
    } else {
      Alert.alert('Oh no!', `${capitalize(pokemon.name)} escaped! Try again!`);
    }
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
    
    // Set up periodic spawning
    spawnInterval.current = setInterval(() => {
      spawnPokemon();
    }, 15000); // Spawn every 15 seconds

    console.log('Started hunting mode');
  }, [location, spawnPokemon]);

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
        {pokemon.map((poke) => (
          <Marker
            key={poke.id}
            coordinate={poke.location}
            onPress={() => handlePokemonTap(poke)}
          >
            <View style={styles.pokemonMarker}>
              <Image
                source={{ uri: poke.sprite }}
                style={styles.pokemonImage}
              />
              <Text style={styles.pokemonName}>
                {capitalize(poke.name)}
              </Text>
            </View>
          </Marker>
        ))}
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