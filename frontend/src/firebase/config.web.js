import { getAuth } from '@firebase/auth';
import { app, db } from './firebaseCore';

const auth = getAuth(app);

export { app, auth, db };
