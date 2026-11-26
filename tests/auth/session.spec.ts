import { test, expect, LOGGED_OUT } from '../../src/fixtures/test';
import { USERS } from '../../src/data/users';
import { LOGIN_ERRORS } from '../../src/data/messages';

test.describe('Authentication - session & access control', () => {
  test.describe('when logged out', () => {
    test.use({ storageState: LOGGED_OUT });

    const protectedPaths = ['/inventory.html', '/cart.html', '/checkout-step-one.html'];

    for (const path of protectedPaths) {
      test(
        `AUTH-08 protected page ${path} cannot be opened without logging in`,
        { tag: ['@smoke', '@P1'] },
        async ({ page, loginPage }) => {
          await page.goto(path);

          await loginPage.expectError(LOGIN_ERRORS.notLoggedIn(path));
          await expect(loginPage.loginButton).toBeVisible();
        },
      );
    }
  });

  test(
    'AUTH-09 logout ends the session and protected pages are no longer reachable',
    { tag: ['@P1'] },
    async ({ page, inventoryPage, loginPage }) => {
      await inventoryPage.goto();
      await inventoryPage.expectToBeOpen();

      await inventoryPage.header.logout();
      await expect(loginPage.loginButton).toBeVisible();

      // Browser "back" / direct URL must not resurrect the session.
      await page.goBack();
      await loginPage.expectError(LOGIN_ERRORS.notLoggedIn('/inventory.html'));
    },
  );

  test('AUTH-10 session survives a page reload', { tag: ['@P3'] }, async ({ page, inventoryPage }) => {
    await inventoryPage.goto();
    await page.reload();
    await inventoryPage.expectToBeOpen();
    await expect(inventoryPage.items).not.toHaveCount(0);
    expect((await page.context().cookies()).find((c) => c.name === 'session-username')?.value).toBe(
      USERS.standard,
    );
  });
});
