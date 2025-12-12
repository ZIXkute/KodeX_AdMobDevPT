# Login Screens Location Guide

This document provides a comprehensive overview of where the login and authentication screens are located in the KodeX_AdMobDevPT repository.

## 📁 Directory Structure

### Primary Location (Organized Structure)
The main, actively used login screens are located in:

```
src/screens/Auth/
├── SignInScreen.tsx    # Main sign-in/login screen
└── SignUpScreen.tsx    # User registration/signup screen
```

**Path:** `/home/runner/work/KodeX_AdMobDevPT/KodeX_AdMobDevPT/src/screens/Auth/`

### Legacy Location (Root Level)
Older versions of the login screens exist at the root level:

```
/
├── LoginScreen.tsx     # Legacy login screen
└── SignupScreen.tsx    # Legacy signup screen
```

**Path:** `/home/runner/work/KodeX_AdMobDevPT/KodeX_AdMobDevPT/`

## 🔑 Authentication-Related Files

### Context and State Management
- **AuthContext.tsx** (root level) - Legacy auth context
- **src/context/AuthContext.tsx** - Current auth context provider

### Services
- **src/services/auth.ts** - Authentication service logic
- **src/firebase/googleSignIn.ts** - Google sign-in integration

### Navigation
- **src/navigation/types.ts** - Navigation type definitions including AuthStackParamList

## 📋 File Details

### Current/Active Login Screens

#### 1. SignInScreen.tsx (`src/screens/Auth/SignInScreen.tsx`)
- **Purpose:** Main login/sign-in screen
- **Features:**
  - Email and password login
  - Google Sign-In integration
  - Navigation to SignUp screen
  - Error handling and loading states
- **Uses:** React Navigation (NativeStackScreenProps)
- **Auth Context:** `src/context/AuthContext.tsx`

#### 2. SignUpScreen.tsx (`src/screens/Auth/SignUpScreen.tsx`)
- **Purpose:** User registration screen
- **Features:**
  - Display name input
  - Email and password registration
  - Password confirmation
  - Error handling and loading states
  - Navigation to SignIn screen
- **Uses:** React Navigation (NativeStackScreenProps)
- **Auth Context:** `src/context/AuthContext.tsx`

### Legacy Login Screens

#### 3. LoginScreen.tsx (Root level)
- **Purpose:** Legacy login screen
- **Features:**
  - Email and password login
  - Google Sign-In with Lottie animations
  - Callback-based navigation
- **Note:** May be deprecated or used in specific contexts

#### 4. SignupScreen.tsx (Root level)
- **Purpose:** Legacy signup screen
- **Features:**
  - Email and password registration
  - Starter Pokémon selection
  - Callback-based navigation
- **Note:** May be deprecated or used in specific contexts

## 🚀 Quick Access Commands

### Navigate to Auth Screens Directory
```bash
cd /home/runner/work/KodeX_AdMobDevPT/KodeX_AdMobDevPT/src/screens/Auth
```

### View All Auth-Related Files
```bash
cd /home/runner/work/KodeX_AdMobDevPT/KodeX_AdMobDevPT
find . -name "*SignIn*" -o -name "*SignUp*" -o -name "*Login*" -o -name "*Auth*" | grep -E "\.(tsx|ts)$"
```

### Search for Login/Auth Code
```bash
cd /home/runner/work/KodeX_AdMobDevPT/KodeX_AdMobDevPT
grep -r "login\|signIn\|authentication" src/ --include="*.tsx" --include="*.ts"
```

## 📝 Related Documentation

The following documentation files contain additional information about authentication:
- `AUTH_README.md` - Authentication setup and configuration
- `FIREBASE_SETUP.md` - Firebase authentication setup
- `FIREBASE_TESTING_CHECKLIST.md` - Testing authentication flows
- `HOW_TO_GET_WEB_CLIENT_ID.md` - Google Sign-In configuration

## 🎯 Recommended Usage

**For new development or modifications:**
- Use the screens in `src/screens/Auth/` directory
- These are properly integrated with React Navigation
- Follow the established patterns in these files

**Legacy files at root level:**
- May be kept for backward compatibility or specific use cases
- Consider migrating any changes to the `src/screens/Auth/` versions

## 🔧 Technology Stack

The login screens use:
- **React Native** - UI framework
- **React Navigation** - Navigation management
- **Firebase Authentication** - Backend authentication
- **Google Sign-In** - Social authentication
- **TypeScript** - Type safety

## 📞 Getting Help

If you need to modify login screens:
1. Check `src/screens/Auth/` first (active development)
2. Review `src/context/AuthContext.tsx` for authentication logic
3. See `src/services/auth.ts` for auth service implementation
4. Consult `AUTH_README.md` for setup instructions
