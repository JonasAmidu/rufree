import { app, db, storage } from './firebaseCore';
import { getAuth } from '@firebase/auth';

const auth = getAuth(app);

export { app, auth, db, storage };
