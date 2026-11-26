/**
 * Defects found while designing the tests. Tests covering them assert the
 * CORRECT behaviour and are marked `test.fail()`, so:
 *   - the suite stays green while the bug is open (an "expected failure"), and
 *   - the moment the bug is fixed the test "unexpectedly passes" and Playwright
 *     turns the run red, prompting us to remove the marker.
 * This keeps known bugs visible in the report instead of silently skipped.
 */
export const DEFECTS = {
  emptyCartCheckout: 'DEF-01: Checkout can be completed with an empty cart',
  resetStateButtons: 'DEF-02: "Reset App State" empties the cart but leaves products showing "Remove"',
  problemUserImages: 'DEF-03: problem_user - every product shows the same broken image',
  problemUserSorting: 'DEF-04: problem_user - sorting has no effect on the product list',
  problemUserLastName: 'DEF-05: problem_user - typing in Last Name overwrites First Name',
  errorUserFinish: 'DEF-06: error_user - "Finish" does not complete the order',
} as const;

export const defectAnnotation = (description: string) => ({ type: 'known defect', description });
