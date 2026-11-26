import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The header and burger menu are shared by every page after login, so they are
 * modelled once as a component and composed into the page objects.
 */
export class HeaderComponent {
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly menuButton: Locator;
  readonly allItemsLink: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;
  readonly pageTitle: Locator;

  constructor(private readonly page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    // The <img data-test="open-menu"> is covered by the real <button>, so target the button by role.
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.allItemsLink = page.getByTestId('inventory-sidebar-link');
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetAppStateLink = page.getByTestId('reset-sidebar-link');
    this.pageTitle = page.getByTestId('title');
  }

  /** Opens the cart and waits for it, so callers never read the previous page's DOM. */
  async openCart(): Promise<void> {
    await this.cartLink.click();
    await expect(this.page).toHaveURL(/\/cart\.html$/);
    await expect(this.page.getByTestId('cart-list')).toBeVisible();
  }

  async openMenu(): Promise<void> {
    await this.menuButton.click();
    await expect(this.logoutLink).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.openMenu();
    await this.logoutLink.click();
  }

  async resetAppState(): Promise<void> {
    await this.openMenu();
    await this.resetAppStateLink.click();
  }

  /** Asserts the cart badge count; a count of 0 means the badge is not rendered at all. */
  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toBeHidden();
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }
}
