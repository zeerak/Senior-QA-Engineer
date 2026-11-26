import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ORDER_COMPLETE } from '../data/messages';

export class CheckoutCompletePage extends BasePage {
  readonly path = '/checkout-complete.html';
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  async expectOrderConfirmed(): Promise<void> {
    await this.expectToBeOpen();
    await expect(this.header.pageTitle).toHaveText('Checkout: Complete!');
    await expect(this.completeHeader).toHaveText(ORDER_COMPLETE.header);
    await expect(this.completeText).toHaveText(ORDER_COMPLETE.text);
  }
}
