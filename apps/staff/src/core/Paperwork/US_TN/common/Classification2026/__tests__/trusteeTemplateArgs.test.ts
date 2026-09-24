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
  TRUSTEE_ANNEX_SUB_QUESTION,
  TRUSTEE_CRITERIA,
  TRUSTEE_SAMPLE_CASES,
} from "~datatypes";

import {
  getTrusteeReworkTemplateContents,
  trusteeReworkTemplateKeys,
} from "../trusteeTemplateArgs";

describe("getTrusteeReworkTemplateContents", () => {
  it("emits a True, False and Not-required slot for every criterion", () => {
    const contents = getTrusteeReworkTemplateContents({});

    TRUSTEE_CRITERIA.forEach((_, index) => {
      const n = index + 1;
      expect(contents).toHaveProperty(`q${n}t`);
      expect(contents).toHaveProperty(`q${n}f`);
      expect(contents).toHaveProperty(`q${n}na`);
    });
  });

  it("scales with the criteria list rather than a hardcoded count", () => {
    // The True and False slots only: `q3t` and `q3f` match, `q3na` does not.
    // That is why the expected count below is two per criterion and not three.
    const criterionKeys = trusteeReworkTemplateKeys.filter((k) =>
      /^q\d+[tf]$/.test(k),
    );

    expect(criterionKeys).toHaveLength(TRUSTEE_CRITERIA.length * 2);
  });

  it("leaves the Annex sub-question blank unless it was asked", () => {
    const contents = getTrusteeReworkTemplateContents({
      ...TRUSTEE_SAMPLE_CASES.allTrue.formData,
      [TRUSTEE_ANNEX_SUB_QUESTION.key]: "true",
    });

    expect(contents.subQ3t).toBe("");
    expect(contents.subQ3f).toBe("");
  });

  it("marks the Annex sub-question once criterion 3 is False", () => {
    const contents = getTrusteeReworkTemplateContents(
      TRUSTEE_SAMPLE_CASES.annexOnly.formData,
    );

    expect(contents.subQ3t).toBe("X");
    expect(contents.subQ3f).toBe("");
  });

  it("marks the answers given", () => {
    const contents = getTrusteeReworkTemplateContents(
      TRUSTEE_SAMPLE_CASES.allTrue.formData,
    );

    expect(contents.q1t).toBe("X");
    expect(contents.q1f).toBe("");
    expect(contents.q15t).toBe("X");
  });

  it("prints Not required rather than a blank for a criterion made moot", () => {
    const contents = getTrusteeReworkTemplateContents(
      TRUSTEE_SAMPLE_CASES.hardBarFailure.formData,
    );

    expect(contents.q3f).toBe("X");
    expect(contents.q9na).toBe("Not required");
    expect(contents.q9t).toBe("");
    expect(contents.q9f).toBe("");
  });

  it("reports the two outcomes separately and never as one flag", () => {
    const annexOnly = getTrusteeReworkTemplateContents(
      TRUSTEE_SAMPLE_CASES.annexOnly.formData,
    );

    expect(annexOnly.trusteeEligibleNo).toBe("X");
    expect(annexOnly.annexEligibleYes).toBe("X");
  });

  it("distinguishes eligible-with-AC-approval from plain eligible", () => {
    const rowan = getTrusteeReworkTemplateContents(
      TRUSTEE_SAMPLE_CASES.conditionalFailure.formData,
    );

    expect(rowan.trusteeEligibleAc).toBe("X");
    expect(rowan.trusteeEligibleYes).toBe("");
  });

  it("marks exactly one Trustee outcome at a time", () => {
    Object.values(TRUSTEE_SAMPLE_CASES).forEach(({ formData }) => {
      const c = getTrusteeReworkTemplateContents(formData);
      const marked = [
        c.trusteeEligibleYes,
        c.trusteeEligibleAc,
        c.trusteeEligibleNo,
        c.trusteeEligiblePending,
      ].filter((v) => v === "X");

      expect(marked).toHaveLength(1);
    });
  });

  it("records each approval decision and date", () => {
    const contents = getTrusteeReworkTemplateContents({
      ...TRUSTEE_SAMPLE_CASES.allTrue.formData,
      trusteeWardenTrusteeApproved: "true",
      trusteeWardenTrusteeApprovalDate: "09/16/2026",
    });

    expect(contents.wardenTrusteeApproved).toBe("X");
    expect(contents.wardenTrusteeDenied).toBe("");
    expect(contents.wardenTrusteeDate).toBe("09/16/2026");
  });

  it("leaves no placeholder undefined, whatever the form state", () => {
    Object.values(TRUSTEE_SAMPLE_CASES).forEach(({ formData }) => {
      const contents = getTrusteeReworkTemplateContents(formData);

      trusteeReworkTemplateKeys.forEach((key) => {
        expect(contents[key]).toBeDefined();
      });
    });
  });
});

describe("trusteeReworkTemplateKeys", () => {
  it("is the contract the DOCX template must match", () => {
    expect(trusteeReworkTemplateKeys).toMatchInlineSnapshot(`
      [
        "acApproved",
        "acDate",
        "acDenied",
        "annexEligibleNo",
        "annexEligiblePending",
        "annexEligibleYes",
        "contractMonitorApproved",
        "contractMonitorDate",
        "contractMonitorDenied",
        "denialNotes",
        "denialReasons",
        "notesForWarden",
        "q10f",
        "q10na",
        "q10t",
        "q11f",
        "q11na",
        "q11t",
        "q12f",
        "q12na",
        "q12t",
        "q13f",
        "q13na",
        "q13t",
        "q14f",
        "q14na",
        "q14t",
        "q15f",
        "q15na",
        "q15t",
        "q1f",
        "q1na",
        "q1t",
        "q2f",
        "q2na",
        "q2t",
        "q3f",
        "q3na",
        "q3t",
        "q4f",
        "q4na",
        "q4t",
        "q5f",
        "q5na",
        "q5t",
        "q6f",
        "q6na",
        "q6t",
        "q7f",
        "q7na",
        "q7t",
        "q8f",
        "q8na",
        "q8t",
        "q9f",
        "q9na",
        "q9t",
        "subQ3f",
        "subQ3t",
        "trusteeEligibleAc",
        "trusteeEligibleNo",
        "trusteeEligiblePending",
        "trusteeEligibleYes",
        "wardenAnnexApproved",
        "wardenAnnexDate",
        "wardenAnnexDenied",
        "wardenTrusteeApproved",
        "wardenTrusteeDate",
        "wardenTrusteeDenied",
      ]
    `);
  });
});
