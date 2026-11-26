# Test Design Document: SauceDemo (Swag Labs) Web Shop

|                            |                                                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Application under test** | [SauceDemo / Swag Labs](https://www.saucedemo.com): a public demo e-commerce web shop maintained by Sauce Labs for automation practice |
| **Test type**              | Functional UI tests (end to end through the browser)                                                                                   |
| **Automation stack**       | Playwright Test + TypeScript, Page Object Model, GitHub Actions CI                                                                     |
| **Browsers**               | Chromium, Firefox, WebKit (Safari engine)                                                                                              |
| **Document scope**         | Test case description, test strategy, rationale, defect log                                                                            |

---

## 1. Application overview and business context

Swag Labs is a small online store. Its core business is to **turn a visitor into a paid order**. Everything else (sorting, product pages, menu actions) supports that one flow.

```
Login ──► Product catalogue ──► Cart ──► Checkout: Your info ──► Checkout: Overview ──► Order complete
            │  sort / details                 (validation)          (price, tax, total)
            └─► Menu: All items · Reset app state · Logout
```

The application ships several **test personas** that simulate faulty builds. Section 5 explains why the suite also runs against them.

| Username                                 | Behaviour                                                      |
| ---------------------------------------- | -------------------------------------------------------------- |
| `standard_user`                          | Healthy build, the reference behaviour                         |
| `locked_out_user`                        | Account is blocked                                             |
| `problem_user`                           | Broken images, sorting and form fields                         |
| `error_user`                             | Errors in cart/checkout actions                                |
| `performance_glitch_user`, `visual_user` | Slowness / visual glitches (designed, not automated; see §6.3) |

---

## 2. Scope

### 2.1 Features in scope (what we test and why)

| #   | Feature                                                                                    | Business relevance                                                                                             |
| --- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| F1  | **Authentication**: login, error handling, logout, protected pages                         | The gate to everything. A broken login means 100% revenue loss, and a broken access check is a security issue. |
| F2  | **Product catalogue**: listing, prices, images, details page                               | Customers can only buy what they can see. Wrong prices are a legal and financial risk.                         |
| F3  | **Sorting**                                                                                | A main discovery aid. Bugs here are visible and hurt trust, but are not blocking.                              |
| F4  | **Shopping cart**: add, remove, badge, persistence, reset                                  | Holds the purchase intent. Losing or corrupting the cart directly loses sales.                                 |
| F5  | **Checkout**: form validation, price/tax/total calculation, order completion, cancel paths | Where money is taken. This is the highest financial impact.                                                    |

### 2.2 Out of scope

| Item                                                        | Reason                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Payment processing, inventory stock, real order persistence | Not implemented by the demo. The payment card and shipping are static text.                                        |
| API / backend tests                                         | SauceDemo is a client-side SPA with no public API. All state lives in a cookie and `localStorage`.                 |
| Load / performance testing                                  | Needs a dedicated tool (k6, JMeter) and an environment we own. Load-testing a shared public demo is inappropriate. |
| Third-party links (Sauce Labs "About", social media)        | External sites outside our control. Covered at most by a link-target check (§6.3).                                 |

---

## 3. Test strategy

### 3.1 Risk-based prioritisation

Every test case gets a priority from **business impact × likelihood of failure**:

| Priority          | Meaning                                             | Examples                                                      | When it runs                                         |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| **P1 (Critical)** | Blocks purchase, loses money, or is a security hole | Login, access control, add to cart, checkout, totals          | Every commit (`@smoke` subset in < 1 min) + full run |
| **P2 (High)**     | Degrades the main journey; a workaround exists      | Sorting, product details, remove from cart, cart persistence  | Every full run                                       |
| **P3 (Medium)**   | Secondary paths and convenience features            | Dismiss error, continue shopping, cancel buttons, reset state | Every full run                                       |

Tags (`@smoke`, `@P1`, `@P2`, `@P3`) are attached to each automated test. A pipeline can run any slice, e.g. `npx playwright test --grep @P1`.

### 3.2 Test design techniques used

| Technique                    | Where applied                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Equivalence partitioning** | Login: valid user / locked user / wrong password / unknown user. Checkout: valid vs. missing data.                                      |
| **Boundary value analysis**  | Cart badge 0 ↔ 1 (the badge must disappear, never show "0"). Cart size of 1 item vs. the whole catalogue (CHK-02). Empty cart (CHK-06). |
| **Decision table**           | Checkout form: which error appears for each combination of empty fields, including "all empty" (validation order).                      |
| **State transition**         | Cart state across add → remove → reload → reset. Session state across login → logout → back button.                                     |
| **Error guessing**           | Case sensitivity of username, browser back after logout, checking out an empty cart.                                                    |
| **Test oracle from data**    | Expected product list, sort orders and totals are _computed_ from one catalogue file, not hard-coded per test.                          |

### 3.3 Coverage types

Every feature is covered with **positive** (happy path), **negative** (invalid input, forbidden action) and **edge** cases (boundaries, persistence, unusual navigation). The Type column in §4 marks each case.

### 3.4 Automation approach

| Decision               | Choice                                                                                                                                                               | Rationale                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tool**               | **Playwright Test** (TypeScript)                                                                                                                                     | Auto-waiting and web-first assertions remove most flakiness without manual sleeps. One API covers Chromium, Firefox **and WebKit**: unlike Cypress it tests real Safari's engine, and multi-tab/multi-context work is first-class. Parallel execution, retries, HTML report, traces, screenshots and video are built in, so no extra framework glue is needed (unlike Selenium). |
| **Language**           | TypeScript (strict)                                                                                                                                                  | Type-safe page objects and test data catch mistakes at compile time, e.g. a typo in a product name or sort option.                                                                                                                                                                                                                                                               |
| **Architecture**       | **Page Object Model** + shared `HeaderComponent`                                                                                                                     | Locators and page behaviour live in one place. A UI change is a one-line fix, and specs read like business scenarios.                                                                                                                                                                                                                                                            |
| **Fixtures**           | Custom Playwright fixtures inject page objects (`{ cartPage, checkoutInfoPage }`) and a `loginAs(user)` helper                                                       | No boilerplate in tests. Each test still gets a fresh, isolated browser context.                                                                                                                                                                                                                                                                                                 |
| **Authentication**     | `setup` project logs in once and saves `storageState`. Feature tests start authenticated.                                                                            | Saves a full UI login in every feature test. Login itself is still tested end to end in `login.spec.ts`.                                                                                                                                                                                                                                                                         |
| **Locators**           | `data-test` attributes (`testIdAttribute: 'data-test'`), plus role/text locators for user-visible actions                                                            | Stable hooks the developers own. Not tied to CSS or layout. Products are found **by their visible name**, the way a user finds them.                                                                                                                                                                                                                                             |
| **Data-driven tests**  | Table-driven loops for negative logins, sorts, totals and form validation                                                                                            | Adding a scenario is one line of data, not a new test body.                                                                                                                                                                                                                                                                                                                      |
| **Test data**          | Centralised in `src/data/*` (users, products, messages, defects)                                                                                                     | Single source of truth. A copy change or price change is one edit.                                                                                                                                                                                                                                                                                                               |
| **Money assertions**   | Integer-cent arithmetic (`src/utils/money.ts`)                                                                                                                       | Avoids floating-point false failures (`0.1 + 0.2 ≠ 0.3`).                                                                                                                                                                                                                                                                                                                        |
| **Known defects**      | Test asserts the **correct** behaviour and is marked `test.fail()` with a defect annotation                                                                          | The suite stays green while the bug is open, and the bug stays visible in the report. When the bug is fixed, the test "unexpectedly passes" and fails the run, so the marker can't be forgotten. Each one was verified to fail **on the intended assertion**, not on an unrelated error.                                                                                         |
| **Debuggability**      | Trace, screenshot and video retained on failure. `test.step()` in the long E2E test.                                                                                 | A failure in CI can be diagnosed from the artifact alone, with no local repro needed.                                                                                                                                                                                                                                                                                            |
| **Flakiness control**  | No fixed waits. Navigation helpers wait for the destination page before reading it. Stability verified with `--repeat-each=5` on 8 parallel workers (201/201 green). |                                                                                                                                                                                                                                                                                                                                                                                  |
| **CI/CD**              | GitHub Actions: type-check → lint → tests on a **3-browser matrix**, HTML + JUnit reports uploaded                                                                   | Every push is verified, and reports are kept for 14 days.                                                                                                                                                                                                                                                                                                                        |
| **Code quality gates** | `tsc --strict`, ESLint with `eslint-plugin-playwright`, Prettier                                                                                                     | Catches missing `await`, focused tests (`.only`) and similar mistakes before review.                                                                                                                                                                                                                                                                                             |

### 3.5 Entry and exit criteria

- **Entry:** the application URL is reachable, test accounts are valid, and the build is deployed to the target environment.
- **Exit:** 100% of P1 tests pass. No new failures in P2/P3 without a logged defect. Every expected failure is linked to an open defect.

---

## 4. Test cases

Conventions: **Pre** = precondition. Unless stated otherwise, the precondition for non-login tests is _"logged in as `standard_user`, cart empty, on the Products page"_. Type: **+** positive, **−** negative, **E** edge.

### 4.1 Authentication (F1): `tests/auth/`

| ID      | Title                                                           | Pri | Type  | Steps                                                                                           | Expected result                                                                                                |
| ------- | --------------------------------------------------------------- | --- | ----- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| AUTH-01 | Valid user can log in                                           | P1  | +     | Pre: logged out, on `/`. 1. Enter `standard_user` / `secret_sauce`. 2. Click **Login**.         | Redirected to `/inventory.html`. Title "Products". Product list is not empty.                                  |
| AUTH-02 | Locked-out user is rejected                                     | P1  | −     | 1. Log in as `locked_out_user` with the valid password.                                         | Error "Epic sadface: Sorry, this user has been locked out." Both fields highlighted. User stays on login page. |
| AUTH-03 | Wrong password is rejected                                      | P1  | −     | 1. Log in as `standard_user` with `wrong_password`.                                             | Error "...Username and password do not match any user in this service". Stays on login page.                   |
| AUTH-04 | Empty username is rejected                                      | P2  | −     | 1. Leave username empty, enter password, click Login.                                           | Error "Epic sadface: Username is required".                                                                    |
| AUTH-05 | Empty password is rejected                                      | P2  | −     | 1. Enter username, leave password empty, click Login.                                           | Error "Epic sadface: Password is required".                                                                    |
| AUTH-06 | Username is case-sensitive                                      | P3  | E     | 1. Log in as `STANDARD_USER` with the valid password.                                           | Rejected with "do not match" error.                                                                            |
| AUTH-07 | Login error can be dismissed                                    | P3  | +     | 1. Click Login with empty fields. 2. Click the **X** on the error.                              | Error disappears and field highlighting is removed.                                                            |
| AUTH-08 | Protected pages require login _(×3: inventory, cart, checkout)_ | P1  | −     | Pre: logged out. 1. Open `/inventory.html`, `/cart.html` or `/checkout-step-one.html` directly. | Login form shown with "You can only access '<path>' when you are logged in."                                   |
| AUTH-09 | Logout ends the session                                         | P1  | + / − | 1. Open menu → **Logout**. 2. Press browser **Back**.                                           | Step 1: login page. Step 2: protected page is **not** shown; the "only access when logged in" error appears.   |
| AUTH-10 | Session survives reload                                         | P3  | E     | 1. On Products, reload the page.                                                                | Still on Products, still logged in (`session-username` cookie = `standard_user`).                              |

### 4.2 Product catalogue and sorting (F2, F3): `tests/inventory/`

| ID     | Title                                                 | Pri | Type | Steps                                                                                         | Expected result                                                                                                                                                  |
| ------ | ----------------------------------------------------- | --- | ---- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INV-01 | Catalogue shows all products correctly                | P1  | +    | 1. Open Products.                                                                             | Exactly 6 products. Each name/price pair matches the catalogue. Every product has an enabled "Add to cart" button and its **own** image.                         |
| INV-02 | Default sort is Name (A→Z) and can be re-selected     | P2  | +    | 1. Observe initial order. 2. Sort Z→A, then A→Z.                                              | Sort dropdown = A→Z and names are alphabetical, both initially and after re-selecting.                                                                           |
| INV-03 | Sort Name (Z→A)                                       | P2  | +    | 1. Select "Name (Z to A)".                                                                    | Names in reverse alphabetical order.                                                                                                                             |
| INV-04 | Sort Price (low→high)                                 | P2  | +    | 1. Select "Price (low to high)".                                                              | Prices ascending ($7.99 … $49.99).                                                                                                                               |
| INV-05 | Sort Price (high→low)                                 | P2  | +    | 1. Select "Price (high to low)".                                                              | Prices descending.                                                                                                                                               |
| INV-06 | Product details match catalogue and allow add-to-cart | P2  | +    | 1. Click "Sauce Labs Fleece Jacket". 2. Click **Add to cart**. 3. Click **Back to products**. | Details show the same name and price ($49.99) and a description. Button turns into "Remove" and the badge shows 1. Back on the list, the product shows "Remove". |

### 4.3 Shopping cart (F4): `tests/cart/`

| ID      | Title                                 | Pri | Type  | Steps                                                              | Expected result                                                                                    |
| ------- | ------------------------------------- | --- | ----- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| CART-01 | Add one product                       | P1  | +     | 1. Add "Sauce Labs Backpack". 2. Open cart.                        | Badge = 1. Button becomes "Remove". Cart contains exactly Backpack at $29.99.                      |
| CART-02 | Add several products                  | P1  | +     | 1. Add Bike Light, Onesie, Red T-Shirt. 2. Open cart.              | Badge = 3. Cart lists the three products with the correct prices.                                  |
| CART-03 | Remove from catalogue page            | P2  | + / E | 1. Add 2 products. 2. Remove one. 3. Remove the other.             | Badge 2 → 1 → **hidden** (never shows "0"). Buttons revert to "Add to cart".                       |
| CART-04 | Remove on cart page                   | P2  | +     | 1. Add Backpack + Fleece Jacket. 2. In cart, remove Backpack.      | Only Fleece Jacket remains. Badge = 1.                                                             |
| CART-05 | Cart persists after reload            | P2  | E     | 1. Add Onesie. 2. Open cart. 3. Reload.                            | Onesie still in cart. Badge = 1.                                                                   |
| CART-06 | Continue Shopping keeps cart          | P3  | +     | 1. Add Bolt T-Shirt. 2. Open cart. 3. Click **Continue Shopping**. | Back on Products. Badge = 1. Bolt T-Shirt shows "Remove".                                          |
| CART-07 | Reset App State fully resets the cart | P3  | E     | 1. Add Backpack. 2. Menu → **Reset App State**.                    | Badge hidden **and** Backpack shows "Add to cart". **Defect DEF-02:** button still shows "Remove". |

### 4.4 Checkout (F5): `tests/checkout/`

| ID     | Title                                                                            | Pri | Type  | Steps                                                                                                                                                                                                   | Expected result                                                                                                                                                               |
| ------ | -------------------------------------------------------------------------------- | --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CHK-01 | End-to-end purchase                                                              | P1  | +     | 1. Add Backpack + Bike Light. 2. Open cart and verify contents. 3. **Checkout**. 4. Enter Jane / Doe / 10001 and **Continue**. 5. Verify overview lists both products. 6. **Finish**. 7. **Back Home**. | Each step lands on the right page. Confirmation "Thank you for your order!" with the dispatch text. Cart badge cleared. Back Home returns to Products.                        |
| CHK-02 | Order totals are correct _(×3: 1 item; 3 items incl. equal prices; all 6 items)_ | P1  | + / E | 1. Add the product set. 2. Proceed to the overview.                                                                                                                                                     | Line prices match the catalogue. **Item total** = Σ prices. **Tax** = 8% of item total, rounded to the cent. **Total** = item total + tax.                                    |
| CHK-03 | Mandatory field validation _(×4)_                                                | P1  | −     | 1. Add a product → checkout. 2. Submit with **first name** / **last name** / **postal code** / **all fields** empty.                                                                                    | Matching error: "Error: First Name is required" / "Last Name…" / "Postal Code…". With all fields empty the first-name error shows (validation order). User stays on step one. |
| CHK-04 | Cancel at information step                                                       | P3  | +     | 1. Add Backpack → checkout. 2. Click **Cancel**.                                                                                                                                                        | Back in cart, Backpack still there.                                                                                                                                           |
| CHK-05 | Cancel at overview step                                                          | P3  | +     | 1. Add Backpack → checkout → enter info. 2. On overview, click **Cancel**.                                                                                                                              | Back on Products. No order placed (badge still 1).                                                                                                                            |
| CHK-06 | Cannot check out an empty cart                                                   | P2  | − / E | 1. With an empty cart, open cart.                                                                                                                                                                       | Checkout is disabled or blocked. **Defect DEF-01:** checkout is enabled and the whole flow completes with no items.                                                           |

### 4.5 Defect detection with faulty personas: `tests/known-defects/`

The same "correct behaviour" checks run against the faulty personas. This proves the suite **catches real regressions**. All four tests are expected failures linked to defects.

| ID     | Title                                              | Pri | Type | Steps                                                                  | Expected result (actual)                                                                                             |
| ------ | -------------------------------------------------- | --- | ---- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| USR-01 | Each product has its own image (`problem_user`)    | P2  | −    | 1. Log in as `problem_user`.                                           | 6 distinct images. **(DEF-03: all 6 show the same 404 image.)**                                                      |
| USR-02 | Sort Z→A works (`problem_user`)                    | P2  | −    | 1. Sort Name (Z to A).                                                 | First product is "Test.allTheThings() T-Shirt (Red)". **(DEF-04: order does not change.)**                           |
| USR-03 | Checkout fields keep their values (`problem_user`) | P1  | −    | 1. Add product → checkout. 2. Type first name "Jane", last name "Doe". | Each field holds its own value. **(DEF-05: typing the last name overwrites the first name; last name stays empty.)** |
| USR-04 | Purchase can be completed (`error_user`)           | P1  | −    | 1. Add product → checkout → info → **Finish**.                         | Order confirmation page. **(DEF-06: Finish does nothing; user stays on overview.)**                                  |

### 4.6 Designed but not automated (yet)

| ID    | Title                                                                      | Pri | Why not automated now / plan                                                                                     |
| ----- | -------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------- |
| NF-01 | `visual_user`: layout matches the baseline                                 | P3  | Needs visual regression baselines per browser. Plan: Playwright `toHaveScreenshot()` with a masked dynamic area. |
| NF-02 | `performance_glitch_user`: login → Products within an SLA (e.g. 3 s)       | P3  | Timing on a shared public site is noisy. Plan: measure via Navigation Timing API in a controlled environment.    |
| NF-03 | Accessibility: no critical WCAG 2.1 AA violations on each page             | P2  | Plan: `@axe-core/playwright` scan per page object.                                                               |
| NF-04 | Checkout input robustness: 255+ chars, Unicode/emoji, `<script>` in fields | P3  | Demo has no backend to persist or render the data, so the risk is low here. High value on a real shop.           |
| NF-05 | Footer social links point to the correct Sauce Labs profiles               | P3  | External sites. Assert `href` only, never navigate.                                                              |
| NF-06 | Responsive layout on mobile viewports                                      | P3  | Plan: add `devices['iPhone 13']` / `Pixel 7` projects and reuse the P1 suite.                                    |

---

## 5. Rationale: why these tests, in this order

1. **Follow the money.** The checkout flow (CHK-01) and price calculation (CHK-02) are P1 because a bug there either blocks revenue or charges the wrong amount, the two worst outcomes for a shop. CHK-02 checks the _maths_, not just that a number appears, and uses three cart sizes because rounding bugs often only show at higher totals or with tied prices.
2. **Protect the gate.** Login (AUTH-01) blocks every user if broken, and the access-control checks (AUTH-08/09) are security requirements. Being able to see `/checkout-step-one.html` without a session, or going "Back" into a logged-out session, is a real-world vulnerability class. Negative login cases are cheap to add because they are data-driven.
3. **Cart integrity next.** The cart carries purchase intent between pages. Add/remove, the badge boundary (1 → 0 must hide the badge) and persistence (reload) are where SPAs commonly lose state.
4. **Discovery features are P2.** Sorting and product details affect conversion but have workarounds, so they are covered thoroughly but rank below the purchase path. Sort expectations are derived from the catalogue so the oracle can't drift.
5. **Secondary paths are P3.** Cancel buttons, error dismissal and reset state are less used but cheap, so they are included for completeness.
6. **Prove the suite can fail.** A green suite only matters if it would turn red on a real bug. Running the same assertions against `problem_user` and `error_user` shows the tests detect broken images, sorting, form-field and order-completion bugs. Defects found on the healthy build (DEF-01, DEF-02) show the design goes beyond the happy path.
7. **Fast feedback, full confidence.** The `@smoke` subset (login, access control, catalogue, add to cart, E2E checkout) gives a go/no-go signal in seconds. The full suite runs in parallel on three browser engines in CI.

### Traceability (feature → tests)

| Feature           | P1                      | P2              | P3              | Defect-detection       |
| ----------------- | ----------------------- | --------------- | --------------- | ---------------------- |
| F1 Authentication | AUTH-01, 02, 03, 08, 09 | AUTH-04, 05     | AUTH-06, 07, 10 | (none)                 |
| F2 Catalogue      | INV-01                  | INV-06          | (none)          | USR-01                 |
| F3 Sorting        | (none)                  | INV-02…05       | (none)          | USR-02                 |
| F4 Cart           | CART-01, 02             | CART-03, 04, 05 | CART-06, 07     | CART-07                |
| F5 Checkout       | CHK-01, 02, 03          | CHK-06          | CHK-04, 05      | CHK-06, USR-03, USR-04 |

**Totals:** 33 designed test cases (27 for the healthy build + 6 non-functional/backlog). 40 automated test executions after data-driven expansion, plus 1 setup step, per browser.

---

## 6. Defect log (found during test design)

| ID     | Severity | User          | Summary                                       | Steps to reproduce                                                                 | Expected                                       | Actual                                               | Test    |
| ------ | -------- | ------------- | --------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- | ------- |
| DEF-01 | Major    | standard_user | Checkout possible with an empty cart          | Log in → open cart without adding items → Checkout → fill info → Continue → Finish | Checkout blocked or disabled                   | Order "completes" with $0.00 and no items            | CHK-06  |
| DEF-02 | Minor    | standard_user | Reset App State leaves stale "Remove" buttons | Add Backpack → Menu → Reset App State                                              | Badge cleared and button back to "Add to cart" | Badge cleared but button still "Remove" until reload | CART-07 |
| DEF-03 | Major    | problem_user  | All product images are the same broken image  | Log in as problem_user                                                             | Each product has its own image                 | All 6 show `sl-404` image                            | USR-01  |
| DEF-04 | Major    | problem_user  | Sorting has no effect                         | Sort Name (Z to A)                                                                 | Reverse alphabetical                           | Order unchanged                                      | USR-02  |
| DEF-05 | Critical | problem_user  | Last name input writes into first name        | Checkout → type Last Name                                                          | Value appears in Last Name                     | First Name overwritten, Last Name empty              | USR-03  |
| DEF-06 | Critical | error_user    | Finish button does not place the order        | Checkout → info → Finish                                                           | Confirmation page                              | Stays on overview, no feedback                       | USR-04  |

> **Note on DEF-01:** the expected behaviour is a business-rule judgement. No shop should accept an order with no items. On a real project this would be confirmed with the product owner before raising the ticket.
