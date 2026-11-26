import { test, expect } from '../../src/fixtures/test';
import { ALL_PRODUCTS, PRODUCTS } from '../../src/data/products';

test.describe('Inventory - product catalogue', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test(
    'INV-01 catalogue shows every product with its correct name and price',
    { tag: ['@smoke', '@P1'] },
    async ({ inventoryPage }) => {
      await expect(inventoryPage.items).toHaveCount(ALL_PRODUCTS.length);

      const names = await inventoryPage.getProductNames();
      const prices = await inventoryPage.getProductPrices();
      const displayed = names.map((name, i) => ({ name, price: prices[i] }));

      expect(displayed).toEqual(expect.arrayContaining(ALL_PRODUCTS.map((p) => ({ ...p }))));

      // Every card has a usable "Add to cart" button and a real (unique) image.
      for (const product of ALL_PRODUCTS) {
        await expect(inventoryPage.addToCartButton(product.name)).toBeEnabled();
      }
      const images = await inventoryPage.getImageSources();
      expect(new Set(images).size, 'each product should have its own image').toBe(ALL_PRODUCTS.length);
    },
  );

  test(
    'INV-06 product details page matches the catalogue and supports add-to-cart',
    { tag: ['@P2'] },
    async ({ inventoryPage, productDetailsPage }) => {
      const product = PRODUCTS.fleeceJacket;

      await inventoryPage.openProduct(product.name);
      await productDetailsPage.expectToBeOpen();

      await expect(productDetailsPage.name).toHaveText(product.name);
      expect(await productDetailsPage.getPrice()).toBe(product.price);
      await expect(productDetailsPage.description).not.toBeEmpty();

      await productDetailsPage.addToCartButton.click();
      await expect(productDetailsPage.removeButton).toBeVisible();
      await productDetailsPage.header.expectCartCount(1);

      await productDetailsPage.backButton.click();
      await inventoryPage.expectToBeOpen();
      await expect(inventoryPage.removeButton(product.name)).toBeVisible(); // state carried back to the list
    },
  );
});
