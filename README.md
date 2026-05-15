# RuFree

A social networking platform to help people quickly find others who are available to join activities in real time.

## Core Concept
"Are you free?" activity matching.

## Stack Recommendation (Proposed)
- **Frontend:** React Native (Expo) - Single codebase for Web, iOS, and Android.
- **Backend:** Firebase (Firestore/Auth/Functions) - Real-time updates by default, minimal setup time.
- **Styling:** Tailwind CSS (via NativeWind) - For that modern Airbnb/Instagram look.
- **Maps:** Expo Location / Google Maps API.

## Project Structure
```
rufree/
├── backend/        # Firebase functions and configuration
│   ├── functions/  # Cloud Functions
│   └── ...
├── frontend/       # React Native/Expo Application
│   ├── src/        # Source code
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── utils/
│   │   ├── firebase/
│   │   │   └── config.js
│   │   ├── App.js
│   │   └── ...
│   ├── App.js
│   └── ...
├ .gitignore
├── README.md
└── package.json    # (Root level for Expo project)
```

## Setup Instructions

### Frontend
1.  Navigate to `rufree/frontend`
2.  Install dependencies: `npm install`
3.  Start Expo: `npx expo start`
4.  Scan the QR code with the Expo Go app on your device or use an emulator.

### Backend (Firebase Functions)
1.  Navigate to `rufree/backend`
2.  Initialize Firebase functions (if not already done): `firebase init functions`
3.  Implement the Cloud Functions (`createPost`, `getPosts`) in `functions/index.js` (templates provided in the specification).
4.  Deploy the functions: `firebase deploy --only functions`

## Next Steps
-   Implement a "Create Post" screen in the frontend.
-   Wire up the frontend to call the `createPost` Cloud Function.
-   Add real-time updates to the `HomeScreen` using Firestore listeners.
-   Implement Firestore security rules for `users` and `ports` collections.
-   Add user profile management (editing bio, interests, etc.).