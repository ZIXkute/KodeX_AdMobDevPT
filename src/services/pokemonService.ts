import firestore from '@react-native-firebase/firestore';
import { CapturedPokemon } from '../types/firebase';

const USERS_COLLECTION = 'trainers';
const CAPTURED_POKEMON_COLLECTION = 'capturedPokemon';

export class PokemonService {
  /**
   * Save captured Pokémon to user's profile
   */
  static async capturePokemon(
    uid: string,
    pokemonData: {
      pokemonId: number;
      pokemonName: string;
      location?: { latitude: number; longitude: number };
      captureMethod?: 'quick' | 'ar';
    }
  ): Promise<string> {
    try {
      console.log('Capturing Pokemon with data:', pokemonData);
      
      const uniqueInstanceId = `${pokemonData.pokemonId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Build the captured Pokemon object, excluding undefined values
      const capturedPokemon: any = {
        pokemonId: pokemonData.pokemonId,
        pokemonName: pokemonData.pokemonName,
        uniqueInstanceId,
        capturedAt: firestore.Timestamp.now(), // Use Firestore timestamp instead of Date
        captureMethod: pokemonData.captureMethod || 'quick',
      };

      // Only add location if it's provided and not undefined
      if (pokemonData.location && 
          typeof pokemonData.location.latitude === 'number' && 
          typeof pokemonData.location.longitude === 'number') {
        capturedPokemon.location = new firestore.GeoPoint(
          pokemonData.location.latitude,
          pokemonData.location.longitude
        );
      }
      
      console.log('Final captured Pokemon object:', capturedPokemon);
      
      // Use a batch to update both the captured Pokemon and the trainer's caughtCount
      const batch = firestore().batch();
      
      // Add to trainer's captured Pokémon collection
      const capturedPokemonRef = firestore()
        .collection(USERS_COLLECTION)
        .doc(uid)
        .collection(CAPTURED_POKEMON_COLLECTION)
        .doc(uniqueInstanceId);
      
      batch.set(capturedPokemonRef, capturedPokemon);
      
      // Update trainer's caughtCount - use set with merge to handle case where document might not exist
      const trainerRef = firestore().collection(USERS_COLLECTION).doc(uid);
      batch.set(trainerRef, {
        caughtCount: firestore.FieldValue.increment(1)
      }, { merge: true });
      
      // Commit the batch
      await batch.commit();
      
      console.log(`Pokémon ${pokemonData.pokemonName} captured and saved to Firestore`);
      return uniqueInstanceId;
    } catch (error) {
      console.error('Error capturing Pokémon:', error);
      throw error;
    }
  }

  /**
   * Get all captured Pokémon for a user
   */
  static async getCapturedPokemon(
    uid: string,
    limit?: number
  ): Promise<CapturedPokemon[]> {
    try {
      let query = firestore()
        .collection(USERS_COLLECTION)
        .doc(uid)
        .collection(CAPTURED_POKEMON_COLLECTION)
        .orderBy('capturedAt', 'desc');
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        capturedAt: doc.data().capturedAt?.toDate() || new Date(),
      })) as CapturedPokemon[];
    } catch (error) {
      console.error('Error getting captured Pokémon:', error);
      throw error;
    }
  }

  /**
   * Get captured Pokémon by species ID
   */
  static async getCapturedPokemonBySpecies(
    uid: string,
    pokemonId: number
  ): Promise<CapturedPokemon[]> {
    try {
      const snapshot = await firestore()
        .collection(USERS_COLLECTION)
        .doc(uid)
        .collection(CAPTURED_POKEMON_COLLECTION)
        .where('pokemonId', '==', pokemonId)
        .orderBy('capturedAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        capturedAt: doc.data().capturedAt?.toDate() || new Date(),
      })) as CapturedPokemon[];
    } catch (error) {
      console.error('Error getting captured Pokémon by species:', error);
      throw error;
    }
  }

  /**
   * Check if user has caught a specific Pokémon species
   */
  static async hasCaughtPokemon(uid: string, pokemonId: number): Promise<boolean> {
    try {
      const snapshot = await firestore()
        .collection(USERS_COLLECTION)
        .doc(uid)
        .collection(CAPTURED_POKEMON_COLLECTION)
        .where('pokemonId', '==', pokemonId)
        .limit(1)
        .get();
      
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking if Pokémon is caught:', error);
      return false;
    }
  }

  /**
   * Get user's Pokédex completion stats
   */
  static async getPokedexStats(uid: string): Promise<{
    totalCaught: number;
    uniqueSpecies: number;
    completionPercentage: number;
    recentCaptures: CapturedPokemon[];
  }> {
    try {
      const allCaptured = await this.getCapturedPokemon(uid);
      const uniqueSpecies = new Set(allCaptured.map(p => p.pokemonId)).size;
      const totalOriginalPokemon = 151; // Original 151 Pokémon
      
      const recentCaptures = await this.getCapturedPokemon(uid, 5);
      
      return {
        totalCaught: allCaptured.length,
        uniqueSpecies,
        completionPercentage: Math.round((uniqueSpecies / totalOriginalPokemon) * 100),
        recentCaptures,
      };
    } catch (error) {
      console.error('Error getting Pokédex stats:', error);
      return {
        totalCaught: 0,
        uniqueSpecies: 0,
        completionPercentage: 0,
        recentCaptures: [],
      };
    }
  }

  /**
   * Delete a captured Pokémon instance
   */
  static async releasePokemon(uid: string, uniqueInstanceId: string): Promise<void> {
    try {
      await firestore()
        .collection(USERS_COLLECTION)
        .doc(uid)
        .collection(CAPTURED_POKEMON_COLLECTION)
        .doc(uniqueInstanceId)
        .delete();
      
      console.log(`Pokémon ${uniqueInstanceId} released`);
    } catch (error) {
      console.error('Error releasing Pokémon:', error);
      throw error;
    }
  }

  /**
   * Get capture statistics by method (quick vs AR)
   */
  static async getCaptureMethodStats(uid: string): Promise<{
    quickCaptures: number;
    arCaptures: number;
    totalCaptures: number;
  }> {
    try {
      const allCaptured = await this.getCapturedPokemon(uid);
      
      const quickCaptures = allCaptured.filter(p => p.captureMethod === 'quick').length;
      const arCaptures = allCaptured.filter(p => p.captureMethod === 'ar').length;
      
      return {
        quickCaptures,
        arCaptures,
        totalCaptures: allCaptured.length,
      };
    } catch (error) {
      console.error('Error getting capture method stats:', error);
      return {
        quickCaptures: 0,
        arCaptures: 0,
        totalCaptures: 0,
      };
    }
  }
}