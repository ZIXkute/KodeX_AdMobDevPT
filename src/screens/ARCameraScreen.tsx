import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  BackHandler,
  InteractionManager,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';

import { MainStackParamList } from '../navigation/types';
import { PokemonDetail } from '../types/pokemon';
import { capitalize, getSpriteUri } from '../utils/pokemon';
import { fetchPokemonDetailBundle } from '../services/pokeApi';
import { useAuth } from '../../AuthContext';
import { PokemonService } from '../services/pokemonService';

type Props = NativeStackScreenProps<MainStackParamList, 'ARCamera'>;

export const ARCameraScreen = ({ navigation }: Props) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const { user } = useAuth();
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();
  
  const [cameraReady, setCameraReady] = useState(false);
  const [overlayPokemon, setOverlayPokemon] = useState<PokemonDetail | null>(null);
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'capturing' | 'success' | 'failed'>('idle');
  const [captureMessage, setCaptureMessage] = useState<string>('');
  const mountedRef = useRef(true);

  // Only show camera when screen is focused AND ready
  const showCamera = isFocused && cameraReady && hasPermission && device;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle camera readiness with delay
  useEffect(() => {
    if (isFocused && hasPermission && device) {
      // Delay camera activation to let the view settle
      const handle = InteractionManager.runAfterInteractions(() => {
        if (mountedRef.current) {
          setCameraReady(true);
          // Load Pokemon after camera is ready
          setTimeout(() => {
            if (mountedRef.current && !overlayPokemon) {
              loadRandomPokemon();
            }
          }, 500);
        }
      });
      return () => handle.cancel();
    } else {
      setCameraReady(false);
    }
  }, [isFocused, hasPermission, device]);

  // Reset state when screen loses focus
  useEffect(() => {
    if (!isFocused) {
      setCameraReady(false);
      setCaptureStatus('idle');
      setCaptureMessage('');
    }
  }, [isFocused]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      safeGoBack();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const loadRandomPokemon = async () => {
    try {
      const randomId = Math.floor(Math.random() * 151) + 1;
      const bundle = await fetchPokemonDetailBundle(randomId);
      if (mountedRef.current) {
        setOverlayPokemon(bundle.detail);
      }
    } catch (error) {
      console.warn('Error loading Pokémon:', error);
    }
  };

  const safeGoBack = useCallback(() => {
    // Disable camera first
    setCameraReady(false);
    setCaptureStatus('idle');
    
    // Small delay then navigate
    setTimeout(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // Navigate to Hunt tab if can't go back
        navigation.getParent()?.navigate('HuntTab');
      }
    }, 100);
  }, [navigation]);

  const catchPokemon = async () => {
    if (!overlayPokemon || !user) {
      setCaptureMessage(!overlayPokemon ? 'No Pokemon!' : 'Not logged in!');
      setCaptureStatus('failed');
      setTimeout(() => {
        if (mountedRef.current) setCaptureStatus('idle');
      }, 1500);
      return;
    }

    // Disable camera during capture to prevent view issues
    setCameraReady(false);
    setCaptureStatus('capturing');
    setCaptureMessage('Catching...');

    const success = Math.random() < 0.8; // 80% catch rate

    if (success) {
      try {
        await PokemonService.capturePokemon(user.uid, {
          pokemonId: overlayPokemon.id,
          pokemonName: overlayPokemon.name,
          captureMethod: 'ar',
        });

        if (mountedRef.current) {
          setCaptureStatus('success');
          setCaptureMessage(`Caught ${capitalize(overlayPokemon.name)}!`);
        }
        
        setTimeout(() => {
          if (mountedRef.current) {
            setOverlayPokemon(null);
            safeGoBack();
          }
        }, 1500);
      } catch (error) {
        console.error('Capture error:', error);
        if (mountedRef.current) {
          setCaptureStatus('success');
          setCaptureMessage(`Caught! (Save failed)`);
        }
        setTimeout(() => {
          if (mountedRef.current) safeGoBack();
        }, 1500);
      }
    } else {
      if (mountedRef.current) {
        setCaptureStatus('failed');
        setCaptureMessage(`${capitalize(overlayPokemon.name)} escaped!`);
      }
      
      setTimeout(() => {
        if (mountedRef.current) {
          setCaptureStatus('idle');
          setCaptureMessage('');
          setCameraReady(true); // Re-enable camera
        }
      }, 1500);
    }
  };

  // Permission screen
  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={safeGoBack}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No device
  if (!device) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ef5350" />
        <Text style={styles.messageText}>Loading camera...</Text>
      </View>
    );
  }

  const spriteUri = overlayPokemon ? getSpriteUri(overlayPokemon.sprites) : null;

  return (
    <View style={styles.container}>
      {/* Camera - only render when ready */}
      {showCamera && device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
        />
      ) : (
        <View style={styles.cameraPlaceholder} />
      )}

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={safeGoBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {/* Pokemon overlay - only when idle */}
      {overlayPokemon && spriteUri && captureStatus === 'idle' && (
        <View style={styles.pokemonContainer}>
          <View style={styles.pokemonCard}>
            <Image source={{ uri: spriteUri }} style={styles.pokemonImage} />
            <Text style={styles.pokemonName}>{capitalize(overlayPokemon.name)}</Text>
          </View>
        </View>
      )}

      {/* Status overlay */}
      {captureStatus !== 'idle' && (
        <View style={styles.statusOverlay}>
          <View style={[
            styles.statusCard,
            captureStatus === 'success' && styles.successCard,
            captureStatus === 'failed' && styles.failedCard,
          ]}>
            {captureStatus === 'capturing' && (
              <ActivityIndicator size="large" color="#fff" />
            )}
            <Text style={styles.statusText}>{captureMessage}</Text>
          </View>
        </View>
      )}

      {/* Catch button */}
      {overlayPokemon && captureStatus === 'idle' && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.catchButton} onPress={catchPokemon}>
            <Text style={styles.catchButtonText}>🎯 CATCH!</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Pokemon */}
      {!overlayPokemon && captureStatus === 'idle' && (
        <View style={styles.controlsContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.loadingText}>Finding Pokemon...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ef5350',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    zIndex: 100,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pokemonContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokemonCard: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  pokemonImage: {
    width: 150,
    height: 150,
  },
  pokemonName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: '#333',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  successCard: {
    borderWidth: 3,
    borderColor: '#4caf50',
  },
  failedCard: {
    borderWidth: 3,
    borderColor: '#f44336',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  catchButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#2e7d32',
  },
  catchButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  loadingCard: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginLeft: 10,
  },
});
