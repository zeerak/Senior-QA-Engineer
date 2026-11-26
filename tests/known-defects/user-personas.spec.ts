import { test, expect, LOGGED_OUT } from '../../src/fixtures/test';
import { ALL_PRODUCTS, PRODUCTS } from '../../src/data/products';
import { VALID_CUSTOMER } from '../../src/data/checkout';
import { USERS } from '../../src/data/users';
import { DEFECTS, defectAnnotation } from '../../src/data/defects';
import { SORT_OPTIONS } from '../../src/pages';

/**
 * SauceDemo ships "persona" accounts that simulate faulty builds. Running the
 * SAME correct-behaviour checks against them proves the suite actually catches
 * regressions (a test suite that can't fail is worthless). Each test is an
 * expected failure tied to a logged defect.
 */
test.use({ storageState: LOGGED_OUT });

test.describe('Defect detection - faulty user personas', () => {
  test.describe('problem_user', () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs(USERS.problem);
    });

    test(
      'USR-01 each product shows its own image',
      {
        tag: ['@P2'],
        annotation: defectAnnotation(DEFECTS.problemUserImages),
      },
      async ({ inventoryPage }) => {
        test.fail(true, DEFECTS.problemUserImages);
        const images = await inventoryPage.getImageSources();
        expect(new Set(images).size).toBe(ALL_PRODUCTS.length);
      },
    );

    test(
      'USR-02 sorting by Name (Z to A) reorders the list',
      {
        tag: ['@P2'],
        annotation: defectAnnotation(DEFECTS.problemUserSorting),
      },
      async ({ inventoryPage }) => {
        test.fail(true, DEFECTS.problemUserSorting);
        await inventoryPage.sortBy(SORT_OPTIONS.nameDesc);
        await expect(inventoryPage.itemNames.first()).toHaveText(PRODUCTS.redTShirt.name);
      },
    );

    test(
      'USR-03 checkout form keeps each value in its own field',
      {
        tag: ['@P1'],
        annotation: defectAnnotation(DEFECTS.problemUserLastName),
      },
      async ({ inventoryPage, cartPage, checkoutInfoPage }) => {
        test.fail(true, DEFECTS.problemUserLastName);
        await inventoryPage.addToCart(PRODUCTS.backpack.name);
        await inventoryPage.header.openCart();
        await cartPage.checkout();

        await checkoutInfoPage.fillCustomerInfo(VALID_CUSTOMER);

        await expect(checkoutInfoPage.firstNameInput).toHaveValue(VALID_CUSTOMER.firstName);
        await expect(checkoutInfoPage.lastNameInput).toHaveValue(VALID_CUSTOMER.lastName);
      },
    );
  });

  test(
    'USR-04 error_user can complete a purchase',
    {
      tag: ['@P1'],
      annotation: defectAnnotation(DEFECTS.errorUserFinish),
    },
    async ({
      loginAs,
      inventoryPage,
      cartPage,
      checkoutInfoPage,
      checkoutOverviewPage,
      checkoutCompletePage,
    }) => {
      test.fail(true, DEFECTS.errorUserFinish);
      await loginAs(USERS.error);
      await inventoryPage.addToCart(PRODUCTS.backpack.name);
      await inventoryPage.header.openCart();
      await cartPage.checkout();
      await checkoutInfoPage.submit(VALID_CUSTOMER);
      await checkoutOverviewPage.expectToBeOpen();

      await checkoutOverviewPage.finish();

      await checkoutCompletePage.expectOrderConfirmed();
    },
  );
});
