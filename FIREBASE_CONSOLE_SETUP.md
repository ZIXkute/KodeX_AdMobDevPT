# Firebase Console Setup Guide 

## 🔥 Firebase Project Configuration

To complete the Firebase backend setup, you need to configure your Firebase project in the Firebase Console.

## 1. Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click **Create database**
5. Choose **Start in test mode** (for development)
6. Select a location close to your users

## 2. Enable Firebase Storage

1. In Firebase Console, go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode** (for development)
4. Select the same location as your Firestore database

## 3. Configure Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Enable **Google** provider
   - Add your app's SHA-1 fingerprint
   - Download the updated `google-services.json`

## 4. Set Up Security Rules

### Firestore Security Rules

Go to **Firestore Database** → **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Captured Pokemon subcollection
      match /capturedPokemon/{pokemonId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Storage Security Rules

Go to **Storage** → **Rules** and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures - users can only access their own
    match /profile_pictures/{userId}_{timestamp} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 5. Test the Setup

### Test User Profile Creation

1. Sign up a new user in your app
2. Check Firestore Database → `users` collection
3. Verify user profile document is created

### Test Pokemon Capture

1. Catch a Pokemon in hunt mode
2. Check Firestore Database → `users/{userId}/capturedPokemon`
3. Verify capture document is saved

### Test Profile Picture Upload (Future)

1. When image picker is enabled, test profile picture upload
2. Check Firebase Storage → `profile_pictures` folder
3. Verify image is uploaded and URL is saved to user profile

## 6. Production Setup

For production deployment:

### Firestore Rules (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /capturedPokemon/{pokemonId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Storage Rules (Production)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile_pictures/{userId}_{timestamp} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == userId &&
                         resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

## 7. Monitoring & Analytics

### Enable Analytics
1. Go to **Analytics** in Firebase Console
2. Enable Google Analytics for your project
3. Monitor user engagement and app usage

### Set Up Performance Monitoring
1. Go to **Performance** in Firebase Console
2. Follow setup instructions for React Native
3. Monitor app performance metrics

## 8. Backup & Recovery

### Firestore Backup
1. Go to **Firestore Database** → **Backup**
2. Set up automated daily backups
3. Configure retention policy

### Storage Backup
- Profile pictures are automatically replicated
- Consider implementing user data export functionality

## 🎯 Verification Checklist

- ✅ Firestore Database enabled and configured
- ✅ Firebase Storage enabled and configured
- ✅ Authentication providers enabled (Email + Google)
- ✅ Security rules configured for both Firestore and Storage
- ✅ App successfully creates user profiles
- ✅ Pokemon captures are saved to Firestore
- ✅ Profile picture upload ready (when image picker enabled)

## 🚨 Important Notes

1. **Test Mode**: Current rules allow all authenticated users to read/write their own data
2. **Production**: Implement stricter validation rules before going live
3. **Costs**: Monitor usage to stay within Firebase free tier limits
4. **Security**: Never expose Firebase config keys in client-side code
5. **Backup**: Set up regular backups for production data

Your Firebase backend is now ready to support the Pokemon AR game! 🎉