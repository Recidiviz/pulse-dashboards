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
  resolveAnnexOutcome,
  resolveTrusteeOutcome,
} from "../reclassificationScoreUtils";
import {
  getTrusteeCriterionNumber,
  TRUSTEE_ANNEX_SUB_QUESTION,
  TRUSTEE_CRITERIA,
  TRUSTEE_CRITERIA_GROUPS,
} from "../trusteeCriteria";
import {
  stripTrusteeReworkPrefills,
  TRUSTEE_REWORK_PREFILL_KEYS,
  trusteeFormSchema,
} from "../utils";

const requiredSchemaFields = {
  trusteeHas10YearsOrLessRemaining: true,
  trusteeNoAssaultiveDisciplinaryWithSeriousInjury: true,
  trusteeNoEscapeFromLowTrusteePast5Years: true,
  trusteeNoEscapeFromMediumCloseMaxPast10Years: true,
  trusteeNotConvictedOfFirstDegreeMurder: true,
  trusteeNotScoredHighForViolence: true,
  trusteeNotServingForSexualOffense: true,
};

describe("TRUSTEE_CRITERIA", () => {
  it("has fifteen criteria, thirteen of them hard bars", () => {
    expect(TRUSTEE_CRITERIA).toHaveLength(15);
    expect(TRUSTEE_CRITERIA.filter((c) => c.isHardBar)).toHaveLength(13);
  });

  it("makes only criteria 1 through 6 relevant to Annex", () => {
    const annexNumbers = TRUSTEE_CRITERIA.filter((c) => c.affectsAnnex).map(
      (c) => getTrusteeCriterionNumber(c.key),
    );

    expect(annexNumbers).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("classifies criteria 14 and 15 as conditional, and no others", () => {
    const conditional = TRUSTEE_CRITERIA.filter((c) => !c.isHardBar);

    expect(conditional.map((c) => c.group)).toEqual(["E", "E"]);
    expect(conditional.map((c) => getTrusteeCriterionNumber(c.key))).toEqual([
      14, 15,
    ]);
  });

  it("orders criteria so each group is contiguous and sections do not interleave", () => {
    const groups = TRUSTEE_CRITERIA.map((c) => c.group);
    expect(groups).toEqual([...groups].sort());

    const sections = groups.map((g) => TRUSTEE_CRITERIA_GROUPS[g].section);
    expect(sections.slice(0, 6)).toEqual(Array(6).fill(sections[0]));
    expect(sections.slice(6)).toEqual(Array(9).fill(sections[6]));
    expect(sections[0]).not.toEqual(sections[6]);
  });

  it("uses keys that exist on the form schema and are unique", () => {
    const keys = TRUSTEE_CRITERIA.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain("trusteeWardenHasApproved");

    const schemaKeys = Object.keys(trusteeFormSchema.shape);
    expect(keys.filter((k) => !schemaKeys.includes(k))).toEqual([]);
  });

  it("refuses to number a key that is not a criterion", () => {
    expect(() =>
      getTrusteeCriterionNumber("trusteeWardenHasApproved" as never),
    ).toThrow(/not a Trustee criterion/);
  });

  it("hangs the Annex sub-question off the sex offender criterion", () => {
    expect(
      getTrusteeCriterionNumber(TRUSTEE_ANNEX_SUB_QUESTION.parentKey),
    ).toBe(3);
  });
});

describe("trusteeFormSchema", () => {
  it("parses the criteria the backend already computes but the schema used to drop", () => {
    const parsed = trusteeFormSchema.parse({
      ...requiredSchemaFields,
      trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody: true,
      trusteeNoViolentFelonyConvictionPast5YearsIncarceration: false,
    });

    expect(parsed.trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody).toBe(
      "true",
    );
    expect(parsed.trusteeNoViolentFelonyConvictionPast5YearsIncarceration).toBe(
      "false",
    );
  });

  it("still parses a record written before the new columns existed", () => {
    const parsed = trusteeFormSchema.parse(requiredSchemaFields);

    expect(parsed.trusteeNotOnClinicalAlertStatus).toBeUndefined();
    expect(parsed.trusteeHas7YearsOrLessRemaining).toBeUndefined();
  });

  it("parses a null criterion rather than failing the whole record", () => {
    const parsed = trusteeFormSchema.parse({
      ...requiredSchemaFields,
      trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody: null,
    });

    expect(
      parsed.trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody,
    ).toBeNull();
  });
});

describe("TRUSTEE_REWORK_PREFILL_KEYS", () => {
  it("covers exactly the criteria the rework newly autofills", () => {
    const nullishKeys = Object.entries(trusteeFormSchema.shape)
      .filter(([, field]) => field.isOptional() && field.isNullable())
      .map(([key]) => key);

    expect([...TRUSTEE_REWORK_PREFILL_KEYS].sort()).toEqual(nullishKeys.sort());
  });
});

describe("stripTrusteeReworkPrefills", () => {
  it("removes the keys wherever in the object they appear", () => {
    const merged = {
      ...Object.fromEntries(
        TRUSTEE_REWORK_PREFILL_KEYS.map((k) => [k, "true"]),
      ),
      residentFullName: "Phoenix Lee",
    };

    expect(stripTrusteeReworkPrefills(merged)).toEqual({
      residentFullName: "Phoenix Lee",
    });
  });

  it("drops every newly autofilled criterion", () => {
    const stripped = stripTrusteeReworkPrefills(
      Object.fromEntries(TRUSTEE_REWORK_PREFILL_KEYS.map((k) => [k, "true"])),
    );

    expect(stripped).toEqual({});
  });

  it("leaves the criteria the current form already autofills alone", () => {
    const formInformation = {
      trusteeHas10YearsOrLessRemaining: "true",
      trusteeNotServingForSexualOffense: "false",
      trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody: "true",
    };

    expect(stripTrusteeReworkPrefills(formInformation)).toEqual({
      trusteeHas10YearsOrLessRemaining: "true",
      trusteeNotServingForSexualOffense: "false",
    });
  });
});

describe("resolveTrusteeOutcome", () => {
  const allTrue = Object.fromEntries(
    TRUSTEE_CRITERIA.map((c) => [c.key, "true"]),
  );

  it("is incomplete when no criterion is answered", () => {
    expect(resolveTrusteeOutcome({}).status).toBe("INCOMPLETE");
  });

  it("is incomplete while a single criterion is left unanswered", () => {
    const allButLast = Object.fromEntries(
      TRUSTEE_CRITERIA.slice(0, -1).map((c) => [c.key, "true"]),
    );

    expect(resolveTrusteeOutcome(allButLast).status).toBe("INCOMPLETE");
  });

  it("treats an empty string as unanswered rather than False", () => {
    expect(
      resolveTrusteeOutcome({ ...allTrue, trusteeNoPendingFelonyCharges: "" })
        .status,
    ).toBe("INCOMPLETE");
  });

  it("treats a null criterion as unanswered rather than False", () => {
    const outcome = resolveTrusteeOutcome({
      ...allTrue,
      trusteeNotConvictedOfViolentOffenseOr12MonthsInCustody: null,
    });

    expect(outcome.status).toBe("INCOMPLETE");
    expect(outcome.failedHardBars).toEqual([]);
  });

  it("is eligible when all fifteen are True", () => {
    const outcome = resolveTrusteeOutcome(allTrue);

    expect(outcome.status).toBe("ELIGIBLE");
    expect(outcome.failedHardBars).toEqual([]);
    expect(outcome.failedConditionalCriteria).toEqual([]);
  });

  it("resolves to not eligible on a single hard bar without the rest answered", () => {
    const outcome = resolveTrusteeOutcome({
      trusteeNotServingForSexualOffense: "false",
    });

    expect(outcome.status).toBe("NOT_ELIGIBLE");
    expect(outcome.failedHardBars.map(getTrusteeCriterionNumber)).toEqual([3]);
  });

  it("reports every failed hard bar in criterion order", () => {
    const outcome = resolveTrusteeOutcome({
      ...allTrue,
      trusteeNoPendingFelonyCharges: "false",
      trusteeHas10YearsOrLessRemaining: "false",
    });

    expect(outcome.status).toBe("NOT_ELIGIBLE");
    expect(outcome.failedHardBars.map(getTrusteeCriterionNumber)).toEqual([
      1, 12,
    ]);
  });

  it("still reports a Group E failure alongside a failed hard bar", () => {
    const blocked = resolveTrusteeOutcome({
      ...allTrue,
      trusteeNotServingForSexualOffense: "false",
      trusteeNotScoredHighForViolence: "false",
    });

    expect(blocked.status).toBe("NOT_ELIGIBLE");
    expect(
      blocked.failedConditionalCriteria.map(getTrusteeCriterionNumber),
    ).toEqual([15]);
  });

  it("still reports a Group E failure while criteria are unanswered", () => {
    const unanswered = resolveTrusteeOutcome({
      trusteeNotScoredHighForViolence: "false",
    });

    expect(unanswered.status).toBe("INCOMPLETE");
    expect(
      unanswered.failedConditionalCriteria.map(getTrusteeCriterionNumber),
    ).toEqual([15]);
  });

  it("does not let a Group E False disqualify", () => {
    const outcome = resolveTrusteeOutcome({
      ...allTrue,
      trusteeNotScoredHighForViolence: "false",
    });

    expect(outcome.status).toBe("ELIGIBLE_REQUIRES_AC_APPROVAL");
    expect(outcome.failedHardBars).toEqual([]);
    expect(
      outcome.failedConditionalCriteria.map(getTrusteeCriterionNumber),
    ).toEqual([15]);
  });

  it("requires the Assistant Commissioner when both Group E criteria are False", () => {
    const outcome = resolveTrusteeOutcome({
      ...allTrue,
      trusteeNoAssaultiveDisciplinaryWithSeriousInjuryMoreThan5YearsAgo:
        "false",
      trusteeNotScoredHighForViolence: "false",
    });

    expect(outcome.status).toBe("ELIGIBLE_REQUIRES_AC_APPROVAL");
    expect(
      outcome.failedConditionalCriteria.map(getTrusteeCriterionNumber),
    ).toEqual([14, 15]);
  });

  it("stays incomplete when a Group E criterion is False but hard bars are unanswered", () => {
    expect(
      resolveTrusteeOutcome({ trusteeNotScoredHighForViolence: "false" })
        .status,
    ).toBe("INCOMPLETE");
  });

  it("lets a hard bar failure win over a Group E failure", () => {
    const outcome = resolveTrusteeOutcome({
      ...allTrue,
      trusteeNoDetainersOrWarrants: "false",
      trusteeNotScoredHighForViolence: "false",
    });

    expect(outcome.status).toBe("NOT_ELIGIBLE");
  });
});

describe("resolveAnnexOutcome", () => {
  const annexCriteria = TRUSTEE_CRITERIA.filter((c) => c.affectsAnnex);
  const annexAllTrue = Object.fromEntries(
    annexCriteria.map((c) => [c.key, "true"]),
  );
  const sexOffenderKey = TRUSTEE_ANNEX_SUB_QUESTION.parentKey;
  const subKey = TRUSTEE_ANNEX_SUB_QUESTION.key;

  it("resolves without waiting on criteria 7 through 15", () => {
    const outcome = resolveAnnexOutcome(annexAllTrue);

    expect(outcome.status).toBe("ELIGIBLE");
    expect(outcome.subQuestionRequired).toBeFalse();
  });

  it("is incomplete until criteria 1 through 6 are answered", () => {
    expect(resolveAnnexOutcome({}).status).toBe("INCOMPLETE");
  });

  it("disqualifies on a single False among the non-exception criteria", () => {
    const outcome = resolveAnnexOutcome({
      ...annexAllTrue,
      trusteeNotOnLevelOfCare3Or4Or5: "false",
    });

    expect(outcome.status).toBe("NOT_ELIGIBLE");
    expect(outcome.failedCriteria.map(getTrusteeCriterionNumber)).toEqual([6]);
  });

  it("does not disqualify on the sex offender criterion alone", () => {
    const outcome = resolveAnnexOutcome({
      ...annexAllTrue,
      [sexOffenderKey]: "false",
    });

    expect(outcome.status).toBe("INCOMPLETE");
    expect(outcome.subQuestionRequired).toBeTrue();
    expect(outcome.failedCriteria).toEqual([]);
  });

  it("keeps a sex offender eligible when the sub-question is True", () => {
    const outcome = resolveAnnexOutcome({
      ...annexAllTrue,
      [sexOffenderKey]: "false",
      [subKey]: "true",
    });

    expect(outcome.status).toBe("ELIGIBLE");
  });

  it("disqualifies when the sub-question is False", () => {
    const outcome = resolveAnnexOutcome({
      ...annexAllTrue,
      [sexOffenderKey]: "false",
      [subKey]: "false",
    });

    expect(outcome.status).toBe("NOT_ELIGIBLE");
    expect(outcome.failedCriteria.map(getTrusteeCriterionNumber)).toEqual([3]);
  });

  it("ignores a stored sub-question answer when the criterion is True", () => {
    const outcome = resolveAnnexOutcome({
      ...annexAllTrue,
      [sexOffenderKey]: "true",
      [subKey]: "false",
    });

    expect(outcome.status).toBe("ELIGIBLE");
    expect(outcome.subQuestionRequired).toBeFalse();
  });

  it("lets a disqualifying criterion resolve even while the sub-question is open", () => {
    const outcome = resolveAnnexOutcome({
      ...annexAllTrue,
      trusteeHas10YearsOrLessRemaining: "false",
      [sexOffenderKey]: "false",
    });

    expect(outcome.status).toBe("NOT_ELIGIBLE");
    expect(outcome.failedCriteria.map(getTrusteeCriterionNumber)).toEqual([1]);
  });

  it("is eligible for Annex while not eligible for Trustee", () => {
    const formData = {
      ...Object.fromEntries(TRUSTEE_CRITERIA.map((c) => [c.key, "true"])),
      [sexOffenderKey]: "false",
      [subKey]: "true",
    };

    expect(resolveTrusteeOutcome(formData).status).toBe("NOT_ELIGIBLE");
    expect(resolveAnnexOutcome(formData).status).toBe("ELIGIBLE");
  });
});
