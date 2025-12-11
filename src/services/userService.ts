import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { UserProfile } from '../types/firebase';

const USERS_COLLECTION = 'trainers';

export class UserService {
  /**
   * Create or update user profile in Firestore
   */
  static async createOrUpdateUserProfile(
    uid: string,
    profileData: Partial<UserProfile>
  ): Promise<void> {
    try {
      const userRef = firestore().collection(USERS_COLLECTION).doc(uid);
      const userDoc = await userRef.get();
      
      const now = new Date();
      
      if (userDoc.exists()) {
        // Update existing user
        await userRef.update({
          ...profileData,
          updatedAt: now,
        });
      } else {
        // Create new user profile
        const newProfile: UserProfile = {
          uid,
          displayName: profileData.displayName || 'Pokémon Trainer',
          email: profileData.email || '',
          profilePictureUrl: profileData.profilePictureUrl,
          createdAt: now,
          updatedAt: now,
        };
        
        await userRef.set(newProfile);
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile from Firestore
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await firestore()
        .collection(USERS_COLLECTION)
        .doc(uid)
        .get();
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data?.createdAt?.toDate() || new Date(),
          updatedAt: data?.updatedAt?.toDate() || new Date(),
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user display name
   */
  static async updateDisplayName(uid: string, displayName: string): Promise<void> {
    try {
      await firestore()
        .collection(USERS_COLLECTION)
        .doc(uid)
        .update({
          displayName,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error updating display name:', error);
      throw error;
    }
  }

  /**
   * Upload profile picture to Firebase Storage and update user profile
   */
  static async uploadProfilePicture(
    uid: string,
    imageUri: string
  ): Promise<string> {
    try {
      // Create a unique filename
      const filename = `profile_pictures/${uid}_${Date.now()}.jpg`;
      const reference = storage().ref(filename);
      
      // Upload the image
      await reference.putFile(imageUri);
      
      // Get the download URL
      const downloadUrl = await reference.getDownloadURL();
      
      // Update user profile with new picture URL
      await firestore()
        .collection(USERS_COLLECTION)
        .doc(uid)
        .update({
          profilePictureUrl: downloadUrl,
          updatedAt: new Date(),
        });
      
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  /**
   * Delete old profile picture from storage
   */
  static async deleteOldProfilePicture(profilePictureUrl: string): Promise<void> {
    try {
      // Only delete if it's a Firebase Storage URL
      if (profilePictureUrl.includes('firebasestorage.googleapis.com')) {
        const reference = storage().refFromURL(profilePictureUrl);
        await reference.delete();
      }
    } catch (error) {
      // Don't throw error if deletion fails (file might not exist)
      console.warn('Could not delete old profile picture:', error);
    }
  }

  /**
   * Initialize user profile after Google Sign-In
   */
  static async initializeGoogleUser(user: any): Promise<void> {
    try {
      const profileData: Partial<UserProfile> = {
        displayName: user.displayName || 'Pokémon Trainer',
        email: user.email || '',
        profilePictureUrl: user.photoURL || undefined,
      };
      
      await this.createOrUpdateUserProfile(user.uid, profileData);
    } catch (error) {
      console.error('Error initializing Google user:', error);
      throw error;
    }
  }

  /**
   * Get user statistics (total Pokémon caught, etc.)
   */
  static async getUserStats(uid: string): Promise<{
    totalCaptured: number;
    uniqueSpecies: number;
    lastCaptureDate?: Date;
  }> {
    try {
      const capturedPokemon = await firestore()
        .collection(USERS_COLLECTION)
        .doc(uid)
        .collection('capturedPokemon')
        .get();
      
      const totalCaptured = capturedPokemon.size;
      const uniqueSpecies = new Set(
        capturedPokemon.docs.map(doc => doc.data().pokemonId)
      ).size;
      
      // Get most recent capture
      const recentCapture = await firestore()
        .collection(USERS_COLLECTION)
        .doc(uid)
        .collection('capturedPokemon')
        .orderBy('capturedAt', 'desc')
        .limit(1)
        .get();
      
      const lastCaptureDate = recentCapture.docs[0]?.data()?.capturedAt?.toDate();
      
      return {
        totalCaptured,
        uniqueSpecies,
        lastCaptureDate,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalCaptured: 0,
        uniqueSpecies: 0,
      };
    }
  }
}