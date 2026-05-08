const firebaseConfig = {
  apiKey: 'AIzaSyBzPJ1lD10iSupQyq3Y_3DJMlxiGfWvvcw',
  projectId: 'rufree-c16ed'
};

const createThrowawayUser = async () => {
  const email = `codex.${Date.now()}@example.com`;
  const password = 'TestPass123!';

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Auth signup failed: ${JSON.stringify(data)}`);
  }

  return {
    email,
    password,
    uid: data.localId,
    idToken: data.idToken
  };
};

const saveProfile = async ({ uid, idToken, email }) => {
  const profile = {
    fields: {
      uid: { stringValue: uid },
      email: { stringValue: email },
      displayName: { stringValue: 'Codex Test User' },
      bio: { stringValue: 'Always up for coffee, tennis, and spontaneous dinner plans.' },
      photoUrl: {
        stringValue:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      },
      favoriteActivities: {
        arrayValue: {
          values: [
            { stringValue: 'Coffee Chats' },
            { stringValue: 'Tennis' },
            { stringValue: 'Dinner' }
          ]
        }
      },
      location: {
        mapValue: {
          fields: {
            latitude: { doubleValue: 51.5074 },
            longitude: { doubleValue: -0.1278 }
          }
        }
      }
    }
  };

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${uid}`,
    {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify(profile)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Profile write failed: ${JSON.stringify(data)}`);
  }

  return data;
};

const readActivities = async (idToken) => {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/posts?pageSize=20`,
    {
      headers: {
        authorization: `Bearer ${idToken}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Activity read failed: ${JSON.stringify(data)}`);
  }

  return data.documents || [];
};

const getString = (field) => field?.stringValue || '';
const getDouble = (field) => {
  if (field?.doubleValue !== undefined) return Number(field.doubleValue);
  if (field?.integerValue !== undefined) return Number(field.integerValue);
  return null;
};

const distanceKm = (a, b) => {
  if (!a || !b) return null;

  const r = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const value =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return r * (2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
};

const summarizeActivities = (documents) => {
  const userLocation = { latitude: 51.5074, longitude: -0.1278 };

  return documents.map((document) => {
    const fields = document.fields || {};
    const locationFields = fields.location?.mapValue?.fields || {};
    const activityLocation =
      getDouble(locationFields.latitude) !== null &&
      getDouble(locationFields.longitude) !== null
        ? {
            latitude: getDouble(locationFields.latitude),
            longitude: getDouble(locationFields.longitude)
          }
        : null;

    return {
      id: document.name.split('/').pop(),
      activity: getString(fields.activity),
      locationName: getString(locationFields.name),
      creatorName: getString(fields.creatorName),
      distanceKm: distanceKm(userLocation, activityLocation)
    };
  });
};

const run = async () => {
  const authUser = await createThrowawayUser();
  console.log(
    JSON.stringify(
      {
        stage: 'auth-created',
        email: authUser.email,
        uid: authUser.uid
      },
      null,
      2
    )
  );

  await saveProfile(authUser);
  console.log(
    JSON.stringify(
      {
        stage: 'profile-saved',
        uid: authUser.uid
      },
      null,
      2
    )
  );

  const activityDocuments = await readActivities(authUser.idToken);
  const summary = summarizeActivities(activityDocuments);

  console.log(
    JSON.stringify(
      {
        createdUser: {
          email: authUser.email,
          uid: authUser.uid
        },
        activitiesRead: summary.length,
        nearbyActivities: summary.filter(
          (activity) => typeof activity.distanceKm === 'number' && activity.distanceKm <= 10
        ),
        sampleActivities: summary.slice(0, 5)
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
