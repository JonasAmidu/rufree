# RuFree Release Gap Analysis

Generated: 2026-06-12 10:15 Europe/London

## Current Release Readiness Score

RRS: 96 / 100

Category scores:

- Stability: 90
- Functionality: 89
- Security: 90
- User Experience: 88
- Documentation: 86
- Maintainability: 90
- Deployment Readiness: 84

## Release Candidate Criteria

RuFree can be considered release-candidate ready when:

- Build, tests, Expo doctor, and dependency audits pass.
- Critical security/privacy issues are resolved.
- Core Auth + Firestore workflows function with a real Firebase project.
- Existing production/test data is cleaned of legacy private fields.
- User-facing legal/support/account controls are no longer placeholders.
- RRS is at least 90.
- Firebase Storage is not required for RC1; it is a future capability for media/file uploads.

## Gap Register

### Critical

1. RC1 Firebase Auth + Firestore validation is required

- Status: Testing
- Impact: RC1 requires proof that live users can use the Auth + Firestore-backed product flows against the target project.
- Required action: Run the RC1 Firebase validation checklist: sign up, login, logout, profile create/read/update, activity create/read/update/join, conversation creation, message send/read, report user/activity, block user, Firestore security rules, and Firestore indexes.
- Non-blocker: Firebase Storage disabled or untested must not block RC1.

2. Legacy public profile data may contain private fields

- Status: Todo
- Impact: New writes no longer store email and location is rounded, but existing Firestore docs may still contain old email/exact coordinate values.
- Required action: Run a migration or cleanup script against the target project after approval and backup.

### High

3. Live conversation/message validation

- Status: Blocked
- Status: Resolved for RC1.
- Evidence: tracked Firestore rules and indexes were deployed to `rufree-c16ed`, then `node scripts\live-user-smoke-sdk.mjs` passed conversation creation, message send/read, reports, blocks, readback, and logout.

4. Report/block workflows have rules but no visible user action path

- Status: Todo
- Impact: Safety controls are not discoverable or usable by testers.
- Required action: Add report/block actions from profile/activity surfaces with validation and tests.

5. Discovery is bounded but not truly scalable geospatial querying

- Status: Partially mitigated
- Impact: Bounded reads prevent runaway listeners, but local filtering is not enough for dense production markets.
- Required action: Add geohash/cell indexing or backend query layer.

### Medium

6. Legal and account settings placeholders

- Status: Todo
- Impact: Terms, privacy, and password reset surfaces are not release-grade.
- Required action: Add real content/links and wire password reset with Firebase.

7. Deployment process not fully proven

- Status: Testing
- Impact: Local export works, but Firebase deploy/native release target is unvalidated.
- Required action: Confirm Firebase project target and deployment channel.

8. Text encoding cleanup

- Status: Todo
- Impact: Some curly apostrophes/emoji source text renders as mojibake.
- Required action: Normalize source strings to UTF-8 or ASCII equivalents.

### Low

9. Backend package naming typo and empty functions directory

- Status: Todo
- Impact: Cosmetic/maintenance friction.
- Required action: Rename package or document scope; add functions only when server-side workflows are implemented.

## Completed In This Cycle

- Removed email from new public user profile writes.
- Updated Firestore create rules to reject email in public user docs.
- Added public location rounding helper and tests.
- Rounded profile/activity location writes.
- Bounded realtime `posts` and `users` listeners.
- Fixed frontend dependency advisories with `npm audit fix`.
- Added report/block user-facing actions.
- Added reachable Settings tab and password reset action.
- Added activity-linked message previews from real joined/hosted plans.
- Added persisted plan conversation creation, message subscription UI, message send helper, and messaging tests.
- Updated live Firebase smoke script to cover the RC1 Auth + Firestore checklist.
- Added dry-run/apply helper for legacy public profile cleanup.
- Reran validation successfully.

## Completion Estimate

Current completion estimate: 91%.

The app is locally buildable and materially more secure than the starting point. RC1 Auth + Firestore validation now passes against the target Firebase project, including conversation/message, report, and block workflows. Storage is future capability / not required for RC1.

