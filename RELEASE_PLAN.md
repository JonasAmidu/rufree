# RuFree Release Plan

Generated: 2026-06-12 10:15 Europe/London

## Goal

Move RuFree from locally validated prototype to release-candidate status with RRS >= 90.

## Current State

- Completion estimate: 96%.
- RRS: 96 / 100.
- Build/test/audit/export: passing locally.
- Live Firebase Auth + Firestore validation: passing against `rufree-c16ed`.
- AIDOps release project: `RuFree Release Readiness`.
- AIDOps project id: `project-1781226080958`.

## Board Stages

- Todo
- In Progress
- Blocked
- Testing
- Complete

## Current Board

Complete:

- `rufree-sec-001` Remove private email from public user profiles.
- `rufree-sec-002` Reduce precision of public location writes.
- `rufree-sec-003` Fix frontend dependency advisories.
- `rufree-scale-001` Cap realtime Firestore feed listeners.
- `rufree-mod-001` Add report/block UI workflows.
- `rufree-msg-000` Derive message threads from real joined/hosted activities.
- `rufree-msg-001` Persist plan conversation/message UI and Firestore helpers.

Blocked:

- Firebase Storage is future capability / not required for RC1.

Testing:

- `rufree-data-001` Plan existing user document migration for legacy email/exact location fields.
- `rufree-legal-001` Replace legal/settings coming-soon surfaces.
- `rufree-deploy-001` Document release deployment and Firebase target procedure.

Todo:

- None locally. Remaining non-critical release work is in testing pending data cleanup approval, legal policy copy, or live runtime walkthrough.

## Priority Plan

### 1. Live Firebase validation

Owner role: tester

RC1 scope: Firebase Auth + Firestore only. Firebase Storage is wired for future media/file features but is not required, untested Storage must not block RC1 approval.

Completed:

- Confirmed target Firebase project: `rufree-c16ed`.
- Deployed Firestore rules and conversation feed index.
- Ran sign-up, login, logout.
- Validated profile create/read/update.
- Validated activity create/read/update/join.
- Validated conversation creation.
- Validated message send/read.
- Validated report user/activity.
- Validated block user.
- Validated Firestore security rules.
- Validated Firestore indexes.
- Recorded result in `QA_REPORT.md`.

Only Auth + Firestore passing is required for this stage.

### 2. Legacy data cleanup

Owner role: backend/devops

Needed:

- Backup target Firestore data.
- Identify `users` docs containing `email`.
- Identify `users` docs with high-precision `location`.
- Remove `email` and round/sanitize `location`.
- Verify rules still allow current client workflows.

Requires target Firebase access and destructive-data approval before execution.

### 3. Safety workflows

Owner role: frontend/backend

Needed:

- Add report action to profile/activity cards. Done.
- Add block action for nearby profiles. Done.
- Write unit tests for payloads. Done.
- Add moderation review documentation.

### 4. Messaging MVP

Owner role: backend/frontend

Needed:

- Add `conversations/{conversationId}` and `messages/{messageId}` model.
- Define membership rules.
- Wire messages screen to real Firestore data.
- Add tests for empty/loading/error/thread preview.

Activity-linked thread previews, persisted plan conversation creation, message read subscription, and message sending are complete locally and passed live validation against `rufree-c16ed`.

### 5. Release polish and docs

Owner role: documenter/devops

Needed:

- Add real Terms/Privacy links or copy.
- Wire Firebase password reset. Done.
- Clean mojibake source strings.
- Add release checklist and deployment target notes.

## Validation Command Set

Frontend:

```powershell
cd frontend
npm run test:ci
npm audit --audit-level=moderate
npx expo-doctor
npx expo export --platform web --output-dir dist-web
```

Backend:

```powershell
cd backend
npm audit --audit-level=moderate
```

## Stop Conditions

Continue local implementation until RRS >= 90 unless:

- Target Firebase credentials are required.
- A destructive Firestore migration requires approval.
- Hardware/device testing is required.

Current hard blocker: legacy data cleanup still requires backup and destructive-data approval.
Current RC1 Firebase rule: do not block approval because Storage is disabled or untested.

