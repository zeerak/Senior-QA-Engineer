import { test, expect } from '../../src/fixtures/test';
import { ALL_PRODUCTS, type Product } from '../../src/data/products';
import { SORT_OPTIONS, type SortOption } from '../../src/pages';

/**
 * INV-02..INV-05: the expected order is derived from the catalogue oracle
 * rather than hard-coded, so the tests stay correct if products or prices change.
 */
const namesOf = (products: readonly Product[]) => products.map((p) => p.name);
const pricesOf = (products: readonly Product[]) => products.map((p) => p.price);
const byName = (a: Product, b: Product) => a.name.localeCompare(b.name);
const byPrice = (a: Product, b: Product) => a.price - b.price;

const NAME_A_TO_Z = namesOf([...ALL_PRODUCTS].sort(byName));

/**
 * Two products share a price ($15.99) and the app does not define a tie-breaker,
 * so price sorts are verified on the price sequence, not on product names.
 */
const priceSortCases: { id: string; label: string; option: SortOption; expectedPrices: number[] }[] = [
  {
    id: 'INV-04',
    label: 'Price (low to high)',
    option: SORT_OPTIONS.priceAsc,
    expectedPrices: pricesOf([...ALL_PRODUCTS].sort(byPrice)),
  },
  {
    id: 'INV-05',
    label: 'Price (high to low)',
    option: SORT_OPTIONS.priceDesc,
    expectedPrices: pricesOf([...ALL_PRODUCTS].sort(byPrice).reverse()),
  },
];

test.describe('Inventory - sorting', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test(
    'INV-02 default sort is Name (A to Z) and can be re-selected',
    { tag: ['@P2'] },
    async ({ inventoryPage }) => {
      await expect(inventoryPage.sortSelect).toHaveValue(SORT_OPTIONS.nameAsc);
      await expect(inventoryPage.itemNames).toHaveText(NAME_A_TO_Z);

      await inventoryPage.sortBy(SORT_OPTIONS.nameDesc);
      await inventoryPage.sortBy(SORT_OPTIONS.nameAsc);

      await expect(inventoryPage.itemNames).toHaveText(NAME_A_TO_Z);
    },
  );

  test(
    'INV-03 sorting by Name (Z to A) reverses the alphabetical order',
    { tag: ['@P2'] },
    async ({ inventoryPage }) => {
      await inventoryPage.sortBy(SORT_OPTIONS.nameDesc);

      await expect(inventoryPage.sortSelect).toHaveValue(SORT_OPTIONS.nameDesc);
      await expect(inventoryPage.itemNames).toHaveText([...NAME_A_TO_Z].reverse());
    },
  );

  for (const { id, label, option, expectedPrices } of priceSortCases) {
    test(
      `${id} sorting by ${label} orders the products by price`,
      { tag: ['@P2'] },
      async ({ inventoryPage }) => {
        await inventoryPage.sortBy(option);

        await expect(inventoryPage.sortSelect).toHaveValue(option);
        expect(await inventoryPage.getProductPrices()).toEqual(expectedPrices);
      },
    );
  }
});
