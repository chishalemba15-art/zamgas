# ZAMGAS Mobile - Google Sign-In Setup Guide

## 📋 Overview

This guide walks you through setting up Google Sign-In for the ZAMGAS mobile app on both Android and iOS.

---

## Part 1: Generate SHA-1 Fingerprints

### For Development (Debug Keystore)

Run this command in your terminal:

```bash
# On macOS/Linux - create debug keystore if it doesn't exist
mkdir -p ~/.android

# Generate a debug keystore
keytool -genkey -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass android -keypass android \
  -dname "CN=Android Debug,O=Android,C=US"

# Get the SHA-1 fingerprint
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android | grep SHA1
```

### For Production (EAS Build)

When you run `eas build`, EAS will generate (or use your uploaded) keystore. You can get the fingerprint:

```bash
eas credentials -p android
```

Then select "Keystore" → "Download" and run:
```bash
keytool -list -v -keystore /path/to/downloaded.keystore -alias key_alias
```

---

## Part 2: Create Google Cloud Credentials

### Step 1: Open Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project or create a new one

### Step 2: Enable Google Sign-In API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Identity Services"
3. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for public apps)
3. Fill in:
   - **App name**: ZAMGAS
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Save and continue

### Step 4: Create OAuth Client IDs

Go to **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**

#### A. Web Application (for Expo Go development)

- **Name**: ZAMGAS Web Client
- **Authorized JavaScript origins**:
  - `https://auth.expo.io`
- **Authorized redirect URIs**:
  - `https://auth.expo.io/@zamgas/zamgas-mobile`

📝 **Save the Client ID** (looks like: `xxx.apps.googleusercontent.com`)

#### B. Android Application

- **Name**: ZAMGAS Android
- **Package name**: `com.zamgas.app`
- **SHA-1 certificate fingerprint**: (paste your SHA-1 from Part 1)

📝 **Save the Client ID**

#### C. iOS Application

- **Name**: ZAMGAS iOS
- **Bundle ID**: `com.zamgas.app`

📝 **Save the Client ID**

---

## Part 3: Configure Your App

### Step 1: Add Environment Variables

Create/update `mobile/.env`:

```env
# Google OAuth Client IDs
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com

# API
EXPO_PUBLIC_API_URL=https://api.zamgas.com
```

### Step 2: Update app.json

Add the Android SHA-1 for EAS builds:

```json
{
  "expo": {
    "android": {
      "package": "com.zamgas.app",
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "bundleIdentifier": "com.zamgas.app",
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

---

## Part 4: Your Credentials Summary

After completing the steps above, you should have:

| Platform | Client ID | Status |
|----------|-----------|--------|
| Web | `_____.apps.googleusercontent.com` | ⬜ Pending |
| Android | `_____.apps.googleusercontent.com` | ⬜ Pending |
| iOS | `_____.apps.googleusercontent.com` | ⬜ Pending |

---

## Next Steps

Once you have the credentials, provide them to me and I will:

1. ✅ Set up the Google Sign-In code in the mobile app
2. ✅ Add the sign-in buttons to login/signup screens
3. ✅ Configure the OAuth flow with your backend

---

## Troubleshooting

### "Invalid Client ID"
- Make sure you're using the correct client ID for each platform
- Web Client ID for Expo Go development
- Android Client ID for Android builds
- iOS Client ID for iOS builds

### "SHA-1 Mismatch"
- Make sure the SHA-1 fingerprint matches your keystore
- For EAS builds, use the EAS-generated keystore SHA-1

### "Redirect URI Mismatch"
- Add `https://auth.expo.io/@your-username/zamgas-mobile` to authorized redirect URIs
