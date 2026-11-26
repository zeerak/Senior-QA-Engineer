import path from 'path';

/** Where the `setup` project stores the authenticated session for reuse. */
export const STORAGE_STATE = path.join(__dirname, '../../.auth/standard_user.json');
