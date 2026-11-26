import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseMoney } from '../utils/money';

export class ProductDetailsPage extends BasePage {
  readonly path = '/inventory-item.html';
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId('inventory-item-name');
    this.description = page.getByTestId('inventory-item-desc');
    this.price = page.getByTestId('inventory-item-price');
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.removeButton = page.getByRole('button', { name: 'Remove' });
    this.backButton = page.getByTestId('back-to-products');
  }

  /**
   * Detail URLs carry the product id as a query string, e.g. `/inventory-item.html?id=5`.
   * The SPA updates the URL *before* it re-renders, so the URL alone is not proof the
   * page is ready; the "Back to products" button only exists on this page.
   */
  override async expectToBeOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
    await expect(this.backButton).toBeVisible();
  }

  async getPrice(): Promise<number> {
    return parseMoney(await this.price.textContent());
  }
}
