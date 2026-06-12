import { getAuth } from '@firebase/auth';
import { app, db, storage } from './firebaseCore';

const auth = getAuth(app);

export { app, auth, db, storage };
