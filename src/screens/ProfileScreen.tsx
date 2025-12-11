import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  Button, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { launchImageLibrary } from 'react-native-image-picker';

import { useAuth } from '../../AuthContext';
import { UserService } from '../services/userService';
import { PokemonService } from '../services/pokemonService';
import { CapturedPokemon } from '../types/firebase';
import { capitalize } from '../utils/pokemon';

export const ProfileScreen = () => {
  const { user, userProfile, signOut, updateUserProfile, refreshUserProfile } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pokemonStats, setPokemonStats] = useState({
    totalCaught: 0,
    uniqueSpecies: 0,
    completionPercentage: 0,
    recentCaptures: [] as CapturedPokemon[],
  });
  const [captureMethodStats, setCaptureMethodStats] = useState({
    quickCaptures: 0,
    arCaptures: 0,
    totalCaptures: 0,
  });

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load Pokemon stats
      const stats = await PokemonService.getPokedexStats(user.uid);
      setPokemonStats(stats);
      
      // Load capture method stats
      const methodStats = await PokemonService.getCaptureMethodStats(user.uid);
      setCaptureMethodStats(methodStats);
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleEditName = () => {
    setNewDisplayName(userProfile?.displayName || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newDisplayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    try {
      await updateUserProfile({ displayName: newDisplayName.trim() });
      setEditingName(false);
      Alert.alert('Success', 'Display name updated!');
    } catch (error) {
      console.error('Error updating display name:', error);
      Alert.alert('Error', 'Failed to update display name');
    }
  };

  const handleProfilePictureUpload = () => {
    Alert.alert(
      'Profile Picture',
      'Profile picture upload will be available in a future update!',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom + 24 }]}>
        <ActivityIndicator size="large" color="#ef5350" />
        <Text style={styles.loadingText}>Loading trainer data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 12 },
      ]}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={handleProfilePictureUpload} disabled={uploadingImage}>
          <View style={styles.profileImageContainer}>
            {userProfile?.profilePictureUrl ? (
              <Image source={{ uri: userProfile.profilePictureUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.defaultProfileImage}>
                <Text style={styles.defaultProfileText}>
                  {userProfile?.displayName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            {uploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            <View style={styles.editImageIcon}>
              <Text style={styles.editImageText}>📷</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.profileInfo}>
          {editingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={newDisplayName}
                onChangeText={setNewDisplayName}
                placeholder="Enter display name"
                autoFocus
              />
              <View style={styles.editNameButtons}>
                <TouchableOpacity onPress={() => setEditingName(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveName} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEditName}>
              <Text style={styles.displayName}>{userProfile?.displayName || 'Pokémon Trainer'}</Text>
              <Text style={styles.editHint}>Tap to edit</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.email}>{userProfile?.email || user?.email}</Text>
        </View>
      </View>

      {/* Pokédex Stats */}
      <View style={styles.card}>
        <Text style={styles.title}>🏆 Pokédex Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pokemonStats.totalCaught}</Text>
            <Text style={styles.statLabel}>Total Caught</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pokemonStats.uniqueSpecies}</Text>
            <Text style={styles.statLabel}>Unique Species</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pokemonStats.completionPercentage}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>
      </View>

      {/* Capture Method Stats */}
      <View style={styles.card}>
        <Text style={styles.title}>📊 Capture Methods</Text>
        <View style={styles.methodStats}>
          <View style={styles.methodItem}>
            <Text style={styles.methodLabel}>Quick Catch</Text>
            <Text style={styles.methodNumber}>{captureMethodStats.quickCaptures}</Text>
          </View>
          <View style={styles.methodItem}>
            <Text style={styles.methodLabel}>AR Catch</Text>
            <Text style={styles.methodNumber}>{captureMethodStats.arCaptures}</Text>
          </View>
        </View>
        {captureMethodStats.totalCaptures > 0 && (
          <Text style={styles.methodNote}>
            AR Success Rate: {Math.round((captureMethodStats.arCaptures / captureMethodStats.totalCaptures) * 100)}%
          </Text>
        )}
      </View>

      {/* Recent Captures */}
      {pokemonStats.recentCaptures.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.title}>🎯 Recent Captures</Text>
          {pokemonStats.recentCaptures.map((pokemon, index) => (
            <View key={pokemon.uniqueInstanceId} style={styles.recentCaptureItem}>
              <Image
                source={{ uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png` }}
                style={styles.pokemonSprite}
              />
              <View style={styles.captureInfo}>
                <Text style={styles.pokemonName}>{capitalize(pokemon.pokemonName)}</Text>
                <Text style={styles.captureDate}>
                  {pokemon.capturedAt.toLocaleDateString()} • {pokemon.captureMethod?.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Account Actions */}
      <View style={styles.card}>
        <TouchableOpacity onPress={loadUserData} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄 Refresh Data</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  profileHeader: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ef5350',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultProfileText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef5350',
  },
  editImageText: {
    fontSize: 12,
  },
  profileInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  editHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  editNameContainer: {
    alignItems: 'center',
    width: '100%',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    width: '100%',
    marginBottom: 12,
  },
  editNameButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#ef5350',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef5350',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  methodStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  methodItem: {
    alignItems: 'center',
  },
  methodLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  methodNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4caf50',
  },
  methodNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  recentCaptureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pokemonSprite: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  captureInfo: {
    flex: 1,
  },
  pokemonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  captureDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  signOutButton: {
    backgroundColor: '#ef5350',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

