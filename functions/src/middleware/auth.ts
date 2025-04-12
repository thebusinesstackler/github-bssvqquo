import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const validateFirebaseIdToken = async (req: functions.https.Request, res: functions.Response, next: Function) => {
  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer '))) {
    functions.logger.error('No Firebase ID token was passed');
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split('Bearer ')[1];
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req['user'] = decodedToken;
    next();
    return;
  } catch (error) {
    functions.logger.error('Error while verifying Firebase ID token:', error);
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }
};