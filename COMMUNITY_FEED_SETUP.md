# Community Feed & Voice Search Setup Guide

## 🎤 Voice Search Feature

The voice search feature is now integrated into the Pokedex search. Users can tap the microphone icon to search for Pokemon by voice.

### How it works:
1. Tap the 🎤 button in the search bar
2. Speak the Pokemon name (e.g., "Pikachu", "Charizard")
3. The search will automatically update with your spoken text

### Permissions Required:
- **Android**: `RECORD_AUDIO` permission (automatically requested)
- **iOS**: Microphone permission (handled by the system)

---

## 👥 Community Feed Feature

The Community Feed allows users to share their Pokemon discoveries with other trainers.

### Features:
- View posts from other trainers
- Share your captured Pokemon with a message
- Like/unlike posts
- Delete your own posts
- Real-time updates (posts appear instantly)

---

## 🔥 Firebase Realtime Database Setup

### Step 1: Enable Realtime Database

1. Go to **Firebase Console** → Your Project
2. Click **"Realtime Database"** in the left sidebar
3. Click **"Create Database"**
4. Choose your database location (select closest to your users)
5. Select **"Start in test mode"** for development
6. Click **"Enable"**

### Step 2: Set Database Rules

1. In Realtime Database, click the **"Rules"** tab
2. Replace the rules with:

```json
{
  "rules": {
    "community_posts": {
      ".read": true,
      ".write": "auth != null",
      "$postId": {
        ".validate": "newData.hasChildren(['odId', 'odName', 'pokemonId', 'pokemonName', 'message', 'createdAt'])",
        "odId": {
          ".validate": "newData.isString()"
        },
        "odName": {
          ".validate": "newData.isString() && newData.val().length <= 50"
        },
        "pokemonId": {
          ".validate": "newData.isNumber()"
        },
        "pokemonName": {
          ".validate": "newData.isString()"
        },
        "message": {
          ".validate": "newData.isString() && newData.val().length <= 200"
        },
        "likes": {
          ".validate": "newData.isNumber()"
        },
        "createdAt": {
          ".validate": "newData.isNumber()"
        }
      }
    }
  }
}
```

3. Click **"Publish"**

### Step 3: For Development/Testing (Simpler Rules)

If you want simpler rules for testing:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **Warning**: Only use these rules for development. They allow anyone to read/write your database.

---

## 📊 Database Structure

The Community Feed uses this structure in Realtime Database:

```
community_posts/
├── {postId}/
│   ├── odId: "user123"           // User's Firebase Auth UID
│   ├── odName: "Ash Ketchum"     // User's display name
│   ├── odAvatar: "https://..."   // User's profile picture (optional)
│   ├── pokemonId: 25             // Pokemon species ID
│   ├── pokemonName: "pikachu"    // Pokemon name
│   ├── message: "Just caught..." // User's message (max 200 chars)
│   ├── captureMethod: "ar"       // "ar" or "quick"
│   ├── likes: 5                  // Number of likes
│   ├── likedBy: ["uid1", "uid2"] // Array of user IDs who liked
│   └── createdAt: 1702345678901  // Timestamp
```

---

## ✅ Verification Checklist

### Voice Search:
- [ ] Microphone permission requested on first use
- [ ] Voice recognition starts when tapping 🎤
- [ ] Spoken text appears in search field
- [ ] Search results update based on voice input

### Community Feed:
- [ ] Realtime Database enabled in Firebase Console
- [ ] Database rules published
- [ ] Posts load in the Community tab
- [ ] Can create new posts with captured Pokemon
- [ ] Can like/unlike posts
- [ ] Can delete own posts
- [ ] Real-time updates work (new posts appear instantly)

---

## 🚨 Troubleshooting

### Voice Search Issues:

**"Voice recognition not available"**
- Ensure Google app is installed (Android)
- Check device has microphone
- Try restarting the app

**"Permission denied"**
- Go to device Settings → Apps → Pokemon App → Permissions
- Enable Microphone permission

### Community Feed Issues:

**"Permission denied" error**
- Check Realtime Database rules in Firebase Console
- Ensure user is logged in
- Verify database URL is correct

**Posts not loading**
- Check internet connection
- Verify Realtime Database is enabled
- Check Firebase Console for any errors

**Real-time updates not working**
- Ensure `@react-native-firebase/database` is installed
- Check Firebase configuration in `google-services.json`

---

## 📱 App Navigation

The app now has 5 tabs:
1. **Pokédex** - Search Pokemon (with voice search)
2. **Hunt** - Find and catch Pokemon on the map
3. **AR** - AR Camera for catching Pokemon
4. **Community** - Share and view discoveries
5. **Profile** - User profile and stats

---

## 🎉 Setup Complete!

Your app now has:
- ✅ Voice search in Pokedex
- ✅ Community feed for sharing discoveries
- ✅ Real-time post updates
- ✅ Like/unlike functionality
- ✅ Post creation with captured Pokemon
