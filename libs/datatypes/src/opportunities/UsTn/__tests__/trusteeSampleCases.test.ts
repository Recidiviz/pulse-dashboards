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

import {
  buildTrusteeDenialReasons,
  isEligibleForTrusteeStatus,
  resolveAnnexOutcome,
  resolveTrusteeOutcome,
  resolveTrusteeSkipState,
  showTrusteeChecklist,
} from "../reclassificationScoreUtils";
import {
  getTrusteeCriterionNumber,
  TRUSTEE_ANNEX_SUB_QUESTION,
  TRUSTEE_CRITERIA,
  TrusteeCriterionKey,
} from "../trusteeCriteria";
import { TRUSTEE_SAMPLE_CASES } from "../UsTnReclassification2026Policy/trusteeSampleCases";
import { stripTrusteeReworkPrefills } from "../utils";

const numbers = (keys: readonly TrusteeCriterionKey[]) =>
  keys.map((k) => getTrusteeCriterionNumber(k)).sort((a, b) => a - b);

describe("the spec's sample cases", () => {
  describe(`${TRUSTEE_SAMPLE_CASES.allTrue.name}, every criterion met`, () => {
    const { formData } = TRUSTEE_SAMPLE_CASES.allTrue;

    it("is eligible for Trustee and Annex, with no approver added", () => {
      const trustee = resolveTrusteeOutcome(formData);

      expect(trustee.status).toBe("ELIGIBLE");
      expect(trustee.failedConditionalCriteria).toEqual([]);
      expect(resolveAnnexOutcome(formData).status).toBe("ELIGIBLE");
    });

    it("greys nothing, because the form is fully answered", () => {
      expect(resolveTrusteeSkipState(formData).notRequired).toEqual([]);
    });

    it("has no denial reasons to prefill", () => {
      expect(buildTrusteeDenialReasons(formData)).toBe("");
    });
  });

  describe(`${TRUSTEE_SAMPLE_CASES.hardBarFailure.name}, hard bar failure at criterion 3`, () => {
    const { formData } = TRUSTEE_SAMPLE_CASES.hardBarFailure;

    it("resolves without the rest of the form being answered", () => {
      const trustee = resolveTrusteeOutcome(formData);

      expect(trustee.status).toBe("NOT_ELIGIBLE");
      expect(numbers(trustee.failedHardBars)).toEqual([3]);
    });

    it("retires criteria 7 through 15 but keeps 1 through 6 live", () => {
      const { notRequired, subQuestionNotRequired } =
        resolveTrusteeSkipState(formData);

      expect(numbers(notRequired)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15]);
      expect(subQuestionNotRequired).toBeFalse();
    });

    it("leaves Annex unresolved pending the sub-question", () => {
      expect(resolveAnnexOutcome(formData).status).toBe("INCOMPLETE");
    });

    it("prefills the denial as the requirement that was not met", () => {
      expect(buildTrusteeDenialReasons(formData)).toBe(
        "Criterion 3 not met. Requirement: Inmate is not a sex offender.",
      );
    });
  });

  describe(`${TRUSTEE_SAMPLE_CASES.conditionalFailure.name}, eligible with Assistant Commissioner approval`, () => {
    const { formData } = TRUSTEE_SAMPLE_CASES.conditionalFailure;

    it("stays eligible, with criterion 15 adding an approver", () => {
      const trustee = resolveTrusteeOutcome(formData);

      expect(trustee.status).toBe("ELIGIBLE_REQUIRES_AC_APPROVAL");
      expect(trustee.failedHardBars).toEqual([]);
      expect(numbers(trustee.failedConditionalCriteria)).toEqual([15]);
    });

    it("is still eligible for Annex, which criterion 15 does not affect", () => {
      expect(resolveAnnexOutcome(formData).status).toBe("ELIGIBLE");
    });

    it("writes no denial reasons, because nothing disqualifying failed", () => {
      expect(buildTrusteeDenialReasons(formData)).toBe("");
    });
  });

  describe(`${TRUSTEE_SAMPLE_CASES.partiallyComplete.name}, partially complete`, () => {
    const { formData } = TRUSTEE_SAMPLE_CASES.partiallyComplete;

    it("leaves both outcomes unresolved", () => {
      expect(resolveTrusteeOutcome(formData).status).toBe("INCOMPLETE");
      expect(resolveAnnexOutcome(formData).status).toBe("INCOMPLETE");
    });

    it("greys nothing, because nothing has been ruled out", () => {
      expect(resolveTrusteeSkipState(formData).notRequired).toEqual([]);
    });
  });

  describe("TN-1911's case: not eligible for Trustee, eligible for Annex", () => {
    const { formData } = TRUSTEE_SAMPLE_CASES.annexOnly;

    it("reaches the combination the ticket was filed about", () => {
      expect(resolveTrusteeOutcome(formData).status).toBe("NOT_ELIGIBLE");
      expect(resolveAnnexOutcome(formData).status).toBe("ELIGIBLE");
    });
  });
});

describe("reversibility", () => {
  const sexOffenderKey = TRUSTEE_ANNEX_SUB_QUESTION.parentKey;
  const { formData: allTrue } = TRUSTEE_SAMPLE_CASES.allTrue;

  it("reopens everything when a hard bar goes back to True", () => {
    const failed = { ...allTrue, [sexOffenderKey]: "false" };

    expect(resolveTrusteeOutcome(failed).status).toBe("NOT_ELIGIBLE");

    const restored = { ...failed, [sexOffenderKey]: "true" };

    expect(resolveTrusteeOutcome(restored).status).toBe("ELIGIBLE");
    expect(resolveAnnexOutcome(restored).status).toBe("ELIGIBLE");
    expect(resolveTrusteeSkipState(restored).notRequired).toEqual([]);
  });

  it("reopens retired criteria when the failure clears", () => {
    const partial = { [TRUSTEE_CRITERIA[0].key]: "false" };
    expect(resolveTrusteeSkipState(partial).notRequired.length).toBeGreaterThan(
      0,
    );

    expect(
      resolveTrusteeSkipState({ [TRUSTEE_CRITERIA[0].key]: "true" })
        .notRequired,
    ).toEqual([]);
  });

  it("ignores a stale sub-question answer once criterion 3 is True again", () => {
    const restored = {
      ...allTrue,
      [sexOffenderKey]: "true",
      [TRUSTEE_ANNEX_SUB_QUESTION.key]: "false",
    };

    expect(resolveAnnexOutcome(restored).status).toBe("ELIGIBLE");
  });
});

describe("the off path, which the 2026 pilot is running today", () => {
  const legacyAllTrue = {
    trusteeHas10YearsOrLessRemaining: "true",
    trusteeNoAssaultiveDisciplinaryWithSeriousInjury: "true",
    trusteeNoEscapeFromLowTrusteePast5Years: "true",
    trusteeNoEscapeFromMediumCloseMaxPast10Years: "true",
    trusteeNoViolentFelonyConvictionPast5YearsIncarceration: "true",
    trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody: "true",
    trusteeNotScoredHighForViolence: "true",
    trusteeNotServingForSexualOffense: "true",
    trusteeNoFelonyDetainers: "true",
    trusteeNoPendingFelonyCharges: "true",
    trusteeNoPendingImmigrationActions: "true",
    trusteeWardenHasApproved: "true",
  };

  it("still requires warden approval to report eligible", () => {
    expect(isEligibleForTrusteeStatus(legacyAllTrue)).toBeTrue();
    expect(
      isEligibleForTrusteeStatus({
        ...legacyAllTrue,
        trusteeWardenHasApproved: "false",
      }),
    ).toBeFalse();
  });

  it("is unaffected by the criteria the rework added", () => {
    expect(
      isEligibleForTrusteeStatus({
        ...legacyAllTrue,
        trusteeNotOnClinicalAlertStatus: "false",
        trusteeNotOnLevelOfCare3Or4Or5: "false",
      }),
    ).toBeTrue();
  });

  it("still hides the checklist behind the four gating answers", () => {
    const gating = {
      trusteeNotConvictedOfFirstDegreeMurder: "true",
      trusteeHas10YearsOrLessRemaining: "true",
      isServingLife: "false",
      trusteeNotServingForSexualOffense: "true",
    };

    expect(showTrusteeChecklist("LOW", gating)).toBeTrue();
    expect(
      showTrusteeChecklist("LOW", {
        ...gating,
        trusteeNotServingForSexualOffense: "false",
      }),
    ).toBeFalse();
  });

  it("keeps the criteria the rework newly autofills blank", () => {
    const stripped = stripTrusteeReworkPrefills({
      trusteeHas10YearsOrLessRemaining: "true",
      trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody: "true",
      trusteeNotOnClinicalAlertStatus: "true",
    });

    expect(stripped).toEqual({ trusteeHas10YearsOrLessRemaining: "true" });
  });
});
