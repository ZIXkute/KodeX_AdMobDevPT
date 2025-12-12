import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../AuthContext';
import { CommunityService, CommunityPost, NewPostData } from '../services/communityService';
import { PokemonService } from '../services/pokemonService';
import { CapturedPokemon } from '../types/firebase';
import { capitalize } from '../utils/pokemon';

export const CommunityScreen = () => {
  const { user, userProfile } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [capturedPokemon, setCapturedPokemon] = useState<CapturedPokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<CapturedPokemon | null>(null);
  const [postMessage, setPostMessage] = useState('');
  const [posting, setPosting] = useState(false);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = CommunityService.subscribeToPosts((newPosts) => {
      setPosts(newPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user's captured Pokemon for sharing
  useEffect(() => {
    if (user) {
      loadCapturedPokemon();
    }
  }, [user]);

  const loadCapturedPokemon = async () => {
    if (!user) return;
    try {
      const pokemon = await PokemonService.getCapturedPokemon(user.uid, 20);
      setCapturedPokemon(pokemon);
    } catch (error) {
      console.error('Error loading captured Pokemon:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const freshPosts = await CommunityService.getPosts();
      setPosts(freshPosts);
    } catch (error) {
      console.error('Error refreshing posts:', error);
    }
    setRefreshing(false);
  }, []);

  const handleLike = async (post: CommunityPost) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to like posts');
      return;
    }

    try {
      const hasLiked = post.likedBy.includes(user.uid);
      if (hasLiked) {
        await CommunityService.unlikePost(post.id, user.uid);
      } else {
        await CommunityService.likePost(post.id, user.uid);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDeletePost = async (post: CommunityPost) => {
    if (!user || post.odId !== user.uid) return;

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CommunityService.deletePost(post.id, user.uid);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleCreatePost = async () => {
    if (!user || !userProfile || !selectedPokemon) {
      Alert.alert('Error', 'Please select a Pokemon to share');
      return;
    }

    if (!postMessage.trim()) {
      Alert.alert('Error', 'Please add a message');
      return;
    }

    setPosting(true);
    try {
      const postData: NewPostData = {
        odId: user.uid,
        odName: userProfile.displayName || 'Trainer',
        odAvatar: userProfile.profilePictureUrl,
        pokemonId: selectedPokemon.pokemonId,
        pokemonName: selectedPokemon.pokemonName,
        message: postMessage.trim(),
        captureMethod: selectedPokemon.captureMethod || 'quick',
      };

      await CommunityService.createPost(postData);
      
      setShowNewPostModal(false);
      setSelectedPokemon(null);
      setPostMessage('');
      Alert.alert('Success', 'Your discovery has been shared!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    }
    setPosting(false);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderPost = ({ item }: { item: CommunityPost }) => {
    const hasLiked = user ? item.likedBy.includes(user.uid) : false;
    const isOwner = user?.uid === item.odId;
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemonId}.png`;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            {item.odAvatar ? (
              <Image source={{ uri: item.odAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.odName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{item.odName}</Text>
              <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>
          {isOwner && (
            <TouchableOpacity onPress={() => handleDeletePost(item)}>
              <Text style={styles.deleteButton}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.pokemonSection}>
          <Image source={{ uri: spriteUrl }} style={styles.pokemonSprite} />
          <View style={styles.pokemonInfo}>
            <Text style={styles.pokemonName}>{capitalize(item.pokemonName)}</Text>
            <Text style={styles.captureMethod}>
              Caught via {item.captureMethod === 'ar' ? '📷 AR Mode' : '⚡ Quick Catch'}
            </Text>
          </View>
        </View>

        <Text style={styles.postMessage}>{item.message}</Text>

        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.likeButton} 
            onPress={() => handleLike(item)}
          >
            <Text style={[styles.likeIcon, hasLiked && styles.liked]}>
              {hasLiked ? '❤️' : '🤍'}
            </Text>
            <Text style={styles.likeCount}>{item.likes}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderNewPostModal = () => (
    <Modal
      visible={showNewPostModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowNewPostModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Your Discovery</Text>
            <TouchableOpacity onPress={() => setShowNewPostModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Select a Pokemon to share:</Text>
          <FlatList
            data={capturedPokemon}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.uniqueInstanceId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pokemonOption,
                  selectedPokemon?.uniqueInstanceId === item.uniqueInstanceId && styles.pokemonSelected
                ]}
                onPress={() => setSelectedPokemon(item)}
              >
                <Image
                  source={{ uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemonId}.png` }}
                  style={styles.optionSprite}
                />
                <Text style={styles.optionName}>{capitalize(item.pokemonName)}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No captured Pokemon yet. Go catch some!</Text>
            }
            contentContainerStyle={styles.pokemonList}
          />

          <Text style={styles.sectionTitle}>Your message:</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Share your experience..."
            placeholderTextColor="#999"
            value={postMessage}
            onChangeText={setPostMessage}
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{postMessage.length}/200</Text>

          <TouchableOpacity
            style={[styles.postButton, (!selectedPokemon || !postMessage.trim() || posting) && styles.postButtonDisabled]}
            onPress={handleCreatePost}
            disabled={!selectedPokemon || !postMessage.trim() || posting}
          >
            {posting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>Share Discovery</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef5350" />
        <Text style={styles.loadingText}>Loading community feed...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSubtitle}>Share and discover Pokemon catches</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ef5350" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to share your discovery!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => setShowNewPostModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {renderNewPostModal()}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7fb',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ececf2',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1b1b1f',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef5350',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  userName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    fontSize: 18,
  },
  pokemonSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7fb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  pokemonSprite: {
    width: 60,
    height: 60,
  },
  pokemonInfo: {
    marginLeft: 10,
  },
  pokemonName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  captureMethod: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  postMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  liked: {
    transform: [{ scale: 1.1 }],
  },
  likeCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef5350',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  pokemonList: {
    paddingVertical: 10,
  },
  pokemonOption: {
    alignItems: 'center',
    padding: 10,
    marginRight: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ececf2',
    backgroundColor: '#f7f7fb',
  },
  pokemonSelected: {
    borderColor: '#ef5350',
    backgroundColor: '#fff0f0',
  },
  optionSprite: {
    width: 50,
    height: 50,
  },
  optionName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
  messageInput: {
    backgroundColor: '#f7f7fb',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 16,
  },
  postButton: {
    backgroundColor: '#ef5350',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
