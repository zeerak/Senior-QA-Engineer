import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseMoney } from '../utils/money';

export const SORT_OPTIONS = {
  nameAsc: 'az',
  nameDesc: 'za',
  priceAsc: 'lohi',
  priceDesc: 'hilo',
} as const;

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

export class InventoryPage extends BasePage {
  readonly path = '/inventory.html';
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemImages: Locator;
  readonly sortSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemImages = this.items.locator('img.inventory_item_img');
    this.sortSelect = page.getByTestId('product-sort-container');
  }

  /** A single product card, located by its visible name (how a user finds it). */
  item(productName: string): Locator {
    return this.items.filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  addToCartButton(productName: string): Locator {
    return this.item(productName).getByRole('button', { name: 'Add to cart' });
  }

  removeButton(productName: string): Locator {
    return this.item(productName).getByRole('button', { name: 'Remove' });
  }

  async addToCart(...productNames: string[]): Promise<void> {
    for (const name of productNames) {
      await this.addToCartButton(name).click();
      await expect(this.removeButton(name)).toBeVisible();
    }
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.removeButton(productName).click();
    await expect(this.addToCartButton(productName)).toBeVisible();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async openProduct(productName: string): Promise<void> {
    await this.item(productName).getByTestId('inventory-item-name').click();
    await expect(this.page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
  }

  /**
   * `allTextContents()` / `evaluateAll()` do not auto-wait, so make sure the list
   * has rendered before taking a snapshot of it.
   */
  private async waitForProducts(): Promise<void> {
    await this.expectToBeOpen();
    await expect(this.items.first()).toBeVisible();
  }

  async getProductNames(): Promise<string[]> {
    await this.waitForProducts();
    return this.itemNames.allTextContents();
  }

  async getProductPrices(): Promise<number[]> {
    await this.waitForProducts();
    return (await this.itemPrices.allTextContents()).map(parseMoney);
  }

  async getImageSources(): Promise<string[]> {
    await this.waitForProducts();
    return this.itemImages.evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src') ?? ''));
  }
}
