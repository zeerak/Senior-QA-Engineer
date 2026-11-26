import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseMoney } from '../utils/money';
import type { Product } from '../data/products';

export class CartPage extends BasePage {
  readonly path = '/cart.html';
  readonly cartList: Locator;
  readonly items: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartList = page.getByTestId('cart-list');
    this.items = this.cartList.getByTestId('inventory-item');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  item(productName: string): Locator {
    return this.items.filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  async remove(productName: string): Promise<void> {
    await this.item(productName).getByRole('button', { name: 'Remove' }).click();
  }

  /** Reads every cart line as { name, price } so it can be compared to the catalogue oracle. */
  async getLineItems(): Promise<Product[]> {
    await this.expectToBeOpen();
    await expect(this.cartList).toBeVisible();
    const lines: Product[] = [];
    for (const row of await this.items.all()) {
      lines.push({
        name: (await row.getByTestId('inventory-item-name').textContent()) ?? '',
        price: parseMoney(await row.getByTestId('inventory-item-price').textContent()),
      });
    }
    return lines;
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
