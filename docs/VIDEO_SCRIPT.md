# Live Coding Video: Recording Guide

A plan for the screen recording (target **10–15 minutes**). It automates **two test cases from the test plan** on camera, exactly as written:

| #   | Test case                                                      | Why this one                                                                                                         |
| --- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | **AUTH-02** Locked-out user is rejected (P1, negative)         | Short and clear. Shows negative testing and the page-object + fixture pattern.                                       |
| 2   | **CHK-01** Customer can buy products end to end (P1, positive) | The most business-critical flow. Shows multi-page orchestration, `test.step`, and verifying outcomes at every stage. |

The framework (page objects, fixtures, data) is already in the repo. On camera you **walk through it briefly, then write the two specs from scratch**.

---

## Before you hit record

```bash
git clone <your repo> && cd <repo>
npm ci && npx playwright install
npm test                         # sanity check: everything green
```

Create a clean starting point for the recording:

```bash
git checkout -b live-coding
mkdir -p tests/live
```

You'll write the two tests in a **new file** `tests/live/live-coding.spec.ts`, so the existing versions in `login.spec.ts` / `checkout.spec.ts` stay as reference. Close them so they aren't visible while you type.

Screen setup: VS Code (font size 16+), a terminal panel, and `docs/TEST_PLAN.md` open in a preview tab. Turn off notifications.

---

## Part 1: Intro (≈1 min)

> "Hi, I'm ___. For this challenge I chose **Playwright with TypeScript** and the **SauceDemo** web shop. Playwright gives me auto-waiting, three browser engines including WebKit from one API, and built-in tracing and parallelism. SauceDemo has a realistic purchase flow and faulty user personas, so I can show the tests catch real defects."

## Part 2: Walk through the test design (≈2–3 min)

Open `docs/TEST_PLAN.md` and scroll through:

1. **Scope:** five features ranked by business impact (§2.1).
2. **Risk-based priorities:** P1 = blocks purchase, loses money, or is a security issue (§3.1).
3. **Techniques:** equivalence partitioning, boundaries, state transitions (§3.2).
4. **Test cases:** point at **AUTH-02** and **CHK-01** (§4.1, §4.4): _"these are the two I'll automate live."_
5. **Defect log:** _"while designing I found six defects, including checkout with an empty cart."_ (§6)

## Part 3: Tour the framework (≈2 min)

- `playwright.config.ts`: `testIdAttribute: 'data-test'`, the `setup` project that logs in once, three browser projects, traces on failure.
- `src/pages/LoginPage.ts`: _"locators live in page objects; tests only express intent."_
- `src/fixtures/test.ts`: _"fixtures inject page objects, so there's no `new LoginPage(page)` boilerplate."_
- `src/data/`: _"users, products and error messages in one place; the catalogue is the test oracle."_

## Part 4: Live coding test 1, AUTH-02 (≈3 min)

Say: _"AUTH-02: precondition, logged out. Steps: log in as locked_out_user with the valid password. Expected: the locked-out error, fields highlighted, still on the login page."_

Type:

```ts
import { test, expect, LOGGED_OUT } from '../../src/fixtures/test';
import { PASSWORD, USERS } from '../../src/data/users';
import { LOGIN_ERRORS } from '../../src/data/messages';
import { PRODUCTS } from '../../src/data/products';
import { VALID_CUSTOMER } from '../../src/data/checkout';

test.describe('Live coding', () => {
  test.describe('logged out', () => {
    // AUTH-02 precondition: no session, so override the shared storageState
    test.use({ storageState: LOGGED_OUT });

    test('AUTH-02 locked-out user is rejected', { tag: ['@P1'] }, async ({ page, loginPage }) => {
      // Step 1: open the login page and log in as the locked-out user
      await loginPage.goto();
      await loginPage.login(USERS.lockedOut, PASSWORD);

      // Expected: specific error, both fields flagged, user stays on the login page
      await loginPage.expectError(LOGIN_ERRORS.lockedOut);
      await loginPage.expectFieldsHighlighted(true);
      await expect(page).toHaveURL(/\/$/);
    });
  });
```

Talking points while typing:

- _"I assert the **exact** message, not just 'an error is visible', so a wrong error is also caught."_
- _"The URL check proves the user wasn't let in; that's the actual business rule."_

Run it:

```bash
npx playwright test tests/live --project=chromium --headed -g AUTH-02
```

## Part 5: Live coding test 2, CHK-01 (≈4–5 min)

Say: _"CHK-01 is the revenue path. Precondition: logged in, empty cart. The setup project already saved a session, so this test starts on the catalogue."_ Read the steps from the plan.

Continue in the same file:

```ts
  test('CHK-01 customer can buy products end to end', { tag: ['@smoke', '@P1'] }, async ({
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    const order = [PRODUCTS.backpack, PRODUCTS.bikeLight];

    await test.step('add products to the cart', async () => {
      await inventoryPage.goto();
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
  });
});
```

Talking points:

- _"Each `test.step` maps to a step in the written test case, so the report reads like the test plan."_
- _"I verify state at **every** page transition, not just the final page. If it breaks, I know exactly where."_
- _"Cart contents are compared to the catalogue data, so name **and** price are both checked."_
- _"No `waitForTimeout` anywhere: Playwright's web-first assertions retry until the condition is met."_

Run both, then show the report:

```bash
npx playwright test tests/live --project=chromium --headed
npx playwright test tests/live          # all three browsers, in parallel
npm run report
```

In the HTML report, open CHK-01 and expand the steps.

## Part 6: Show it catching a defect (≈1–2 min, recommended)

Run the defect-detection suite:

```bash
npx playwright test tests/known-defects --project=chromium
```

> "These run the **same correct-behaviour checks** against faulty user personas. They fail as expected (broken images, broken sorting, a form field that overwrites another, a Finish button that does nothing), which proves the suite catches real regressions. They're marked `test.fail` with a defect ID: the build stays green while the bug is open, and goes red to remind us once it's fixed."

Optionally, show a real failure: temporarily change `PRODUCTS.backpack.price` to `30.99` in `src/data/products.ts`, run CHK-01, show the readable diff and the screenshot in the report, then revert.

## Part 7: Wrap-up (≈30 s)

> "To summarise: 33 designed test cases prioritised by business risk, 40 automated tests across three browsers in CI, and six defects found. Next steps would be visual regression for `visual_user`, accessibility scans with axe, and mobile viewports, all listed in the plan. Thanks for watching."

---

## Recording and submission checklist

- [ ] Record with OBS / Loom / Windows Game Bar (Win + Alt + R). 1080p, microphone on.
- [ ] Upload to **YouTube as "Unlisted"** (not Private) or to Vimeo/Loom with public link access.
- [ ] Open the link in an **incognito window** to confirm anyone can watch it.
- [ ] Make the GitHub repository **public** and open it in incognito too.
- [ ] Optional: commit `tests/live/live-coding.spec.ts` to the repo so reviewers can see the code from the video.
- [ ] Paste both links into the submission box, e.g.:

```
Video: https://youtu.be/XXXXXXXX
GitHub: https://github.com/<user>/<repo>
Test design document: https://github.com/<user>/<repo>/blob/main/docs/TEST_PLAN.md
```
