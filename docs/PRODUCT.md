# Kivora: private, personal event planning

Kivora is an account-free celebration planner. The public website serves application code; each browser profile stores its own plans under `kivora.local.v1` in localStorage. There is no planner API, public event database, invitation delivery, or sharing endpoint. Existing Supabase integration scaffolding remains in the repository but is not used to store planner records.

## Everyday workflows

- Start an event from scratch or choose a dinner, birthday, wedding, or community template. Template tasks and budget categories are editable; prices and deadlines are not fabricated.
- Browse, search, and filter all events; edit their details or duplicate their structure with fresh tasks and no copied guest/contact lists.
- Add, edit, complete, search, filter, and remove tasks. Track planned/actual budgets, guests and RSVP status, vendor quotes, run sheets, notes, and local team contacts.
- Search across the workspace with Cmd/Ctrl K. Event and section URLs restore on reload.
- Use the month calendar or monthly agenda; export all dated events and unfinished tasks to an ICS file. Export guest records as spreadsheet-safe CSV or print the current event section.
- Choose light, dark, or system appearance; plum, forest, or ocean accents; compact or comfortable spacing; dashboard modules; workspace/display names; default currency; regional number/date formats; and the first day of the week.
- Download a JSON backup and restore it after validation and an explicit replacement confirmation. Deletions can be undone until the next data change or reload.

## Privacy boundaries

Data is private to the browser profile **and website origin**, not an authenticated person. Anyone with access to that same profile can read the records, including through browser developer tools. Local storage and downloaded backup files are not encrypted. Different devices, profiles, domains, preview deployment URLs, and `localhost` versus `127.0.0.1` have separate workspaces. Use export/restore to move plans to the stable production domain. Clearing site data or ending private browsing may remove plans.

No account is required. There is no cross-device sync, remote collaboration, access-control enforcement for role labels, public RSVP page, or external AI model. The planning assistant uses local rules. Hosting providers may keep standard request logs, but planner records are not sent to the server. Vercel response headers restrict connections to the same origin and prohibit embedding and unneeded device capabilities.

## Development and validation

```sh
npm ci
npm run dev
npm run check
npm run build
npm audit
```

The supported runtime is Node.js 22. The production build uses the Vercel Nitro preset. Deploy to the linked Vercel project with `vercel --prod`; the framework builds on the target platform. Do not force-push or rewrite published history because this repository is connected to Lovable.

The route delegates to focused planner components. `src/lib/planner.ts` owns schemas, migration, templates, calendar/CSV exports, and region-aware formatting. Storage errors preserve unreadable originals, and a pre-write comparison detects changes from another tab. Restore accepts at most 10 MB and validates every record, date, amount, and ID before modifying current data.

Regression tests cover old-data migration, malformed imports, calendar/CSV correctness, browser-local initialization, template creation, optional-field persistence, cross-event task completion, editing, search, deep links, preferences, Copilot targeting, storage conflicts, and undo. Accessibility checks use axe in jsdom; color contrast, actual screen-reader behavior, and touch ergonomics require browser/manual review.

## Evaluation evidence and limits

| Area          | Evidence                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Code quality  | Typed feature modules, shared validation/export functions, formatted code, CI typechecking and linting.                                          |
| Security      | Browser-local records; validated imports; escaped CSV/ICS; React text escaping; conservative deployment headers; dependency audit.               |
| Efficiency    | No planner network round-trips, small portable records, direct updates, system fonts, CSS illustrations, bounded imports.                        |
| Testing       | Unit and interaction regressions plus accessibility checks and a production build in CI.                                                         |
| Accessibility | Labeled controls, skip link, focus indicators, modal focus management, mobile menu keyboard handling, reduced-motion support, responsive layout. |
| User needs    | No sign-in, private browser workspace, customizable appearance and region, complete local planning workflows, portable backups.                  |

No external evaluation score is guaranteed. Regional formats are supported, but the interface is currently English. The application is designed for personal workspaces, not arbitrarily large datasets or secure multi-user collaboration.
