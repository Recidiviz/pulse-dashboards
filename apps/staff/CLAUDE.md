# CLAUDE.md — apps/staff

Guidance for working in the Staff Dashboard. Inherits from the repo root `CLAUDE.md`; this file only covers what's specific to or non-obvious about this app.

> See also: `apps/staff/README.md` (long-form, human-targeted) for environment variable definitions, deploy process, Auth0 setup, and E2E test runbooks.

## Product areas (one app, four products)

The staff app bundles four loosely-coupled products that share auth, routing, and design system but have separate stores, data sources, and code locations. **Be explicit about which product you're working in** — patterns rarely transfer cleanly.

| Product       | Code location                                                                | Backend / data source                                        | State                             |
| ------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------- |
| **Workflows** | `src/WorkflowsStore/` (incl. `Opportunity/`, `Task/`), `src/core/Workflows*` | Firestore (direct) + Recidiviz API                           | `WorkflowsStore`                  |
| **Insights**  | `src/InsightsStore/`, `src/core/Insights*`                                   | tRPC → `@sentencing/server`-style backend                    | `InsightsStore`                   |
| **Pathways**  | `src/core/` (most non-Insights/Workflows views)                              | Node/Express (`~staff-shared-server`) + Python (Case Triage) | `CoreStore`                       |
| **Lantern**   | `src/lantern/`                                                               | Node/Express (`~staff-shared-server`)                        | `RootStore` (Lantern-only stores) |

Lantern is a separate dashboard surfaced under the same app shell. Don't import Lantern code from `core/` or vice versa — they have parallel store trees.

## Store hierarchy

State is MobX. The tree is rooted in `src/RootStore/`:

- `RootStore` → owns `UserStore`, `TenantStore`, `APIStore`, `AnalyticsStore`, `PageStore`
- `WorkflowsRootStore` → owns `WorkflowsStore`, `JusticeInvolvedPersonsStore`, `OpportunityConfigurationStore`
  - `WorkflowsStore` → owns `WorkflowsTasksStore` (`Task/WorkflowsTasksStore.ts`), the caseload-level store for supervision tasks
- `InsightsStore` → owns API client + per-page presenters
- `CoreStore` (`src/core/CoreStore/`) → owns `FiltersStore`, `MetricsStore`, `VitalsStore` (Pathways)
- `FirestoreStore` (`src/FirestoreStore/`) → centralized Firestore reads/writes for Workflows
- `FilterStore` (`src/FilterStore/`) → Lantern filters (separate from `CoreStore/FiltersStore`)

**Pattern: Store → Presenter → Component (MVP).** Presenters are sidekicks for a single component, owning view-specific logic (data prep, event handlers, per-view hydration) so components stay thin and stores stay flat. Foundational rules:

- **1:1 with the component.** Sharing a presenter across views, or passing one deep through the tree, is a smell — usually the component or presenter has too many responsibilities.
- **Wire with `withPresenterManager`.** Standard helper that constructs the presenter from props/hooks, handles hydration, and ties lifecycle to the component mount/unmount. Use the nonstandard path only when the standard one really doesn't fit.
- **Skip presenters for trivial views.** Rule of thumb: if the logic isn't worth unit-testing, it isn't worth a presenter. For _complex_ views, decompose the component first — a presenter won't clean up a messy view.
- **New views should add a presenter** rather than reading from stores directly. Most existing presenters live in `<Store>/presenters/`.

**Hydration:** Prefer hydrating per-view (in the presenter) rather than per-store — views show a loading state while they hydrate, and per-view boundaries keep stores flat. Stores/presenters that load remote data implement `Hydratable` and are wrapped in a hydrator (`hydrators/`, `~hydration-utils`); don't render dependent UI before hydration succeeds.

## Tenant configs

Per-state config lives in `src/tenants/US_*.ts` (one file per state). Each exports a `TenantConfig` controlling feature availability, copy overrides, search system config, methodology URLs, etc. `TenantStore` (`src/RootStore/TenantStore/`) selects the active config based on the user's tenant.

When adding a state-specific feature, the change usually spans:

1. The state's tenant config (`src/tenants/US_XX.ts`)
2. The feature itself (workflow opportunity, insights metric, etc.)
3. (Sometimes) a new entry in `RootStore/TenantStore/pathwaysTenants.ts`

## Feature gating: three mechanisms, don't confuse them

- **`src/flags.ts`** (legacy) — environment-keyed booleans evaluated at build time. Existing usage is mostly the Pathways metric-backend swap. Don't reach for this for new feature gating; use a feature variant or tenant config instead.
- **Feature variants** — per-user toggles managed via Firestore + Auth0. Use for staged rollouts and user-specific access. New variants must be documented; `tools/verifyFeatureVariantDocumentation.ts` enforces this in CI.
- **Tenant configs** — per-state availability (above). Use for things that differ by jurisdiction.

## Workflows opportunities

Each opportunity (e.g. compliant reporting, supervision level downgrade) is a class extending `OpportunityBase`, organized per-state under `src/WorkflowsStore/Opportunity/Us<State>/<OpportunityName>/`. Each typically contains:

- The opportunity class itself
- A `*ReferralRecord.ts` with the Zod schema for the Firestore record
- A `Forms/` subdirectory if the opportunity has a fillable form
- Fixtures in `__fixtures__/`

Adding a new opportunity also requires registering it in `opportunityConstructors.ts` and the relevant state's tenant config.

> For Opportunity Base vs. Config, data flow, schema rules, forms, and the repeated-eligibility-span footgun: see `src/WorkflowsStore/CLAUDE.md`.

## Tasks

Tasks (supervision contacts, assessments, home visits, etc.) are a separate Workflows feature that mirrors the Opportunity layout. Logic lives in `src/WorkflowsStore/Task/`:

- `Task.ts` — abstract base class (`Task<TaskType>`) for a single task
- `TasksBase.ts` — per-person aggregate of tasks for a Client
- `WorkflowsTasksStore.ts` — caseload-level store, owned by `WorkflowsStore`
- `types.ts` — `SupervisionTaskType`, `SupervisionTask`, `SupervisionTaskRecord`
- Per-state subclasses under `US_ID/`, `US_MO/`, `US_ND/`, `US_NE/`, `US_TX/` (e.g. `UsIdHomeVisitTask.ts`)
- `fixtures/` for unit-test data only (offline mode uses `apps/staff/tools/fixtures/` — see below)

Caseload-level presenters: `src/WorkflowsStore/presenters/CaseloadTasksPresenter.ts` (and `V2`).
View components: `src/core/WorkflowsTasks/`, `src/core/WorkflowsTasksRoutePlanner/`, `src/core/TasksHydrator/`.
Firestore record types are in `~datatypes`.

Per-state task availability is gated via `workflowsTasksConfig` in the tenant config (`src/tenants/US_*.ts`), and `tasks` must be listed in the tenant's `workflows` navigation array to surface the page.

## Where to put new code

- New shared component → `~design-system` if generic, `src/core/` if Pathways/Insights/Workflows-shared. **Avoid `src/components/`** — it's the legacy shared dir; new additions there are discouraged.
- New page-level component for a product → that product's directory under `src/core/` (e.g. `src/core/InsightsStaffPage/`)
- New Workflows opportunity → `src/WorkflowsStore/Opportunity/Us<State>/<Name>/` + register in `opportunityConstructors.ts` + tenant config
- New Workflows task → `src/WorkflowsStore/Task/US_<State>/Us<State><Name>Task.ts` + tenant `workflowsTasksConfig`
- New presenter → conventions vary by store. Insights collects them under `<Store>/presenters/`; elsewhere presenters are usually colocated with the component they back.
- New constant/util used by one product → that product's directory; cross-product → `src/utils/`
- Don't add to `src/lantern/` unless you're explicitly working on Lantern — it's effectively in maintenance mode

## Offline / fixture mode

`nx offline staff` runs the app against the Firebase emulator + static fixtures, no auth required. The emulator imports fixtures from `tools/fixtures/` automatically at startup. After editing fixture sources, stop `nx offline staff` and run `nx update-workflows-fixture staff` to regenerate the import, then restart — `nx update-workflows-fixture staff` will fail while the emulator is running.

`apps/staff/__mocks__/` and per-store `__fixtures__/` directories are for unit tests, not the offline runtime — don't conflate them.

## E2E tests: two frameworks

- **Cucumber** (`src/cucumber/`, run via WebdriverIO) — Lantern, login, users, workflows. Legacy.
- **Playwright** (`e2e/`) — Insights and any new tests.

Prefer Playwright for new tests. Workflows Cucumber tests run against `nx offline staff`; login/Lantern Cucumber tests run against `nx dev staff` with `env_e2e` loaded.

## Backends quick reference

| Concern                   | Backend                                | Run locally with                                                  |
| ------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Workflows reads/writes    | Firestore (direct from frontend)       | Firebase emulator (`nx offline staff`)                            |
| Insights                  | tRPC over HTTP                         | mocked in offline; staging in `nx dev staff`                      |
| Pathways metrics (legacy) | Node/Express in `~staff-shared-server` | started by `nx dev staff`                                         |
| Pathways metrics (new)    | Python/FastAPI in `recidiviz-data`     | `nx dev-be staff` (frontend) + Docker compose in `recidiviz-data` |
| Auth                      | Auth0 (separate staging/prod tenants)  | bypassed in offline mode                                          |

For Pathways metrics specifically: `flags.ts` `defaultMetricBackend` / `metricBackendOverrides` selects between the legacy Node and new Python backend per metric.
