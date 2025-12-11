# Firebase Backend Testing Checklist

## 🧪 Complete Testing Guide for Firebase Integration

### Prerequisites
- ✅ Firebase project configured in Firebase Console
- ✅ Firestore Database enabled
- ✅ Firebase Storage enabled
- ✅ Authentication enabled (Email/Password + Google)
- ✅ Security rules configured

## 1. Authentication Testing

### Email/Password Authentication
- [ ] **Sign Up New User** 
  - Open app → Navigate to Sign Up
  - Enter email and password
  - Verify account creation
  - Check Firebase Console → Authentication → Users

- [ ] **Profile Auto-Creation**
  - After signup, check Firestore Database
  - Navigate to `users` collection
  - Verify user document exists with:
    - `displayName: "Pokémon Trainer"`
    - `email: [user's email]`
    - `createdAt: [timestamp]`
    - `updatedAt: [timestamp]`

- [ ] **Sign In Existing User**
  - Sign out and sign back in
  - Verify profile loads correctly
  - Check profile screen shows user data

### Google Sign-In Authentication
- [ ] **Google Sign-In Flow**
  - Tap "Sign in with Google"
  - Complete Google authentication
  - Verify automatic profile creation

- [ ] **Google Profile Integration**
  - Check Firestore user document includes:
    - `displayName: [Google display name]`
    - `email: [Google email]`
    - `profilePictureUrl: [Google photo URL]`

## 2. User Profile System Testing

### Profile Display
- [ ] **Profile Screen Loading**
  - Navigate to Profile tab
  - Verify profile information displays:
    - Profile picture (Google photo or default)
    - Display name
    - Email address

- [ ] **Statistics Display**
  - Check Pokédex Progress section shows:
    - Total Caught: 0 (initially)
    - Unique Species: 0 (initially)
    - Completion: 0% (initially)

### Profile Editing
- [ ] **Display Name Editing**
  - Tap on display name in profile
  - Change name to "Master Trainer"
  - Tap Save
  - Verify name updates in UI
  - Check Firestore document updated

- [ ] **Profile Picture Placeholder**
  - Tap on profile picture
  - Verify placeholder message appears
  - (Full upload functionality ready for future activation)

## 3. Pokémon Capture System Testing

### Hunt Mode Captures
- [ ] **Quick Catch Testing**
  - Navigate to Hunt tab
  - Start hunting mode
  - Wait for Pokémon to spawn
  - Get within 15m of a Pokémon (green border)
  - Tap Pokémon → Select "Quick Catch"
  - If successful, verify:
    - "Gotcha!" message appears
    - Pokémon disappears from map

- [ ] **Firestore Capture Verification**
  - After successful catch, check Firestore
  - Navigate to `users/{userId}/capturedPokemon`
  - Verify new document with:
    - `pokemonId: [number]`
    - `pokemonName: [string]`
    - `uniqueInstanceId: [unique string]`
    - `capturedAt: [timestamp]`
    - `location: {latitude, longitude}` (if available)
    - `captureMethod: "quick"`

### AR Mode Captures
- [ ] **AR Catch Testing**
  - Find nearby Pokémon (green border)
  - Tap → Select "Enter AR Mode"
  - Wait for Pokémon to auto-spawn in AR
  - Tap "🎯 CATCH" button
  - Verify higher success rate (~80%)

- [ ] **AR Capture Data Verification**
  - Check Firestore capture document includes:
    - `captureMethod: "ar"`
    - All other standard fields

## 4. Profile Statistics Testing

### After Capturing Pokémon
- [ ] **Statistics Updates**
  - Return to Profile tab
  - Tap "🔄 Refresh Data" if needed
  - Verify updated statistics:
    - Total Caught: [increased count]
    - Unique Species: [count of different Pokémon]
    - Completion: [percentage based on 151]

- [ ] **Capture Method Stats**
  - Check "Capture Methods" section shows:
    - Quick Catch: [count]
    - AR Catch: [count]
    - Success rate calculations

- [ ] **Recent Captures Display**
  - Verify "Recent Captures" section shows:
    - Pokémon sprites
    - Pokémon names (capitalized)
    - Capture dates and methods
    - Up to 5 most recent captures

## 5. Data Persistence Testing

### Cross-Session Persistence
- [ ] **Sign Out and Back In**
  - Sign out of the app
  - Sign back in with same account
  - Verify all captured Pokémon still present
  - Check statistics remain accurate

### Real-time Updates
- [ ] **Profile Updates**
  - Make changes in profile (name edit)
  - Navigate away and back
  - Verify changes persist
  - Check Firestore shows updated `updatedAt` timestamp

## 6. Error Handling Testing

### Network Issues
- [ ] **Offline Capture Handling**
  - Turn off internet connection
  - Try to catch Pokémon
  - Verify graceful error handling
  - Turn internet back on
  - Check if data syncs properly

### Authentication Errors
- [ ] **Invalid Credentials**
  - Try signing in with wrong password
  - Verify appropriate error messages
  - Test with invalid email format

## 7. Security Testing

### Data Access Control
- [ ] **User Data Isolation**
  - Create two different user accounts
  - Verify each user only sees their own:
    - Captured Pokémon
    - Profile statistics
    - Recent captures

### Firebase Console Verification
- [ ] **Firestore Security Rules**
  - Check rules prevent cross-user data access
  - Verify authenticated-only access

- [ ] **Storage Security Rules**
  - Verify profile picture access restrictions
  - Check user-specific folder structure

## 8. Performance Testing

### App Responsiveness
- [ ] **Profile Loading Speed**
  - Time profile screen load
  - Verify statistics load quickly
  - Check for smooth UI transitions

### Firebase Query Efficiency
- [ ] **Large Dataset Handling**
  - After capturing multiple Pokémon
  - Verify profile statistics calculate quickly
  - Check recent captures load efficiently

## 9. Integration Testing

### Complete User Journey
- [ ] **End-to-End Flow**
  1. Sign up new user
  2. Navigate to Hunt tab
  3. Catch multiple Pokémon (both quick and AR)
  4. View updated profile statistics
  5. Edit profile information
  6. Sign out and back in
  7. Verify all data persists

## 🎯 Success Criteria

### All Tests Pass ✅
- User authentication working (Email + Google)
- Profile creation and management functional
- Pokémon captures saving to Firestore
- Statistics calculating correctly
- Data persistence across sessions
- Security rules protecting user data
- Error handling graceful and informative

### Firebase Console Verification ✅
- Users collection populated with profiles
- capturedPokemon subcollections contain capture data
- Storage ready for profile pictures
- Security rules active and protecting data

## 🚨 Common Issues & Solutions

### Firebase Connection Issues
- **Problem**: "Firebase not initialized" errors
- **Solution**: Check google-services.json is in android/app/
- **Verification**: Look for Firebase initialization logs

### Authentication Problems
- **Problem**: Google Sign-In fails
- **Solution**: Verify SHA-1 fingerprint in Firebase Console
- **Check**: Ensure webClientId is correct in GoogleSignin.configure()

### Firestore Permission Errors
- **Problem**: "Permission denied" on data access
- **Solution**: Check security rules allow authenticated users
- **Verify**: Rules match user authentication state

### Data Not Syncing
- **Problem**: Captures not appearing in Firestore
- **Solution**: Check network connection and Firebase project ID
- **Debug**: Look for error logs in console

## 📊 Testing Results Template

```
Firebase Backend Testing Results
================================

Authentication:
- Email/Password: ✅/❌
- Google Sign-In: ✅/❌
- Profile Creation: ✅/❌

Pokémon Capture:
- Quick Catch: ✅/❌
- AR Catch: ✅/❌
- Data Persistence: ✅/❌

Profile System:
- Statistics Display: ✅/❌
- Name Editing: ✅/❌
- Data Updates: ✅/❌

Security:
- User Data Isolation: ✅/❌
- Access Control: ✅/❌

Performance:
- Load Times: ✅/❌
- Query Efficiency: ✅/❌

Overall Status: ✅ PASS / ❌ FAIL
```

**Complete this checklist to verify your Firebase backend is fully functional!** 🎉