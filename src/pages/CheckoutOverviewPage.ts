import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { parseMoney } from '../utils/money';

export interface OrderSummary {
  itemPrices: number[];
  subtotal: number;
  tax: number;
  total: number;
}

/** Checkout step two: order overview with price breakdown. */
export class CheckoutOverviewPage extends BasePage {
  readonly path = '/checkout-step-two.html';
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.getByTestId('cart-list').getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
    this.cancelButton = page.getByTestId('cancel');
  }

  async getSummary(): Promise<OrderSummary> {
    await this.expectToBeOpen();
    await expect(this.totalLabel).toBeVisible();
    return {
      itemPrices: (await this.itemPrices.allTextContents()).map(parseMoney),
      subtotal: parseMoney(await this.subtotalLabel.textContent()),
      tax: parseMoney(await this.taxLabel.textContent()),
      total: parseMoney(await this.totalLabel.textContent()),
    };
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}
