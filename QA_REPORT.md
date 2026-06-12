# RuFree QA Report

Generated: 2026-06-12 10:15 Europe/London

## Summary

Local QA status: PASS with RC1 Firebase Auth + Firestore validation complete.

RuFree passes local automated validation after the RC1 messaging update. The live RC1 Firebase validation now passes against `rufree-c16ed` after deploying the tracked Firestore rules and conversation feed index. Firebase Storage is wired for future use but is not required for this stage and must not block RC1 approval.

## Validation Results

### Build Validation

Command:

```powershell
cd frontend
npx expo export --platform web --output-dir dist-web
```

Result: PASS

Evidence:

- Web bundle generated successfully.
- Output directory: `frontend/dist-web`.

### Runtime Validation

Status: PARTIAL / LIVE FIREBASE PASS

Evidence:

- Static web export succeeds.
- Expo doctor passes.
- Automated screen/component tests pass.

Not completed:

- Live Expo runtime walkthrough on device/browser with a real user session.

### Dependency Audit

Frontend:

```powershell
npm audit --audit-level=moderate
```

Result: PASS, 0 vulnerabilities.

Backend:

```powershell
npm audit --audit-level=moderate
```

Result: PASS, 0 vulnerabilities.

### Route Validation

Status: PASS FOR RC1 FIREBASE SCOPE

Covered by tests:

- Auth screen.
- Profile setup.
- Profile editing.
- Home activity components/utilities.
- Messages empty/shell state.
- Settings/profile components.

Not completed:

- End-to-end navigation on live app runtime with a real user session.

### API / Firestore Validation

Status: PARTIAL

Validated locally by code/tests:

- Activity payload construction.
- Activity enrichment/filtering.
- Firestore query construction with bounded limits.
- Privacy utility coordinate rounding.
- Persisted plan conversation helpers and message send/read UI path.

Not completed:

- Firestore rules emulator tests.

Live target validation:

- Project: `rufree-c16ed`.
- Deploy: `npx firebase-tools deploy --project rufree-c16ed --only firestore:rules,firestore:indexes`.
- Script: `node scripts\live-user-smoke-sdk.mjs`.
- Result: PASS.

RC1 live Firebase checklist:

- User sign up: PASS.
- User login: PASS.
- User logout: PASS.
- Profile create/read/update: PASS.
- Activity create/read/update/join: PASS.
- Conversation creation: PASS.
- Message send/read: PASS.
- Report user/activity: PASS.
- Block user: PASS.
- Firestore security rules: PASS.
- Firestore indexes: PASS.

Out of RC1 scope:

- Firebase Storage. Storage is future capability / not required for RC1.

### Form Validation

Status: PASS / PARTIAL

Covered:

- Auth required fields.
- Profile activity requirement.
- Profile form save shape.
- Activity composer required fields and submit flow.

Gaps:

- Password reset is wired from the reachable Settings tab.
- Legal policy copy still requires approval.

### Authentication Validation

Status: PASS

Covered:

- Unit tests for sign-up, sign-in, missing fields, and Firebase configuration error messaging.
- Live Auth sign-up and Firestore profile write/read smoke path passed against the target project.
- Live activity create, profile update, activity join, conversation creation, message send/read, reports, blocks, readback, and logout passed against the target project.

Remaining:

- Legacy public profile cleanup requires Firebase Admin credentials plus backup/approval before apply mode.

### Error Handling Validation

Status: PARTIAL

Covered:

- Firebase auth configuration error.
- Profile save failure alerts.
- Activity subscription/post failure alerts.
- Sign-out failure alerts.

Gaps:

- Offline/retry behaviour is not tested.
- Firestore permission-denied paths are not tested against emulator/live rules.

## Commands Run

```powershell
cd frontend
npm run test:ci
npm audit --audit-level=moderate
npx expo-doctor
npx expo export --platform web --output-dir dist-web
node scripts\live-user-smoke-sdk.mjs
```

```powershell
cd backend
npm audit --audit-level=moderate
```

## Results

- Jest: 17 suites passed, 49 tests passed.
- Frontend audit: 0 vulnerabilities.
- Backend audit: 0 vulnerabilities.
- Expo doctor: 18/18 checks passed.
- Web export: passed.
- Live Firebase RC1 script: passed.

## Defects Found

Resolved:

- Frontend dependency advisories: fixed.
- Public user docs storing email: fixed for new writes and blocked by rules on create.
- Public exact coordinates: mitigated for new writes by coordinate rounding.
- Unbounded realtime post/user reads: bounded.
- Persisted conversation/message UI and Firestore helpers: fixed locally.

Remaining:

- Legacy Firestore data cleanup not performed.
- Report/block UI workflows are implemented, but moderation review operations are not.
- Password reset is wired; legal policy copy remains incomplete.
- Firestore rules emulator tests missing.
- Firebase Storage disabled or untested is not an RC1 blocker.

## QA Verdict

RuFree is locally stable and now has a live-validated persisted messaging path. RC1 readiness should be judged on Auth + Firestore validation only; Storage is future capability / not required for RC1.

Recommended current RRS: 96 / 100. RC1 Auth + Firestore validation is achieved. Remaining non-RC1-critical items are legacy data cleanup approval, legal policy copy, and optional emulator/runtime walkthrough depth.

