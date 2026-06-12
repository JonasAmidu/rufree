#!/usr/bin/env node

const admin = require('firebase-admin');

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const confirmed = args.has('--confirm-cleanup');

const hasTooMuchPrecision = (value) =>
  typeof value === 'number' && Math.abs(value - Number(value.toFixed(3))) > 0.0000001;

const toPublicCoordinate = (value) =>
  typeof value === 'number' ? Number(value.toFixed(3)) : value;

const buildCleanup = (profile) => {
  const cleanup = {};
  const issues = [];

  if (Object.prototype.hasOwnProperty.call(profile, 'email')) {
    cleanup.email = admin.firestore.FieldValue.delete();
    issues.push('email');
  }

  const location = profile.location;
  if (
    location &&
    (hasTooMuchPrecision(location.latitude) || hasTooMuchPrecision(location.longitude))
  ) {
    cleanup.location = {
      ...location,
      latitude: toPublicCoordinate(location.latitude),
      longitude: toPublicCoordinate(location.longitude)
    };
    issues.push('precise-location');
  }

  return { cleanup, issues };
};

async function main() {
  if (apply && !confirmed) {
    throw new Error('Refusing to modify Firestore without --confirm-cleanup.');
  }

  admin.initializeApp();
  const db = admin.firestore();
  const snapshot = await db.collection('users').get();
  const flagged = [];

  for (const doc of snapshot.docs) {
    const { cleanup, issues } = buildCleanup(doc.data());
    if (!issues.length) {
      continue;
    }

    flagged.push({ id: doc.id, issues });

    if (apply) {
      await doc.ref.set(cleanup, { merge: true });
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        scanned: snapshot.size,
        flagged: flagged.length,
        profiles: flagged
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
