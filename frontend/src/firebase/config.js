import { app, db } from './firebaseCore';
import { getAuth } from '@firebase/auth';

const auth = getAuth(app);

export { app, auth, db };
