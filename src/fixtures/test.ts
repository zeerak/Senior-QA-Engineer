import { test as base, expect } from '@playwright/test';
import {
  CartPage,
  CheckoutCompletePage,
  CheckoutInfoPage,
  CheckoutOverviewPage,
  InventoryPage,
  LoginPage,
  ProductDetailsPage,
} from '../pages';
import { PASSWORD, type Username } from '../data/users';

/**
 * Custom fixtures: tests ask for the page objects they need by name and get a
 * fresh instance bound to the test's isolated browser context. This removes
 * `new XPage(page)` boilerplate from every test and keeps specs declarative.
 */
interface Fixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
  /** Logs in through the UI as the given user and lands on the inventory page. */
  loginAs: (username: Username) => Promise<InventoryPage>;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  productDetailsPage: async ({ page }, use) => use(new ProductDetailsPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutInfoPage: async ({ page }, use) => use(new CheckoutInfoPage(page)),
  checkoutOverviewPage: async ({ page }, use) => use(new CheckoutOverviewPage(page)),
  checkoutCompletePage: async ({ page }, use) => use(new CheckoutCompletePage(page)),

  loginAs: async ({ loginPage, inventoryPage }, use) => {
    await use(async (username) => {
      await loginPage.goto();
      await loginPage.login(username, PASSWORD);
      await inventoryPage.expectToBeOpen();
      return inventoryPage;
    });
  },
});

/** Use in specs that must start logged out (login / session tests). */
export const LOGGED_OUT = { cookies: [], origins: [] };

export { expect };
