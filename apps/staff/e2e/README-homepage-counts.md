# Homepage count permutations

What `WorkflowsHomepage.spec.ts` covers, and why each row is its own shape.

## The two count paths

`summaryByType` on `WorkflowsHomepagePresenter` picks one of two, by the
`typesenseHomepage` gate:

| Path      | `totalCount`                        | Source              |
| --------- | ----------------------------------- | ------------------- |
| Firestore | `countOpportunities(opportunities)` | a hydrated caseload |
| Typesense | `sum(Object.values(tabCounts))`     | the tab census      |

They are not the same function. The Firestore path applies each type's
`countByFunction`, or, with none, drops every record that is submitted, denied
or ineligible. The Typesense path sums **every** tab, acted-on tabs included,
because the records it would filter on were never fetched.

So any type whose displayed tabs include a tab the Firestore path excludes
reports a higher number under the gate. The spec asserts the two paths agree,
rather than asserting a hardcoded number, so it tests the parity the Phase 2
epic requires instead of restating the implementation.

## Count shapes

`countByFunction` has four shapes across 10 enabled types. Every other type
uses the default.

| Shape               | Rule                                                                             | Types                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DEFAULT**         | records that are not submitted, denied or ineligible                             | the other 50                                                                                                                                                                                                     |
| **SINGLE_TAB**      | one named tab only                                                               | `usAzTransferToAdministrativeSupervision`, `usAzTransferToAdministrativeSupervisionV2` (`Eligible per ORAS`), `usUtEarlyTermination` (`Suitable for Early Termination`)                                          |
| **TAB_SUBSET**      | a named subset, summed                                                           | `usIaCompleteSupervisionLevelDowngrade` (`Pending Eligibility` + `Eligible Now`), `usTxAnnualReportStatusV2` and `usTxEarlyReleaseFromSupervisionV2` (`Eligible Now` + `Almost Eligible` + `Awaiting Revisions`) |
| **DYNAMIC_TAB**     | the first tab matching `Overdue as of *`, else `Due this week`, else `Coming up` | `usMoOverdueRestrictiveHousingInitialHearing`, `usMoOverdueRestrictiveHousingRelease`, `usMoOverdueRestrictiveHousingReviewHearing`                                                                              |
| **DISTINCT_PEOPLE** | `new Set(person.externalId).size` — people, not records                          | `usOrEarnedDischargeSentence`                                                                                                                                                                                    |

`DISTINCT_PEOPLE` is the only shape that can disagree with the Typesense path
even when every record sits on a displayed tab: one person with two sentences
is two documents in the index and one in the count.

## Tab-title permutations

The card labels a tab by `opp.tabTitle(tabGroup)` against the **first** tab
group. Three things move that label, so a row is worth its own case whenever
one applies:

| Permutation                  | Where                                                                 | Example                                                                                                   |
| ---------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Class overrides `tabTitle()` | ~18 opportunity classes                                               | `UsMoOverdueRestrictiveHousingOpportunityBase` builds `Overdue as of <date>` from the record              |
| Config overrides `tabGroups` | 6 configs                                                             | `UsTxArsErsV2Configuration`, `UsNcCreditReductionReviewConfiguration`, `UsPaSupervisionBaseConfiguration` |
| Admin-panel `tabGroups`      | 22 of 61 configs set it; the other 39 are `null` and take the default | `usIaCompleteSupervisionLevelDowngrade`: `Eligible Now, Pending Eligibility, Downgraded, Snoozed`         |

A dynamically named tab is the sharpest case. The census labels a bucket from
an exemplar carrying no overlay, so a title derived from the record has to
reconstruct identically on both paths or the tab splits in two.

## Alerts

`OutstandingItemsAlerts` reads two counts the census produces separately from
the tabs:

| Alert            | Firestore                   | Typesense                         |
| ---------------- | --------------------------- | --------------------------------- |
| `eligibleStale`  | `opp.isEligibleStaleViewed` | the stale partition of the census |
| `pendingOverdue` | `opp.isPendingOverdue`      | the acted-on search               |

## Known failures

Each is `test.fixme` in the spec, so the case stays listed and stays unrun
until its ticket lands. Remove the `knownFailure` to run it.

| Case  | Shape           | Ticket        | What diverges                                                                                                                    |
| ----- | --------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| US_CA | DEFAULT         | **OBT-52521** | Renders NO card at all, where Firestore shows `Eligible Now: 2`. The documents are indexed, so this is not a count-shape problem |
| US_ND | DEFAULT         | OBT-52517     | Tab counts agree; the headline does not. `Referral Submitted` is dropped by Firestore, summed by the census                      |
| US_NE | DEFAULT         | OBT-52517     | Same, with `Pending` as the excluded tab                                                                                         |
| US_UT | SINGLE_TAB      | OBT-52518     | Firestore reports 3, the census 5                                                                                                |
| US_OR | DISTINCT_PEOPLE | OBT-52519     | The census counts documents, not people                                                                                          |
| US_TX | TAB_SUBSET      | OBT-52520     | Adds `Submitted for Review`, `Approved in OIMS`, `Marked Ineligible`. The tenant also enables V1 and V2 of each type             |
| US_IA | TAB_SUBSET      | OBT-50232     | Also counts `Downgraded` and `Snoozed`                                                                                           |
| US_MO | DYNAMIC_TAB     | OBT-50229     | Counts `Overridden` and `Missing Review Date`; the `Overdue as of <date>` label is record-derived                                |

US_CA is the odd one. Every other row renders a card with a wrong number; US_CA
renders nothing, which an officer reads as "nothing to do".

US_IA, US_MO and US_TX have **never executed** — they were marked `fixme`
before the suite first ran, so their rows above come from reading the
configuration, not from a diff. Run each once before fixing it.

## Tenants and types

| Tenant | Types | With a `countByFunction` override |
| ------ | ----- | --------------------------------- |
| US_AR  | 1     | —                                 |
| US_AZ  | 4     | 2                                 |
| US_CA  | 1     | —                                 |
| US_IA  | 2     | 1                                 |
| US_ID  | 9     | —                                 |
| US_MI  | 10    | —                                 |
| US_MO  | 5     | 3                                 |
| US_NC  | 1     | —                                 |
| US_ND  | 3     | —                                 |
| US_NE  | 3     | —                                 |
| US_OR  | 1     | 1                                 |
| US_PA  | 2     | —                                 |
| US_TN  | 14    | —                                 |
| US_TX  | 4     | 2                                 |
| US_UT  | 1     | 1                                 |
