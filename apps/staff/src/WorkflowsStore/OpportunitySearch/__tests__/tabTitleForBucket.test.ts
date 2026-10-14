// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { readFileSync } from "fs";
import { globSync } from "glob";
import { configure } from "mobx";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  type OpportunityType,
  usAzReleaseToDTPFixtures,
  usAzReleaseToTPRFixtures,
  usIaEarlyDischargeFixtures,
  usIdCRCResidentWorkerFixtures,
  usIdCRCWorkReleaseFixtures,
  usIdExpandedCRCFixtures,
  usIdPastFTRDFixtures,
  usIdTransferToCRCLikeBedFixtures,
  usMiAddInPersonSecurityClassificationCommitteeReviewV2Fixtures,
  usMiCustodyLevelDowngradeFixtures,
  usMiPastFTRDFixtures,
  usMiSecurityClassificationCommitteeReviewV2Fixtures,
  usMiWardenInPersonSecurityClassificationCommitteeReviewV2Fixtures,
  usNcCreditReductionReviewFixtures,
  usNdTransferToMinFacilityFixtures,
  usPaAdminSupervisionFixtures,
  usPaSpecialCircumstancesSupervisionFixtures,
  usTxAnnualReportStatusV2Fixtures,
  usTxEarlyReleaseFromSupervisionV2Fixtures,
  usUtEarlyTerminationFixtures,
} from "~datatypes";

import { RootStore } from "../../../RootStore";
import { opportunityConstructors } from "../../Opportunity/opportunityConstructors";
import {
  BUCKET_KEY_INSUFFICIENT,
  tabTitleForBucket,
} from "../tabTitleForBucket";

vi.mock("@sentry/react", () => ({ captureException: vi.fn() }));

let root: RootStore;

beforeEach(() => {
  // Lets the US_PA block below stub `activeFeatureVariants`, a computed getter.
  configure({ safeDescriptors: false });
  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
});

afterEach(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

/**
 * Every type whose `tabTitle()` differs from the base, paired with its
 * fixtures. The guard at the bottom fails if this list falls behind the code.
 */
const OVERRIDES_WITH_FIXTURES: Array<
  [OpportunityType, Record<string, { input: unknown }>]
> = [
  ["usIaEarlyDischarge", usIaEarlyDischargeFixtures],
  ["pastFTRD", usIdPastFTRDFixtures],
  [
    "usMiSecurityClassificationCommitteeReviewV2",
    usMiSecurityClassificationCommitteeReviewV2Fixtures,
  ],
  [
    "usMiAddInPersonSecurityClassificationCommitteeReviewV2",
    usMiAddInPersonSecurityClassificationCommitteeReviewV2Fixtures,
  ],
  [
    "usMiWardenInPersonSecurityClassificationCommitteeReviewV2",
    usMiWardenInPersonSecurityClassificationCommitteeReviewV2Fixtures,
  ],
  ["usMiCustodyLevelDowngrade", usMiCustodyLevelDowngradeFixtures],
  ["usMiPastFTRD", usMiPastFTRDFixtures],
  ["usNdTransferToMinFacility", usNdTransferToMinFacilityFixtures],
  ["usUtEarlyTermination", usUtEarlyTerminationFixtures],
  // Split their untouched records on `metadata.tabDescription`.
  ["usAzReleaseToTPR", usAzReleaseToTPRFixtures],
  ["usAzReleaseToDTP", usAzReleaseToDTPFixtures],
  // Read a grant off the RECORD; see `hasGrantedDate` in schemas/index.ts.
  ["usTxAnnualReportStatusV2", usTxAnnualReportStatusV2Fixtures],
  [
    "usTxEarlyReleaseFromSupervisionV2",
    usTxEarlyReleaseFromSupervisionV2Fixtures,
  ],
  // The homepage always passes the status tab group, so the GENDER branch is
  // never reached here and these fall through to the base tabTitle. Gender
  // matters on the opportunities page, which is Phase 3.
  ["usIdCRCResidentWorker", usIdCRCResidentWorkerFixtures],
  ["usIdCRCWorkRelease", usIdCRCWorkReleaseFixtures],
  ["usIdExpandedCRC", usIdExpandedCRCFixtures],
  ["usIdTransferToCRCLikeBed", usIdTransferToCRCLikeBedFixtures],
  // `adjudicationStatus` is overlay state, so an untouched record falls
  // through to the base branches.
  ["usNcCreditReductionReview", usNcCreditReductionReviewFixtures],
  // `isEligibilityUnclear` is `metadata.tabName === "ELIGIBILITY_UNCLEAR"`,
  // which the bucket key already carries.
  ["usPaAdminSupervision", usPaAdminSupervisionFixtures],
  [
    "usPaSpecialCircumstancesSupervision",
    usPaSpecialCircumstancesSupervisionFixtures,
  ],
];

/**
 * The two types with a `tabTitle()` override and NO fixtures to check it
 * against. Their records reference people who do not exist, so nothing can be
 * built from them — see the AZ fixture gap on OBT-46427.
 */
/**
 * Family base classes whose override IS covered, through a concrete type in
 * the parity list above. The file is named for the base, so the name-matching
 * guard cannot see the link on its own.
 */
const OVERRIDES_COVERED_VIA_SUBCLASS = [
  // Covered by the three usIdCRC* entries.
  "UsIdCRCOpportunityBase",
  // Covered by the two usPa* entries.
  "UsPaSupervisionOpportunityBase",
  // Covered by the usAzReleaseTo{TPR,DTP} entries.
  "UsAzReleaseToTransitionProgramOpportunityBase",
  // Covered by the two usTx*V2 entries.
  "UsTxArsErsV2OpportunityBase",
];

const OVERRIDES_WITHOUT_FIXTURES = [
  "UsAzTransferToAdministrativeSupervisionOpportunity",
  "UsAzTransferToAdministrativeSupervisionV2Opportunity",
  // Withheld rather than guessed at. tabCountCoverage.test.ts proves the
  // list that decides this.
  "UsMoOverdueRestrictiveHousingOpportunityBase",
  "UsIaSupervisionLevelDowngradeOpportunity",
];

function personStub() {
  return {
    // Non-empty: the update subscription builds a Firestore DocumentReference
    // in its constructor, and an empty id is an invalid path.
    recordId: "us_xx_TAB_PROBE",
    externalId: "TAB_PROBE",
    pseudonymizedId: "",
    stateCode: "US_XX",
    rootStore: root,
    opportunities: {},
    flattenedOpportunities: [],
  };
}

/** The real class, the real schema, the real record — nobody having acted. */
function realTabTitle(type: OpportunityType, input: unknown) {
  const Ctor = opportunityConstructors[type] as unknown as new (
    person: unknown,
    record: unknown,
    type: unknown,
  ) => { tabTitle: (group?: never) => string; config: { tabGroups: object } };

  const opportunity = new Ctor(personStub(), input, type);
  const tabGroup = Object.keys(opportunity.config.tabGroups)[0];
  return opportunity.tabTitle(tabGroup as never);
}

describe("parity with the real tabTitle()", () => {
  // THE test that makes the synthetic record safe. `tabTitleForBucket` builds
  // an opportunity from the bucket key; this builds one from the whole record.
  // A class reading anything else makes them disagree.
  test.each(OVERRIDES_WITH_FIXTURES)("%s", (type, fixtures) => {
    const mismatches: string[] = [];

    for (const [name, fixture] of Object.entries(fixtures)) {
      const record = fixture.input as Record<string, any>;
      const expected = realTabTitle(type, record);
      const actual = tabTitleForBucket(
        {
          opportunityType: type,
          isEligible: record["isEligible"] !== false,
          isAlmostEligible: record["isAlmostEligible"] === true,
          tabName: record["metadata"]?.tabName,
          tabDescription: record["metadata"]?.tabDescription,
          hasGrantedDate: !!record["metadata"]?.grantedAt,
        },
        root,
      );

      if (actual !== expected) {
        mismatches.push(`${name}: expected ${expected}, got ${actual}`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});

describe("with an overlay", () => {
  // Acted-on documents run through the same adapter, with their overlay, which
  // reaches the approval-flow branches the untouched path never touches.
  const key = {
    opportunityType: "usMiPastFTRD" as OpportunityType,
    isEligible: true,
    isAlmostEligible: false,
  };

  test("a denial reaches the denied tab", () => {
    const untouched = tabTitleForBucket(key, root);
    const denied = tabTitleForBucket(key, root, {
      denial: { reasons: ["TEST"] },
    });

    expect(untouched).toBe("Overdue");
    expect(denied).not.toBe(untouched);
  });

  test("an absent overlay is not the same as an empty one", () => {
    // Both mean "nobody acted", so both must give the untouched tab.
    expect(tabTitleForBucket(key, root, undefined)).toBe(
      tabTitleForBucket(key, root, {}),
    );
  });
});

describe("US_PA under the unclear-eligibility variant", () => {
  // The parity sweep cannot reach this: no US_PA fixture carries the unclear
  // tab name, and the default store has no feature variants, so both sides
  // take `super.tabTitle()` and agree whichever way the class is written.
  //
  // `isEligibilityUnclear` is a GETTER over `record.metadata.tabName`, which
  // the bucket key carries. It used to be a constructor field, which a shell
  // never sets — the unclear branch was then skipped WITHOUT throwing, and the
  // census reported a plausible wrong tab.
  const record = Object.values(usPaAdminSupervisionFixtures)[0].input as Record<
    string,
    unknown
  >;
  const unclear = {
    ...record,
    metadata: {
      ...(record["metadata"] as object),
      tabName: "ELIGIBILITY_UNCLEAR",
      eligibilityUnclearText: ["probe"],
    },
  };
  const key = {
    opportunityType: "usPaAdminSupervision" as OpportunityType,
    isEligible: true,
    isAlmostEligible: false,
    tabName: "ELIGIBILITY_UNCLEAR",
  };

  function enableVariant() {
    vi.spyOn(root.userStore, "activeFeatureVariants", "get").mockReturnValue({
      usPaUnclearEligibility: {},
    } as never);
  }

  test("the variant off leaves the base tab", () => {
    expect(tabTitleForBucket(key, root)).toBe("Eligible Now");
  });

  test("the variant on reaches the unclear tab, as the real class does", () => {
    // ABSOLUTE, not just equal to the real instance. A regression that breaks
    // the class breaks BOTH sides, and they would then agree on the wrong
    // answer — parity proves agreement, never correctness.
    enableVariant();

    expect(tabTitleForBucket(key, root)).toBe("Eligibility Unclear");
    expect(
      realTabTitle("usPaAdminSupervision" as OpportunityType, unclear),
    ).toBe("Eligibility Unclear");
  });
});

describe("buckets the key cannot answer for", () => {
  // Driven by the list itself, so this cannot fall behind it.
  //
  // TODO(OBT-50229): index US_MO's resolved eligibility date and partition the
  // census by it, which empties the list and this block with it.
  test.each([...BUCKET_KEY_INSUFFICIENT])("%s is withheld", (type) => {
    // Fails closed. Left to the generic path, US_MO would answer "Missing
    // Review Date" for every record — right-looking and wrong.
    expect(
      tabTitleForBucket(
        {
          opportunityType: type as OpportunityType,
          isEligible: true,
          isAlmostEligible: false,
        },
        root,
      ),
    ).toBeUndefined();
  });
});

describe("the guard", () => {
  test("every tabTitle override is covered or documented", () => {
    // Without this, a new override silently gets the BASE tab for its whole
    // untouched count — a wrong number rather than a missing one.
    const files = globSync(
      "apps/staff/src/WorkflowsStore/Opportunity/**/*.ts",
      { cwd: process.cwd().replace(/\/apps\/staff$/, ""), absolute: true },
    )
      // Matched exactly: `endsWith` also swallows family base classes.
      .filter(
        (f) =>
          !f.includes("__tests__") &&
          !f.endsWith("/Opportunity/OpportunityBase.ts"),
      )
      // `override` included: one class declares `override tabTitle(...)`.
      .filter((f) =>
        /^ {2}(override )?tabTitle\(/m.test(readFileSync(f, "utf8")),
      );

    // Compared case-insensitively: three MI classes are exported
    // lowercase-first while their files are capitalised.
    const covered = new Set(
      OVERRIDES_WITH_FIXTURES.map(
        ([type]) =>
          (opportunityConstructors[type] as unknown as { name: string }).name,
      )
        .concat(OVERRIDES_WITHOUT_FIXTURES)
        .concat(OVERRIDES_COVERED_VIA_SUBCLASS)
        .map((name) => name.toLowerCase()),
    );

    const uncovered = files
      .map((f) => f.split("/").pop()?.replace(/\.ts$/, "") ?? "")
      .filter((name) => !covered.has(name.toLowerCase()));

    expect(uncovered).toEqual([]);
  });
});
