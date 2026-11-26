import { expect, type Page } from '@playwright/test';
import { HeaderComponent } from './components/HeaderComponent';

/** Common behaviour for every page object: navigation and URL checks. */
export abstract class BasePage {
  /** Path of the page relative to baseURL, e.g. `/inventory.html`. */
  abstract readonly path: string;
  readonly header: HeaderComponent;

  constructor(protected readonly page: Page) {
    this.header = new HeaderComponent(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  async expectToBeOpen(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${escapeRegExp(this.path)}$`));
  }
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
