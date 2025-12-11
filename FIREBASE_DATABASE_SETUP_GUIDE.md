# Firebase Database Setup for Pokemon AR Game

## Database Structure

Your Firestore database uses the following structure:

```
📁 trainers (collection)
├── 📄 {trainerId} (document - uses Firebase Auth UID)
│   ├── badges: [] (array)
│   ├── caughtCount: 0 (number - auto-increments on capture)
│   ├── displayName: "Test Trainer" (string)
│   ├── email: "test@example.com" (string)
│   ├── points: 0 (number)
│   ├── profilePictureUrl: "https://..." (string, optional)
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── 📁 capturedPokemon (subcollection)
│       ├── 📄 {uniqueInstanceId} (document)
│       │   ├── pokemonId: 25 (number)
│       │   ├── pokemonName: "pikachu" (string)
│       │   ├── uniqueInstanceId: "25_1703123456789_abc123" (string)
│       │   ├── capturedAt: timestamp
│       │   ├── location: GeoPoint (optional)
│       │   └── captureMethod: "ar" | "quick" (string)
│       └── 📄 {anotherInstanceId} (document)
│           └── ... (more captured Pokemon)
```

## How It Works

### 1. User Authentication
- When a user signs up or logs in, their profile is created/updated in the `trainers` collection
- The document ID is the user's Firebase Auth UID

### 2. Pokemon Capture Flow
- **Quick Catch**: From the Hunt screen, tap a Pokemon and select "Quick Catch"
- **AR Catch**: From the Hunt screen, tap a Pokemon and select "Enter AR Mode"
- Both methods save to the `capturedPokemon` subcollection

### 3. Data Saved on Capture
```typescript
{
  pokemonId: number,        // Pokemon species ID (1-151)
  pokemonName: string,      // Pokemon name (e.g., "pikachu")
  uniqueInstanceId: string, // Unique ID for this capture instance
  capturedAt: Timestamp,    // When the Pokemon was caught
  captureMethod: string,    // "ar" or "quick"
  location: GeoPoint        // Optional - GPS coordinates
}
```

### 4. Automatic Updates
- `caughtCount` field on the trainer document auto-increments with each capture
- Profile screen shows real-time stats from the database

## Services

### PokemonService (`src/services/pokemonService.ts`)
- `capturePokemon()` - Save a captured Pokemon to Firestore
- `getCapturedPokemon()` - Get all captured Pokemon for a user
- `getPokedexStats()` - Get completion statistics
- `getCaptureMethodStats()` - Get AR vs Quick catch stats

### UserService (`src/services/userService.ts`)
- `createOrUpdateUserProfile()` - Create/update trainer profile
- `getUserProfile()` - Get trainer profile
- `updateDisplayName()` - Update trainer name
- `getUserStats()` - Get trainer statistics

## Testing the Database

1. **Sign up/Login** to create your trainer profile
2. **Go to Hunt tab** and start hunting
3. **Tap a Pokemon** and choose Quick Catch or AR Mode
4. **Check Firebase Console** - you should see:
   - New document in `trainers/{uid}/capturedPokemon`
   - `caughtCount` incremented on trainer document
5. **Go to Profile tab** - stats should update automatically

## Troubleshooting

### "Unsupported field value: undefined" Error
- Fixed: The Pokemon service now filters out undefined values before saving

### View Hierarchy Crash in AR Mode
- Fixed: Camera is properly unmounted before navigation
- Uses `useIsFocused` hook to manage camera lifecycle

### Data Not Saving
- Check Firebase Console for any security rule issues
- Ensure user is authenticated before capturing
- Check console logs for specific error messages
