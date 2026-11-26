import { test, expect, LOGGED_OUT } from '../../src/fixtures/test';
import { PASSWORD, USERS } from '../../src/data/users';
import { LOGIN_ERRORS } from '../../src/data/messages';

test.use({ storageState: LOGGED_OUT });

test.describe('Authentication - login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test(
    'AUTH-01 valid user can log in and lands on the product catalogue',
    { tag: ['@smoke', '@P1'] },
    async ({ loginPage, inventoryPage }) => {
      await loginPage.login(USERS.standard, PASSWORD);

      await inventoryPage.expectToBeOpen();
      await expect(inventoryPage.header.pageTitle).toHaveText('Products');
      await expect(inventoryPage.items).not.toHaveCount(0);
    },
  );

  /**
   * AUTH-02..AUTH-06: data-driven negative cases. One test body, many inputs:
   * adding a new negative scenario is a one-line change to this table.
   */
  const invalidLogins = [
    {
      id: 'AUTH-02',
      title: 'locked-out user is rejected',
      username: USERS.lockedOut,
      password: PASSWORD,
      error: LOGIN_ERRORS.lockedOut,
      tags: ['@smoke', '@P1'],
    },
    {
      id: 'AUTH-03',
      title: 'wrong password is rejected',
      username: USERS.standard,
      password: 'wrong_password',
      error: LOGIN_ERRORS.invalidCredentials,
      tags: ['@P1'],
    },
    {
      id: 'AUTH-04',
      title: 'empty username is rejected',
      username: '',
      password: PASSWORD,
      error: LOGIN_ERRORS.usernameRequired,
      tags: ['@P2'],
    },
    {
      id: 'AUTH-05',
      title: 'empty password is rejected',
      username: USERS.standard,
      password: '',
      error: LOGIN_ERRORS.passwordRequired,
      tags: ['@P2'],
    },
    {
      id: 'AUTH-06',
      title: 'username is case-sensitive',
      username: USERS.standard.toUpperCase(),
      password: PASSWORD,
      error: LOGIN_ERRORS.invalidCredentials,
      tags: ['@P3'],
    },
  ];

  for (const { id, title, username, password, error, tags } of invalidLogins) {
    // eslint-disable-next-line playwright/valid-test-tags -- tags come from the typed data table above
    test(`${id} ${title}`, { tag: tags }, async ({ page, loginPage }) => {
      await loginPage.login(username, password);

      await loginPage.expectError(error);
      await loginPage.expectFieldsHighlighted(true);
      await expect(page).toHaveURL(/\/$/); // still on the login page
    });
  }

  test('AUTH-07 login error can be dismissed', { tag: ['@P3'] }, async ({ loginPage }) => {
    await loginPage.login('', '');
    await loginPage.expectError(LOGIN_ERRORS.usernameRequired);

    await loginPage.errorDismissButton.click();

    await loginPage.expectNoError();
    await loginPage.expectFieldsHighlighted(false);
  });
});
