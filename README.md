# SauceDemo UI Test Automation: Playwright + TypeScript

[![Playwright UI tests](../../actions/workflows/playwright.yml/badge.svg)](../../actions/workflows/playwright.yml)

Risk-based UI test design and automation for the **[SauceDemo / Swag Labs](https://www.saucedemo.com)** web shop, built for the _Senior QA Engineer Real Work Challenge_.

| Deliverable                                                        | Where                                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Test design document (test cases, strategy, rationale, defect log) | **[docs/TEST_PLAN.md](docs/TEST_PLAN.md)**                             |
| Automation source code                                             | [`src/`](src) (framework) and [`tests/`](tests) (specs)                |
| CI pipeline                                                        | [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) |

## Highlights

- **33 designed test cases** across authentication, catalogue, sorting, cart and checkout, prioritised P1–P3 by business risk. Positive, negative and edge cases are covered.
- **40 automated tests** (data-driven expansion), running in parallel on **Chromium, Firefox and WebKit**.
- **6 real defects found and logged.** Each one is guarded by an expected-failure test that turns the build red once the bug is fixed.
- Page Object Model, custom fixtures, one-time authenticated `storageState`, `data-test` locators, and integer-cent money assertions.
- Strict TypeScript, ESLint (`eslint-plugin-playwright`) and Prettier quality gates, enforced in CI.

## Project structure

```
.
├── docs/
│   └── TEST_PLAN.md            # Test design: cases, strategy, rationale, defect log
├── src/
│   ├── data/                   # Test data & oracles: users, products, messages, defects
│   ├── fixtures/test.ts        # Custom fixtures: page objects + loginAs()
│   ├── pages/                  # Page Object Model
│   │   ├── components/HeaderComponent.ts
│   │   ├── BasePage.ts  LoginPage.ts  InventoryPage.ts  ProductDetailsPage.ts
│   │   └── CartPage.ts  CheckoutInfoPage.ts  CheckoutOverviewPage.ts  CheckoutCompletePage.ts
│   └── utils/money.ts          # Precise currency parsing / tax maths
├── tests/
│   ├── auth.setup.ts           # Logs in once, saves session for other tests
│   ├── auth/                   # AUTH-01..10  login, access control, logout
│   ├── inventory/              # INV-01..06   catalogue, details, sorting
│   ├── cart/                   # CART-01..07
│   ├── checkout/               # CHK-01..06
│   └── known-defects/          # USR-01..04   faulty-persona defect detection
└── playwright.config.ts
```

Every test title starts with its ID from the test plan (e.g. `CHK-01 customer can buy products end to end`), so results trace straight back to the design.

## Getting started

Requirements: **Node.js 18+**.

```bash
npm ci
npx playwright install          # downloads Chromium, Firefox and WebKit
```

| Command                              | What it does                                |
| ------------------------------------ | ------------------------------------------- |
| `npm test`                           | Full suite on Chromium                      |
| `npm run test:all-browsers`          | Full suite on Chromium + Firefox + WebKit   |
| `npm run test:smoke`                 | `@smoke` subset only (critical path, ~10 s) |
| `npm run test:headed`                | Watch the browser while tests run           |
| `npm run test:ui`                    | Playwright UI mode (time-travel debugging)  |
| `npm run report`                     | Open the last HTML report                   |
| `npm run typecheck` / `npm run lint` | Quality gates                               |

Run a slice by priority or ID:

```bash
npx playwright test --grep @P1
npx playwright test --grep "CHK-0[12]"
```

Configuration via environment variables (optional): `BASE_URL` (defaults to `https://www.saucedemo.com`) and `SAUCE_PASSWORD`.

## Reading the results

- `✓` passed.
- `✘` on a test tagged with a `known defect` annotation is an **expected failure**: the application bug from the defect log is still present. These count as passed in the summary.
- If one of those tests suddenly **passes**, Playwright fails the run ("expected to fail, but passed"). The bug has been fixed, so remove the `test.fail()` marker.
- On a real failure, the HTML report contains a screenshot, video and full trace (`npx playwright show-trace <trace.zip>`).

## Known defects (summary)

| ID     | Summary                                                    | Test    |
| ------ | ---------------------------------------------------------- | ------- |
| DEF-01 | Checkout can be completed with an empty cart ($0.00 order) | CHK-06  |
| DEF-02 | "Reset App State" leaves products showing "Remove"         | CART-07 |
| DEF-03 | problem_user: every product shows the same broken image    | USR-01  |
| DEF-04 | problem_user: sorting has no effect                        | USR-02  |
| DEF-05 | problem_user: typing Last Name overwrites First Name       | USR-03  |
| DEF-06 | error_user: "Finish" does not complete the order           | USR-04  |

Full reproduction steps are in [docs/TEST_PLAN.md §6](docs/TEST_PLAN.md#6-defect-log-found-during-test-design).
