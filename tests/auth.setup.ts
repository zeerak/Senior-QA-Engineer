import { test as setup } from '../src/fixtures/test';
import { STORAGE_STATE } from '../src/data/paths';
import { USERS } from '../src/data/users';

/**
 * Runs once before the browser projects. Logs in through the real UI and saves
 * the session so feature tests (inventory, cart, checkout) start authenticated.
 * Login itself is still covered end-to-end by tests/auth/login.spec.ts.
 */
setup('authenticate as standard_user', async ({ page, loginAs }) => {
  await loginAs(USERS.standard);
  await page.context().storageState({ path: STORAGE_STATE });
});
