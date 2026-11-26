import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS } from '../../src/data/products';
import { DEFECTS, defectAnnotation } from '../../src/data/defects';

test.describe('Shopping cart', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.header.expectCartCount(0); // every test starts from an empty cart
  });

  test(
    'CART-01 adding a product updates the badge, the button and the cart',
    { tag: ['@smoke', '@P1'] },
    async ({ inventoryPage, cartPage }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name);

      await inventoryPage.header.expectCartCount(1);
      await expect(inventoryPage.removeButton(PRODUCTS.backpack.name)).toBeVisible();

      await inventoryPage.header.openCart();
      await cartPage.expectToBeOpen();
      expect(await cartPage.getLineItems()).toEqual([PRODUCTS.backpack]);
    },
  );

  test(
    'CART-02 multiple products are all listed in the cart with correct prices',
    { tag: ['@P1'] },
    async ({ inventoryPage, cartPage }) => {
      const selection = [PRODUCTS.bikeLight, PRODUCTS.onesie, PRODUCTS.redTShirt];

      await inventoryPage.addToCart(...selection.map((p) => p.name));
      await inventoryPage.header.expectCartCount(selection.length);

      await inventoryPage.header.openCart();
      expect(await cartPage.getLineItems()).toEqual(selection);
    },
  );

  test(
    'CART-03 removing products from the catalogue page updates the badge',
    { tag: ['@P2'] },
    async ({ inventoryPage }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name, PRODUCTS.bikeLight.name);
      await inventoryPage.header.expectCartCount(2);

      await inventoryPage.removeFromCart(PRODUCTS.backpack.name);
      await inventoryPage.header.expectCartCount(1);

      await inventoryPage.removeFromCart(PRODUCTS.bikeLight.name);
      await inventoryPage.header.expectCartCount(0); // badge disappears, never shows "0"
    },
  );

  test(
    'CART-04 removing a product on the cart page removes only that line',
    { tag: ['@P2'] },
    async ({ inventoryPage, cartPage }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name, PRODUCTS.fleeceJacket.name);
      await inventoryPage.header.openCart();

      await cartPage.remove(PRODUCTS.backpack.name);

      expect(await cartPage.getLineItems()).toEqual([PRODUCTS.fleeceJacket]);
      await cartPage.header.expectCartCount(1);
    },
  );

  test(
    'CART-05 cart contents persist across a page reload',
    { tag: ['@P2'] },
    async ({ page, inventoryPage, cartPage }) => {
      await inventoryPage.addToCart(PRODUCTS.onesie.name);
      await inventoryPage.header.openCart();

      await page.reload();

      expect(await cartPage.getLineItems()).toEqual([PRODUCTS.onesie]);
      await cartPage.header.expectCartCount(1);
    },
  );

  test(
    'CART-06 "Continue Shopping" returns to the catalogue with the cart intact',
    { tag: ['@P3'] },
    async ({ inventoryPage, cartPage }) => {
      await inventoryPage.addToCart(PRODUCTS.boltTShirt.name);
      await inventoryPage.header.openCart();

      await cartPage.continueShoppingButton.click();

      await inventoryPage.expectToBeOpen();
      await inventoryPage.header.expectCartCount(1);
      await expect(inventoryPage.removeButton(PRODUCTS.boltTShirt.name)).toBeVisible();
    },
  );

  test(
    'CART-07 "Reset App State" empties the cart and restores every "Add to cart" button',
    {
      tag: ['@P3'],
      annotation: defectAnnotation(DEFECTS.resetStateButtons),
    },
    async ({ inventoryPage }) => {
      test.fail(true, DEFECTS.resetStateButtons);
      await inventoryPage.addToCart(PRODUCTS.backpack.name);

      await inventoryPage.header.resetAppState();

      await inventoryPage.header.expectCartCount(0); // passes - the cart itself is cleared
      await expect(inventoryPage.addToCartButton(PRODUCTS.backpack.name)).toBeVisible(); // fails - DEF-02
    },
  );
});
