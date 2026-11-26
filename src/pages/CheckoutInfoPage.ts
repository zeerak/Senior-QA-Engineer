import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { CustomerInfo } from '../data/checkout';

/** Checkout step one: "Your Information". */
export class CheckoutInfoPage extends BasePage {
  readonly path = '/checkout-step-one.html';
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.errorMessage = page.getByTestId('error');
  }

  async fillCustomerInfo(info: CustomerInfo): Promise<void> {
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.postalCodeInput.fill(info.postalCode);
  }

  async submit(info: CustomerInfo): Promise<void> {
    await this.fillCustomerInfo(info);
    await this.continueButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toHaveText(message);
  }
}
