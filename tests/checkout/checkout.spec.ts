import { test, expect } from '../../src/fixtures/test';
import { ALL_PRODUCTS, PRODUCTS, TAX_RATE, type Product } from '../../src/data/products';
import { VALID_CUSTOMER, type CustomerInfo } from '../../src/data/checkout';
import { CHECKOUT_ERRORS } from '../../src/data/messages';
import { DEFECTS, defectAnnotation } from '../../src/data/defects';
import { calculateTax, sumPrices, toCents } from '../../src/utils/money';

test.describe('Checkout', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test(
    'CHK-01 customer can buy products end to end',
    { tag: ['@smoke', '@P1'] },
    async ({ inventoryPage, cartPage, checkoutInfoPage, checkoutOverviewPage, checkoutCompletePage }) => {
      const order = [PRODUCTS.backpack, PRODUCTS.bikeLight];

      await test.step('add products to the cart', async () => {
        await inventoryPage.addToCart(...order.map((p) => p.name));
        await inventoryPage.header.expectCartCount(order.length);
      });

      await test.step('review the cart and start checkout', async () => {
        await inventoryPage.header.openCart();
        expect(await cartPage.getLineItems()).toEqual(order);
        await cartPage.checkout();
        await checkoutInfoPage.expectToBeOpen();
      });

      await test.step('enter customer information', async () => {
        await checkoutInfoPage.submit(VALID_CUSTOMER);
        await checkoutOverviewPage.expectToBeOpen();
      });

      await test.step('confirm the order overview lists the purchased products', async () => {
        await expect(checkoutOverviewPage.itemNames).toHaveText(order.map((p) => p.name));
        await checkoutOverviewPage.finish();
      });

      await test.step('order is confirmed and the cart is emptied', async () => {
        await checkoutCompletePage.expectOrderConfirmed();
        await checkoutCompletePage.header.expectCartCount(0);
        await checkoutCompletePage.backHomeButton.click();
        await inventoryPage.expectToBeOpen();
      });
    },
  );

  /** CHK-02: price maths is the core business logic of a shop - verified for small, typical and maximum carts. */
  const totalsCases: { label: string; products: Product[] }[] = [
    { label: 'a single low-priced product', products: [PRODUCTS.onesie] },
    {
      label: 'several products incl. equal prices',
      products: [PRODUCTS.boltTShirt, PRODUCTS.redTShirt, PRODUCTS.fleeceJacket],
    },
    { label: 'the entire catalogue', products: [...ALL_PRODUCTS] },
  ];

  for (const { label, products } of totalsCases) {
    test(
      `CHK-02 order totals are correct for ${label}`,
      { tag: ['@P1'] },
      async ({ inventoryPage, cartPage, checkoutInfoPage, checkoutOverviewPage }) => {
        await inventoryPage.addToCart(...products.map((p) => p.name));
        await inventoryPage.header.openCart();
        await cartPage.checkout();
        await checkoutInfoPage.submit(VALID_CUSTOMER);

        const summary = await checkoutOverviewPage.getSummary();
        const expectedSubtotal = sumPrices(products.map((p) => p.price));
        const expectedTax = calculateTax(expectedSubtotal, TAX_RATE);

        expect(summary.itemPrices.sort()).toEqual(products.map((p) => p.price).sort());
        expect(summary.subtotal, 'item total = sum of line prices').toBe(expectedSubtotal);
        expect(summary.tax, `tax = ${TAX_RATE * 100}% of item total`).toBe(expectedTax);
        expect(toCents(summary.total), 'total = item total + tax').toBe(
          toCents(expectedSubtotal) + toCents(expectedTax),
        );
      },
    );
  }

  /** CHK-03: each mandatory field is validated individually, in the order the form checks them. */
  const missingFieldCases: { field: string; info: CustomerInfo; error: string }[] = [
    {
      field: 'first name',
      info: { ...VALID_CUSTOMER, firstName: '' },
      error: CHECKOUT_ERRORS.firstNameRequired,
    },
    {
      field: 'last name',
      info: { ...VALID_CUSTOMER, lastName: '' },
      error: CHECKOUT_ERRORS.lastNameRequired,
    },
    {
      field: 'postal code',
      info: { ...VALID_CUSTOMER, postalCode: '' },
      error: CHECKOUT_ERRORS.postalCodeRequired,
    },
    {
      field: 'all fields',
      info: { firstName: '', lastName: '', postalCode: '' },
      error: CHECKOUT_ERRORS.firstNameRequired,
    },
  ];

  for (const { field, info, error } of missingFieldCases) {
    test(
      `CHK-03 checkout is blocked when ${field} is missing`,
      { tag: ['@P1'] },
      async ({ inventoryPage, cartPage, checkoutInfoPage }) => {
        await inventoryPage.addToCart(PRODUCTS.backpack.name);
        await inventoryPage.header.openCart();
        await cartPage.checkout();

        await checkoutInfoPage.submit(info);

        await checkoutInfoPage.expectError(error);
        await checkoutInfoPage.expectToBeOpen(); // did not advance to the overview
      },
    );
  }

  test(
    'CHK-04 cancelling at the information step returns to the cart with items kept',
    { tag: ['@P3'] },
    async ({ inventoryPage, cartPage, checkoutInfoPage }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.header.openCart();
      await cartPage.checkout();

      await checkoutInfoPage.cancelButton.click();

      await cartPage.expectToBeOpen();
      expect(await cartPage.getLineItems()).toEqual([PRODUCTS.backpack]);
    },
  );

  test(
    'CHK-05 cancelling at the overview step returns to the catalogue without placing the order',
    {
      tag: ['@P3'],
    },
    async ({ inventoryPage, cartPage, checkoutInfoPage, checkoutOverviewPage }) => {
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.header.openCart();
      await cartPage.checkout();
      await checkoutInfoPage.submit(VALID_CUSTOMER);

      await checkoutOverviewPage.cancelButton.click();

      await inventoryPage.expectToBeOpen();
      await inventoryPage.header.expectCartCount(1); // order not placed, cart untouched
    },
  );

  test(
    'CHK-06 checkout cannot be started with an empty cart',
    {
      tag: ['@P2'],
      annotation: defectAnnotation(DEFECTS.emptyCartCheckout),
    },
    async ({ inventoryPage, cartPage }) => {
      test.fail(true, DEFECTS.emptyCartCheckout);
      await inventoryPage.header.openCart();
      await expect(cartPage.items).toHaveCount(0);

      // Expected: checkout is disabled (or blocked) when there is nothing to buy.
      await expect(cartPage.checkoutButton).toBeDisabled(); // fails - DEF-01
    },
  );
});
