# RuFree

RuFree is a React Native/Expo app for finding nearby people and activity-led plans in real time. The app uses Firebase Auth and Firestore, with profile discovery, live availability, nearby activity posts, and messaging-oriented screens.

## Current Status

- Frontend app lives in `frontend/`.
- Firebase config, Firestore rules, and indexes live at the repo root.
- Backend dependency hygiene lives in `backend/`; `backend/functions/` is currently empty.
- GitHub repo: `https://github.com/JonasAmidu/rufree`

## Features

- Email/password authentication with Firebase Auth.
- Profile setup/editing with required display name and favorite activities.
- Optional bio and photo URL.
- Live "I'm free now" availability toggle.
- Nearby people and activity discovery with radius filters.
- Activity posting with Firestore-compatible timestamps and counters.
- Interest matching and "available now" feed enrichment.
- Firestore security rules for users, posts, reports, and blocks.

## Tech Stack

- Expo SDK 54
- React Native 0.81
- React 19
- Firebase JS SDK 12
- Firestore/Auth
- Jest and `@testing-library/react-native`

## Project Structure

```text
rufree/
  backend/
    functions/
    package.json
    package-lock.json
  frontend/
    assets/
    src/
      components/
      firebase/
      navigation/
      screens/
      utils/
      __tests__/
    App.js
    app.json
    package.json
    package-lock.json
  firebase.json
  firestore.indexes.json
  firestore.rules
  README.md
```

## Frontend Setup

```powershell
cd C:\Users\alish\workspace\rufree\frontend
npm install
npm run start
```

Expo runs on port `8083` by default.

Useful scripts:

```powershell
npm run start:clear
npm run tunnel
npm run web
npm run test:ci
npm run doctor
```

For phone testing with Expo Go, use the Expo QR code or the LAN URL shown by Metro. The last known LAN URL on this machine was:

```text
exp://192.168.0.88:8083
```

## Backend Setup

```powershell
cd C:\Users\alish\workspace\rufree\backend
npm install
npm audit --audit-level=moderate
npm run audit:public-profiles
```

There is no Cloud Functions implementation yet. Add functions under `backend/functions/` when server-side behavior is needed.

`npm run audit:public-profiles` is a dry run that requires Firebase Admin credentials. `npm run cleanup:public-profiles` removes legacy public email fields and rounds legacy public coordinates, and should only be run after backup and approval.

## Firebase

Firestore configuration is tracked in:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`

RC1 Firebase validation depends on Firebase Auth and Firestore only. Firebase Storage is wired in the frontend for future media/file uploads, but Storage is a future capability and is not required for RC1 approval.

RC1 Firebase validation checklist:

- User sign up.
- User login.
- User logout.
- Profile create/read/update.
- Activity create/read/update/join.
- Conversation creation.
- Message send/read.
- Report user/activity.
- Block user.
- Firestore security rules.
- Firestore indexes.

Deploy rules and indexes from the repo root after confirming the Firebase project target:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

Security notes:

- Users can create/update/delete only their own profile.
- Signed-in users can read user profiles and posts for discovery.
- Public user profile writes do not include email.
- Public profile/activity locations are rounded before being stored for discovery.
- Post creation validates creator ownership, allowed fields, location shape, timestamps, tags, and initial counters.
- Post updates are limited to one-user reaction/interested toggles.
- Reports can be created by signed-in users but are not readable from the client.
- Blocks are owner-scoped.

Before launch, audit existing Firestore user documents for legacy email/exact-location fields and clean them after taking a backup. For dense production markets, replace bounded client-side discovery reads with geospatial/backend-filtered queries.

## Verification

Latest verification run:

```powershell
cd C:\Users\alish\workspace\rufree\frontend
npm run test:ci
npm audit --audit-level=moderate
npx expo-doctor
npx expo export --platform web --output-dir dist-web
```

```powershell
cd C:\Users\alish\workspace\rufree\backend
npm audit --audit-level=moderate
```

Expected current results:

- Jest: 16 suites / 43 tests passing.
- Frontend audit: 0 vulnerabilities.
- Backend audit: 0 vulnerabilities.
- Expo Doctor: 18/18 checks passing.
- Web export: succeeds.
