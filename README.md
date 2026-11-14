# Renewly

A SvelteKit + TypeScript dashboard for understanding recurring subscriptions: monthly equivalents, annual estimates, upcoming renewal dates, and category spending.

## Run locally

Node.js 22.17 or later and npm (tested with Node 24):

```sh
npm ci
npm run dev
```

```sh
npm run check
npm test
npm run build
npm run preview
```

The static production site is written to `build/`. No API keys or backend are required.

## What works

- Add, edit, pause/resume, delete, and undo the last deletion.
- Search by service name; filter by category/status and sort by renewal, monthly cost, or name.
- See monthly-equivalent spending, annual estimates, next renewals within 30 days, and category bars with text values.
- Save changes in this browser's local storage, with explicit failures when storage cannot be written.
- Export JSON backups; validate and confirm replacement before restoring a backup.
- Start from clearly labeled illustrative data or explicitly start an empty workspace.

Sample amounts are invented examples, not current prices. The app uses INR only and does not convert currencies. There is no bank integration, payment processing, live pricing, notification service, or account sync.

## Calculations

Monthly plans use their entered price; annual plans contribute one-twelfth of their price to the monthly equivalent. Annual estimate is that equivalent multiplied by twelve, not a historical bill total. Paused subscriptions do not contribute to totals or upcoming renewals. Pausing here only changes tracking; it does not cancel your subscription with a provider.

Renewals are calculated from an original billing date using UTC calendar arithmetic. A January 31 plan renews at the end of February and returns to March 31. February 29 annual plans use February 28 in non-leap years. The next-30-days card includes each plan's **next** renewal in the half-open interval today through today + 30 days; it is not a complete cash-flow forecast of every charge in that period.

## Code structure

| File                                          | Responsibility                                              |
| --------------------------------------------- | ----------------------------------------------------------- |
| `src/routes/+page.svelte`                     | Dashboard state, persistence, filters, backup flows         |
| `src/lib/components/SubscriptionForm.svelte`  | Reusable create/edit form                                   |
| `src/lib/components/SubscriptionTable.svelte` | Table and per-row actions                                   |
| `src/lib/components/SpendingSummary.svelte`   | Reactive category breakdown                                 |
| `src/lib/subscriptions.ts`                    | Types, validation, billing dates, calculations, sample data |
| `src/lib/subscriptions.test.ts`               | Calendar, totals, and backup regression tests               |

Svelte 5 `$state` owns interactive state and `$derived` computes totals and filtered views. Browser storage is read after mount so static rendering does not access browser-only APIs. The UI uses native labels, buttons, inputs, focus styles, a skip link, and a horizontally scrollable table on small screens.

## Limitations

Data is stored per browser and origin. Clearing browser data removes it; export a backup first. Multiple tabs do not synchronize edits, so use a single tab to manage a library. There is a 1,000-subscription limit. Automated tests focus on pure business rules; they do not certify accessibility or browser compatibility.

Browser verification covered adding an annual plan, recalculated totals, pause, search, delete/undo, and persistence after reload. The installed tooling currently reports four low-severity audit entries stemming from its transitive `deepmerge` dependency; no high or critical advisories remain. Recheck upstream fixes before deployment.

## References

- [Svelte reactive state](https://svelte.dev/docs/svelte/$state)
- [Derived values](https://svelte.dev/docs/svelte/$derived)
- [SvelteKit project structure](https://svelte.dev/docs/kit/project-structure)
