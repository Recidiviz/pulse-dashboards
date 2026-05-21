# CLAUDE.md — apps/staff/src/WorkflowsStore

Conceptual orientation for Workflows. Inherits from the root `CLAUDE.md` and `apps/staff/CLAUDE.md`; this file only covers Workflows-specific knowledge.

> **Step-by-step recipes live in Notion at `go/workflows-how-to`** — how to launch milestones, customize tabs, enable filters, configure approval flows, set up a new state, etc. This file is for the _concepts_ underneath those recipes; consult the hub when you actually need to do one.

## Data flow

```
BQ Opportunity Record view
  → Workflows ETL Delegate (recidiviz-data: workflows_opportunity_etl_delegate.py)
  → Firestore document
  → Zod parse on frontend
  → Opportunity instance (subclass of OpportunityBase)
  → criteria copy from Admin Panel rendered via Handlebars
```

What the ETL does to the record:

- snake_case → camelCase
- splits the BQ `reasons` array into `eligibleCriteria` / `ineligibleCriteria` based on whether each criterion's name appears in the row's `ineligible_criteria` column
- nests `metadata_*` and `case_notes_*` columns into `metadata` / `caseNotes` objects

**The frontend doesn't know about TES** — it only sees the final Opportunity Record shape in Firestore. **If the Firestore record doesn't match the Zod schema, the opportunity silently doesn't show up** — easy to miss when debugging "why isn't this person eligible."

## Opportunity Base vs. Opportunity Config

The most useful distinction in this directory.

- **OpportunityConfig** = settings for the opportunity _as a whole_; do not differ between eligible people; often admin-panel-managed (e.g. `submittedTabTitle`, `supportsAlmostEligible`, `maxSnoozeDays`). Shipped to the frontend by `OpportunityConfigurationAPIClient`.
- **OpportunityBase** (the class) = anything that _differs per person_ or can't be expressed in the admin panel (e.g. a `tabTitle` that depends on the person's status, a denial-reason list that's adjusted based on individual data).
- **Custom OpportunityConfigurations** = a Config subset that isn't yet admin-panel-driven. Live at `Opportunity/OpportunityConfigurations/models/CustomOpportunityConfigurations/Us<State>/`, extend `ApiOpportunityConfiguration`. Use one when the override is opportunity-wide but needs code (e.g. `maxSnoozeDaysByDenialReason`).

When deciding where a new field belongs: if it can vary per person, put it on the class; otherwise put it on the config.

## When does the Opportunity Record need a Polaris code change?

Depends entirely on whether the opportunity has a Zod schema and what's named in it. Rule of thumb:

| Change to the BQ Opportunity Record          | Polaris code change?                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Adding a criterion                           | No (admin-panel only)                                                                       |
| Renaming or removing a criterion             | Yes, **if** the opportunity has a Zod schema                                                |
| Adding a `reasons` field to a criterion      | Yes, **if** the schema names that field explicitly (passthrough fields don't need a change) |
| Adding a top-level field (e.g. `metadata_*`) | Yes — always; otherwise the field gets stripped before the frontend sees it                 |

**Order of operations** when both code and config are needed: Polaris code → -data PR → staging deploy → Admin Panel config → prod deploy → promote config. Frontend and backend deploys must stay in sync; a config promoted before a code deploy can break renders.

## Zod passthrough convention

Schemas should explicitly name only the attrs the app references in code. Everything else uses [`passthrough`](https://v3.zod.dev/?id=passthrough). Zod's default behavior strips unknown fields, which breaks dynamic features — e.g. eligibility criteria copy that references arbitrary fields from the `reasons` blob via Handlebars (`{{date recidivizTprDate}}`) won't render if those fields were stripped. (Don't reach for `strict` either — it errors on unknown fields entirely.)

## Forms

Form _components_ live in `apps/staff/src/core/Paperwork/`. Form _classes_ live alongside the opportunity at `Opportunity/.../Forms/<FormName>.ts`, extending `FormBase`. A form requires a custom Opportunity class registered in `opportunityConstructors.ts`.

Two methods to implement on a form class:

- `prefilledDataTransformer` — returns autofilled data, relabeled for the downloadable form
- `formContents` — returns the React component name shown in the opportunity's form view (typically `FormContainer` with custom children)

Two independent axes:

- **What the state gave us.** A DOCX template, an editable PDF (one with form fields baked in), or nothing — in which case we build the form from HTML.
- **Is the form editable in the tool?** Either _WYSIWYG_ (users edit in-app and the rendered HTML is what they download) or _static_ (users see preview images of the form pages; the downloadable file is generated from their inputs but isn't directly edited).

Only HTML-generated forms can be WYSIWYG. DOCX and PDF-Form-Filler forms are always static.

| Source            | Editable in tool? | Generator                          | Notes                                                                                                                                                                                   |
| ----------------- | ----------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DOCX template** | No (static)       | `DOCXFormGenerator.ts`             | `{{var}}` substitution. Easiest path when the state gives us a DOCX.                                                                                                                    |
| **Editable PDF**  | No (static)       | `PDFFormFiller.ts` (`fillPDF`)     | State provides a PDF that already has form fields. Run `nx pdfformfiller-boilerplate staff $template.pdf` to discover field names. Free Acrobat can't add fields to a non-editable PDF. |
| **HTML (custom)** | Yes (WYSIWYG)     | `PDFFormGenerator.ts` (`generate`) | We build the form from HTML and render it to a PDF. Used for TN Compliant Reporting.                                                                                                    |

**WYSIWYG / editable forms** require the `OpportunityUpdateWithForm` UpdateRecord type and a `usXxOpportunityNameDraftData` type for the editable fields. Drafts persist to the `clientUpdatesV2` Firestore collection.

## Repeated-eligibility-span footgun (when adding a new Opportunity class)

By default, `clientUpdatesV2` is indexed `<state_code>_<external_id>`, so a snooze, denial, or form draft from a _previous_ eligibility span persists into a _new_ one — bad for opportunities people can be eligible for repeatedly (annual reclassification, work-release-program, etc.).

**Fix:** override the `opportunityId` getter on the Opportunity class, _or_ set `opportunity_id` on the row in the BQ view. Either way, instances become indexed as `<state_code>_<external_id>_<opportunity_id>`, so each eligibility span gets a fresh slate. Existing examples: TN 2026 reclassification, MI Restrictive Housing.

If you're building a "person can be eligible again later" opportunity and you don't see this set, you have a bug waiting to happen.

## Common custom-config overrides

Levers that frequently appear on subclasses of `ApiOpportunityConfiguration`. Knowing they exist saves time when reading code or deciding where to extend:

| Override                                                              | Controls                                                                                                                                                             |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `maxSnoozeDaysByDenialReason`                                         | Per-denial-reason snooze caps; map to `undefined` for an indefinite snooze                                                                                           |
| `reasonsRequiringApproval`                                            | Denial reasons that trigger the _snooze_ approval flow                                                                                                               |
| `supportsSupervisorReviewOnGrants`                                    | Enables the _grant_ approval flow (adds a Supervisor Review tab)                                                                                                     |
| `denialInputSettings`                                                 | Collect freeform/numeric input on a specific denial reason (e.g. "remaining fees: $\_\_\_")                                                                          |
| `enableWorkflowsFilter` (+ tenant `workflowsOpportunityFilterConfig`) | Table-view filters                                                                                                                                                   |
| `sidebarComponents()`                                                 | Components shown in the opportunity / client / resident detail sidebar                                                                                               |
| `supportsIneligible`                                                  | Surface ineligible opportunities. **Also requires** removing the eligibility filter in the corresponding `recidiviz-data` BQ view, plus a feature variant for users. |

## See also

- `Opportunity/OpportunityConfigurations/` — config types and the API client
- `Task/` — parallel Tasks feature (covered in `apps/staff/CLAUDE.md`)
- `apps/staff/src/core/Paperwork/` — form components
- `go/workflows-how-to` (Notion) — the recipe hub for everything not covered here
