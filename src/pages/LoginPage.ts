import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly path = '/';
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly errorDismissButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByTestId('username');
    this.passwordInput = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
    this.errorDismissButton = page.getByTestId('error-button');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toHaveText(message);
  }

  async expectNoError(): Promise<void> {
    await expect(this.errorMessage).toBeHidden();
  }

  /**
   * The app flags invalid fields with a standalone `error` CSS class (red outline + icon).
   * Note: every input always carries `input_error`, so the match must be on the whole class token.
   */
  async expectFieldsHighlighted(highlighted: boolean): Promise<void> {
    const errorClass = /(^|\s)error(\s|$)/;
    for (const field of [this.usernameInput, this.passwordInput]) {
      if (highlighted) {
        await expect(field).toHaveClass(errorClass);
      } else {
        await expect(field).not.toHaveClass(errorClass);
      }
    }
  }
}
