# RuFree Project Audit

Generated: 2026-06-12 02:03 Europe/London

## Executive Summary

RuFree is a React Native / Expo application backed by Firebase Auth and Firestore. The app has a coherent mobile-first architecture, a working authentication shell, profile setup/edit flows, nearby discovery, activity creation, and a tested UI/component layer.

Initial validation showed the app could build and pass tests, but it was not release-candidate ready because of public profile privacy risk, frontend dependency advisories, unbounded realtime reads, unreachable settings/safety flows, missing real messaging persistence, and lack of live Firebase workflow validation.

After the first AIDOps operational hardening cycle:

- Frontend tests pass: 16 suites / 43 tests.
- Frontend audit passes: 0 vulnerabilities.
- Backend audit passes: 0 vulnerabilities.
- Expo doctor passes: 18/18 checks.
- Web export succeeds.
- Public user profile writes no longer include email.
- Public location writes are rounded before storage.
- Realtime post/user listeners are bounded.
- Report/block actions are reachable from profile/activity surfaces.
- Settings is reachable from the tab bar and password reset is wired.
- Activity-linked message previews are derived from real joined/hosted activities.
- A dry-run/apply backend helper exists for legacy public profile cleanup.

Current completion estimate: 90%.

## Architecture

- Frontend: Expo SDK 54, React Native 0.81, React 19.
- Backend: Firebase Auth and Firestore rules/indexes. `backend/functions` is currently empty.
- Data model: public user profile documents, activity post documents, report documents, block documents.
- Storage: frontend SDK is wired for future media/file uploads, but Firebase Storage is not part of the RC1 release gate.
- Navigation: auth/profile gate in `frontend/App.js`, tabbed application shell in `frontend/src/navigation/AppTabs.js`.
- State: mostly React component state plus Firestore realtime subscriptions.

Architecture strengths:

- Simple Expo/Firebase stack is appropriate for the prototype and early release.
- Firestore rules are explicit and validate post/profile payload shapes.
- Tests cover main screens, form components, activity feed utilities, and privacy utility.

Architecture weaknesses:

- No server-side worker/functions layer for privacy-preserving discovery, moderation, or messaging.
- Discovery still depends on signed-in reads of public user documents.
- Firestore location search is client-side after bounded reads, not true nearby/geohash querying.
- No crash reporting, analytics, or production monitoring integration.

## Frontend

Implemented:

- Auth screen with email/password sign-in and sign-up.
- Profile setup/editing.
- Home/discovery screen with location, availability, radius filters, nearby people, activities, and activity creation modal.
- Add Activity tab.
- Messages screen shell with empty state.
- Profile screen and settings-oriented components.

Issues:

- Several strings render as mojibake in source for apostrophes and emoji-like labels. This is cosmetic but should be cleaned before store submission.
- Messages screen is not backed by real conversations.
- Settings legal policy copy still requires approval.
- No end-to-end route walkthrough exists with a live Firebase user in this exercise.

## Backend / Database

Implemented:

- Firebase Auth client integration.
- Firestore rules for users, posts, reports, and blocks.
- Firestore index for posts by `createdAt desc`.

Changed in this cycle:

- Removed `email` from public user profile writes.
- Firestore `users/{uid}` create rule no longer allows `email`.
- Public location writes are rounded client-side.
- Posts/users realtime subscriptions are bounded.

Open risks:

- Existing production/test Firestore documents may already contain `email` and exact coordinates. A migration or cleanup plan is required before production launch.
- A cleanup helper exists, but running it requires Firebase Admin credentials and approval.
- No backend functions currently enforce nearby discovery, moderation workflows, notification fanout, or messaging.
- Post reaction counters can still drift under concurrent toggles because client code increments counters while rules validate final array size. This is acceptable for prototype but should move to transaction/function logic.

## APIs

There is no custom HTTP API. The application talks directly to Firebase Auth and Firestore.

Firestore surfaces:

- `users/{uid}` public discovery profile.
- `posts/{postId}` activity feed.
- `reports/{reportId}` write-only reports.
- `blocks/{blockId}` owner-scoped blocks.

## Authentication

Implemented:

- Email/password sign-in and sign-up.
- Auth state gate in `App.js`.
- Profile completion gate.

Needs live validation:

- User sign up against target Firebase project.
- User login against target Firebase project.
- User logout.
- Profile create/read/update.
- Activity create/read/update/join.
- Conversation creation.
- Message send/read.
- Report user/activity.
- Block user.
- Firestore security rules.
- Firestore indexes.

Out of RC1 scope:

- Firebase Storage. Storage is future capability / not required for RC1.

## Build Process

Frontend:

- `npm run test:ci`
- `npm audit --audit-level=moderate`
- `npx expo-doctor`
- `npx expo export --platform web --output-dir dist-web`

Backend:

- `npm audit --audit-level=moderate`

GitHub Actions:

- `.github/workflows/frontend-ci.yml` runs npm ci, Expo doctor, and tests for frontend changes.

## Deployment Process

Documented but not fully release-proven:

- Firestore rules/indexes deploy from repo root with Firebase CLI.
- Expo web export succeeds locally.
- No confirmed Firebase project target or app-store/native build process was validated in this exercise.

## Documentation

Current:

- README has setup, Firebase, and verification instructions.
- This exercise adds project audit, release gap analysis, release plan, QA report, and finalisation report.

Missing:

- Production release checklist.
- Live Firebase validation checklist with known project target.
- Privacy policy and terms copy.
- Incident/support/moderation operating procedure.

## Test Coverage

Measured:

- 16 Jest suites, 43 tests passing.
- Coverage is functional but not coverage-threshold enforced.

Covered:

- Auth form paths.
- Profile setup/edit components.
- Activity composer/feed utility behaviour.
- Main profile/messages/settings UI components.
- Public location rounding helper.

Missing:

- Firestore rules emulator tests.
- Full Auth + Firestore RC1 smoke test with controlled test user.
- E2E route validation.
- Report/block workflow tests.
- Offline/error-state tests for core Firestore reads.

## Issue Priority

Critical:

- Full RC1 Auth + Firestore production project validation not completed.
- Existing Firestore data may contain legacy email/exact location fields; cleanup script exists but has not been run.

High:

- Real activity-linked messaging persistence missing.
- Discovery is bounded but not true geospatial/backend-filtered.
- No crash reporting/analytics.

Medium:

- Legal policy copy incomplete.
- Deployment/runbook is not target-specific.
- Mojibake text cleanup needed.

Low:

- Backend package name typo: `rufare-backend`.
- Empty `backend/functions` directory should either be implemented or removed from release scope.

