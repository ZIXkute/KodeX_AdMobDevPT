# Production Deployment Guide

## 🚀 Firebase Backend Production Deployment

### Overview
This guide covers deploying your Pokémon AR game with Firebase backend to production, including security hardening, performance optimization, and monitoring setup.

## 1. Firebase Project Setup for Production

### Create Production Firebase Project
1. **Separate Production Project**
   - Create new Firebase project for production
   - Use naming convention: `pokemon-ar-prod`
   - Keep development project separate: `pokemon-ar-dev`

2. **Enable Required Services**
   - Firestore Database (production mode)
   - Firebase Storage
   - Authentication (Email/Password + Google)
   - Firebase Analytics
   - Performance Monitoring

### Configure Production Authentication
1. **Google Sign-In Setup**
   - Generate production SHA-1 fingerprint
   - Add to Firebase Console → Authentication → Sign-in method → Google
   - Download production `google-services.json`

2. **Email/Password Configuration**
   - Set up email verification requirements
   - Configure password reset templates
   - Set up custom email templates

## 2. Security Hardening

### Production Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == userId &&
                         isValidUserData(resource.data);
      
      // Captured Pokemon subcollection
      match /capturedPokemon/{pokemonId} {
        allow read, write: if request.auth != null && 
                           request.auth.uid == userId &&
                           isValidPokemonData(resource.data);
      }
    }
  }
  
  // Validation functions
  function isValidUserData(data) {
    return data.keys().hasAll(['displayName', 'email', 'createdAt', 'updatedAt']) &&
           data.displayName is string &&
           data.displayName.size() <= 50 &&
           data.email is string &&
           data.email.matches('.*@.*\\..*');
  }
  
  function isValidPokemonData(data) {
    return data.keys().hasAll(['pokemonId', 'pokemonName', 'uniqueInstanceId', 'capturedAt']) &&
           data.pokemonId is number &&
           data.pokemonId >= 1 && data.pokemonId <= 151 &&
           data.pokemonName is string &&
           data.captureMethod in ['quick', 'ar'];
  }
}
```

### Production Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures with size and type restrictions
    match /profile_pictures/{userId}_{timestamp} {
      allow read, write: if request.auth != null && 
                         request.auth.uid == userId &&
                         resource.size < 5 * 1024 * 1024 && // 5MB limit
                         resource.contentType.matches('image/.*');
    }
  }
}
```

## 3. Environment Configuration

### Production Environment Variables
Create `.env.production` file:
```
FIREBASE_PROJECT_ID=pokemon-ar-prod
FIREBASE_API_KEY=your-production-api-key
FIREBASE_AUTH_DOMAIN=pokemon-ar-prod.firebaseapp.com
FIREBASE_STORAGE_BUCKET=pokemon-ar-prod.appspot.com
GOOGLE_SIGN_IN_WEB_CLIENT_ID=your-production-web-client-id
```

### Build Configuration
Update `android/app/build.gradle`:
```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
            signingConfig signingConfigs.release
        }
    }
}
```

## 4. Performance Optimization

### Firestore Query Optimization
1. **Create Composite Indexes**
   - For user's captured Pokémon queries
   - For statistics calculations
   - For recent captures with ordering

2. **Implement Pagination**
   ```typescript
   // Paginated recent captures
   static async getCapturedPokemonPaginated(
     uid: string,
     limit: number = 10,
     lastDoc?: any
   ): Promise<{ pokemon: CapturedPokemon[], lastDoc: any }> {
     let query = firestore()
       .collection(USERS_COLLECTION)
       .doc(uid)
       .collection(CAPTURED_POKEMON_COLLECTION)
       .orderBy('capturedAt', 'desc')
       .limit(limit);
     
     if (lastDoc) {
       query = query.startAfter(lastDoc);
     }
     
     const snapshot = await query.get();
     const pokemon = snapshot.docs.map(doc => ({
       ...doc.data(),
       capturedAt: doc.data().capturedAt?.toDate() || new Date(),
     })) as CapturedPokemon[];
     
     return {
       pokemon,
       lastDoc: snapshot.docs[snapshot.docs.length - 1]
     };
   }
   ```

### Storage Optimization
1. **Image Compression**
   - Implement client-side image compression
   - Use WebP format for better compression
   - Generate multiple sizes (thumbnail, full)

2. **CDN Configuration**
   - Enable Firebase Storage CDN
   - Configure cache headers
   - Implement image lazy loading

## 5. Monitoring & Analytics

### Firebase Analytics Setup
1. **Custom Events**
   ```typescript
   import analytics from '@react-native-firebase/analytics';
   
   // Track Pokemon captures
   await analytics().logEvent('pokemon_captured', {
     pokemon_id: pokemonId,
     pokemon_name: pokemonName,
     capture_method: captureMethod,
     user_level: userLevel,
   });
   
   // Track user engagement
   await analytics().logEvent('profile_viewed', {
     total_captured: totalCaptured,
     completion_percentage: completionPercentage,
   });
   ```

2. **Performance Monitoring**
   ```typescript
   import perf from '@react-native-firebase/perf';
   
   // Monitor capture performance
   const trace = await perf().startTrace('pokemon_capture');
   try {
     await PokemonService.capturePokemon(uid, pokemonData);
     trace.putAttribute('success', 'true');
   } catch (error) {
     trace.putAttribute('success', 'false');
     trace.putAttribute('error', error.message);
   } finally {
     await trace.stop();
   }
   ```

### Crashlytics Integration
1. **Install Crashlytics**
   ```bash
   npm install @react-native-firebase/crashlytics
   ```

2. **Error Tracking**
   ```typescript
   import crashlytics from '@react-native-firebase/crashlytics';
   
   // Log non-fatal errors
   crashlytics().recordError(new Error('Pokemon capture failed'));
   
   // Set user context
   crashlytics().setUserId(user.uid);
   crashlytics().setAttributes({
     total_captured: totalCaptured.toString(),
     user_level: userLevel.toString(),
   });
   ```

## 6. Backup & Recovery

### Automated Backups
1. **Firestore Backup**
   - Set up daily automated backups
   - Configure retention policy (30 days)
   - Test restore procedures

2. **Storage Backup**
   - Enable versioning for profile pictures
   - Set up lifecycle policies
   - Monitor storage usage

### Data Export Functionality
```typescript
// User data export for GDPR compliance
export class DataExportService {
  static async exportUserData(uid: string): Promise<any> {
    const userProfile = await UserService.getUserProfile(uid);
    const capturedPokemon = await PokemonService.getCapturedPokemon(uid);
    
    return {
      profile: userProfile,
      capturedPokemon,
      exportDate: new Date().toISOString(),
    };
  }
}
```

## 7. Security Monitoring

### Firebase Security Rules Testing
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Test security rules
firebase emulators:start --only firestore
firebase firestore:rules:test --test-suite=security-tests
```

### Rate Limiting
```javascript
// Firestore rules with rate limiting
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow write: if request.auth != null && 
                   request.auth.uid == userId &&
                   request.time > resource.data.lastUpdate + duration.value(1, 's');
    }
  }
}
```

## 8. Deployment Checklist

### Pre-Deployment
- [ ] Production Firebase project configured
- [ ] Security rules updated and tested
- [ ] Environment variables configured
- [ ] Analytics and monitoring enabled
- [ ] Backup systems configured
- [ ] Performance optimizations implemented

### Release Build
- [ ] Generate signed APK/AAB
- [ ] Test on multiple devices
- [ ] Verify Firebase connections
- [ ] Test authentication flows
- [ ] Validate data persistence

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify user registrations
- [ ] Monitor Firebase usage
- [ ] Set up alerts for issues

## 9. Scaling Considerations

### Database Scaling
1. **Sharding Strategy**
   - Consider user-based sharding for large user bases
   - Implement regional data distribution
   - Plan for read replicas

2. **Query Optimization**
   - Monitor slow queries
   - Implement caching strategies
   - Use Firestore bundles for static data

### Storage Scaling
1. **CDN Integration**
   - Use Firebase Storage CDN
   - Implement regional storage buckets
   - Monitor bandwidth usage

2. **Cost Optimization**
   - Implement storage lifecycle policies
   - Monitor usage patterns
   - Optimize image sizes

## 10. Maintenance & Updates

### Regular Maintenance Tasks
1. **Weekly**
   - Monitor error rates and performance
   - Check Firebase usage and costs
   - Review user feedback and issues

2. **Monthly**
   - Update security rules if needed
   - Review and optimize queries
   - Analyze user engagement metrics

3. **Quarterly**
   - Security audit and penetration testing
   - Performance optimization review
   - Backup and recovery testing

### Update Procedures
1. **Firebase SDK Updates**
   - Test in development environment first
   - Monitor for breaking changes
   - Update security rules if needed

2. **Feature Rollouts**
   - Use Firebase Remote Config for feature flags
   - Implement gradual rollouts
   - Monitor metrics during rollouts

## 🎯 Production Success Metrics

### Performance Targets
- App startup time: < 3 seconds
- Pokemon capture save time: < 1 second
- Profile load time: < 2 seconds
- 99.9% uptime

### User Experience Metrics
- Authentication success rate: > 95%
- Pokemon capture success rate: > 80%
- Profile picture upload success: > 90%
- User retention: > 70% after 7 days

### Technical Metrics
- Firebase costs: < $100/month for 10k users
- Storage usage: < 1GB per 1k users
- Database reads: < 100k per day per 1k users
- Error rate: < 1% of all operations

**Your Pokemon AR game is now ready for production deployment with a robust, scalable Firebase backend!** 🚀