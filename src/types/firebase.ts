export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  profilePictureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CapturedPokemon {
  pokemonId: number;
  pokemonName: string;
  uniqueInstanceId: string;
  capturedAt: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  captureMethod?: 'quick' | 'ar';
}

export interface FirebaseError {
  code: string;
  message: string;
}