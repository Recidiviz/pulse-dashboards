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

import { deleteField } from "firebase/firestore";
import { configure } from "mobx";

import { isDemoMode, isTestEnv } from "~client-env-utils";
import { UsIaEarlyDischargeCharge } from "~datatypes";

import { RootStore } from "../../../../RootStore";
import { ActiveFeatureVariantRecord } from "../../../../RootStore/types";
import UserStore from "../../../../RootStore/UserStore";
import { Client } from "../../../Client";
import { UsIaEarlyDischargeOpportunity } from "../../UsIa/UsIaEarlyDischargeOpportunity";
import {
  usIaEarlyDischargeRecordFixture,
  usIaEdAndSldEligibleClientRecord,
} from "../../UsIa/UsIaSupervisionLevelDowngradeOpportunity/__fixtures__";
import {
  DeselectedChargeKey,
  deselectedChargeKey,
  UsIaEarlyDischargeForm,
} from "../UsIaEarlyDischargeForm";

vi.mock("~client-env-utils");

// The officer ID in the staffAttributes of usIaEarlyDischargeRecordFixture
const FIXTURE_OFFICER_ID = "OFFICER-001";

let form: UsIaEarlyDischargeForm;
let rootStore: RootStore;

function createTestUnit(
  externalId = "NOT-AN-OFFICER",
  options: {
    featureVariants?: ActiveFeatureVariantRecord;
    userFullName?: string;
    userFullNameFromAdminPanel?: string;
  } = {},
) {
  rootStore = new RootStore();
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  rootStore.userStore = {
    activeFeatureVariants: options.featureVariants ?? {
      usIaEarlyDischargeForms: {},
    },
    userAppMetadata: { externalId },
    userFullName: options.userFullName,
    userFullNameFromAdminPanel: options.userFullNameFromAdminPanel ?? "",
  } as unknown as UserStore;

  const person = new Client(usIaEdAndSldEligibleClientRecord, rootStore);
  const opp = new UsIaEarlyDischargeOpportunity(
    person,
    usIaEarlyDischargeRecordFixture,
  );

  if (!opp.form)
    throw new Error(
      "Form was not created — check usIaEarlyDischargeForms feature variant",
    );
  form = opp.form;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isTestEnv).mockReturnValue(true);
  vi.mocked(isDemoMode).mockReturnValue(false);
  configure({ safeDescriptors: false });
  createTestUnit();
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("currentUserIsSupervisingOfficer", () => {
  test("returns true in demo mode regardless of officer match", () => {
    vi.mocked(isDemoMode).mockReturnValue(true);
    expect(form.currentUserIsSupervisingOfficer).toBe(true);
  });

  test("returns true when the current user's externalId matches a staff record", () => {
    createTestUnit(FIXTURE_OFFICER_ID);
    expect(form.currentUserIsSupervisingOfficer).toBe(true);
  });

  test("returns false when the current user's externalId does not match any staff record", () => {
    expect(form.currentUserIsSupervisingOfficer).toBe(false);
  });
});

describe("currentUserCanSignApproverField", () => {
  describe("in demo mode", () => {
    beforeEach(() => {
      vi.mocked(isDemoMode).mockReturnValue(true);
    });

    test("returns true for cbc form type", () => {
      expect(form.currentUserCanSignApproverField("cbc")).toBe(true);
    });

    test("returns true for parole form type", () => {
      expect(form.currentUserCanSignApproverField("parole")).toBe(true);
    });
  });

  describe("outside demo mode", () => {
    test("returns false when the officer signature field is not yet filled", () => {
      vi.spyOn(form, "formData", "get").mockReturnValue({});
      expect(form.currentUserCanSignApproverField("cbc")).toBe(false);
      expect(form.currentUserCanSignApproverField("parole")).toBe(false);
    });

    test("returns true when the officer has signed and the current user is a different officer", () => {
      createTestUnit("APPROVER-001");
      vi.spyOn(form, "formData", "get").mockReturnValue({
        officerSignatureCbc: "Officer Signature",
        officerSignatureIdCbc: FIXTURE_OFFICER_ID,
        officerSignatureParole: "Officer Signature",
        officerSignatureIdParole: FIXTURE_OFFICER_ID,
      });
      expect(form.currentUserCanSignApproverField("cbc")).toBe(true);
      expect(form.currentUserCanSignApproverField("parole")).toBe(true);
    });

    test("returns false when the current user is the officer who already signed", () => {
      createTestUnit(FIXTURE_OFFICER_ID);
      vi.spyOn(form, "formData", "get").mockReturnValue({
        officerSignatureCbc: "Officer Signature",
        officerSignatureIdCbc: FIXTURE_OFFICER_ID,
        officerSignatureParole: "Officer Signature",
        officerSignatureIdParole: FIXTURE_OFFICER_ID,
      });
      expect(form.currentUserCanSignApproverField("cbc")).toBe(false);
      expect(form.currentUserCanSignApproverField("parole")).toBe(false);
    });
  });
});

describe("prefilledDataTransformer", () => {
  describe("officerFullName", () => {
    test("uses userFullName in demo mode regardless of staff match", () => {
      vi.mocked(isDemoMode).mockReturnValue(true);
      createTestUnit("NOT-AN-OFFICER", { userFullName: "Demo User" });
      expect(form.prefilledDataTransformer().officerFullName).toBe("Demo User");
    });

    test("uses userFullNameFromAdminPanel when staff matches", () => {
      createTestUnit(FIXTURE_OFFICER_ID, {
        userFullNameFromAdminPanel: "Admin Panel Name",
      });
      expect(form.prefilledDataTransformer().officerFullName).toBe(
        "Admin Panel Name",
      );
    });

    test("is undefined when not in demo mode and user does not match a staff record", () => {
      createTestUnit("NOT-AN-OFFICER", { userFullName: "Some User" });
      expect(form.prefilledDataTransformer().officerFullName).toBeUndefined();
    });
  });

  describe("charge dates", () => {
    test("shows each charge's TDD on the same calendar day in a US time zone", () => {
      // the test setup configures UTC by default, which would mask a date-only
      // string being read as UTC midnight
      vi.stubEnv("TZ", "America/Chicago");

      const prefilled = form.prefilledDataTransformer();
      expect(prefilled.tdd0).toBe("Jan 1, 2025");
      expect(prefilled.tdd1).toBe("Mar 1, 2025");
    });
  });
});

describe("formContents", () => {
  test.each([
    [
      { usIaEarlyDischargeForms: {}, usIaEarlyDischargeV2: {} },
      "FormUsIaEarlyDischargeV2",
    ],
    [{ usIaEarlyDischargeForms: {} }, "FormUsIaEarlyDischargeProbation"],
  ])("with variants %o, returns %s", (featureVariants, expected) => {
    createTestUnit(undefined, { featureVariants });
    expect(form.formContents).toBe(expected);
  });
});

describe("charge selection", () => {
  test("starts every charge selected", () => {
    expect(form.isChargeSelected("CHARGE-001")).toBe(true);
  });

  test("treats a deselected charge as unselected", () => {
    vi.spyOn(form, "draftData", "get").mockReturnValue({
      "deselected-CHARGE-001": true,
    });
    expect(form.isChargeSelected("CHARGE-001")).toBe(false);
  });

  test("treats a charge with no draft field as selected", () => {
    vi.spyOn(form, "draftData", "get").mockReturnValue({});
    expect(form.isChargeSelected("CHARGE-001")).toBe(true);
  });

  test.each([
    [false, true],
    [true, deleteField()],
  ])(
    "setChargesSelected(%s) saves every deselection field as %s in one update",
    async (selected, fieldValue) => {
      vi.spyOn(form, "updateDraftDataFields").mockResolvedValue(undefined);
      await form.setChargesSelected(["CHARGE-001", "CHARGE-002"], selected);
      expect(form.updateDraftDataFields).toHaveBeenCalledTimes(1);
      expect(form.updateDraftDataFields).toHaveBeenCalledWith({
        "deselected-CHARGE-001": fieldValue,
        "deselected-CHARGE-002": fieldValue,
      });
    },
  );
});

describe("selectedChargesByJurisdiction", () => {
  let polk1: UsIaEarlyDischargeCharge;
  let polk2: UsIaEarlyDischargeCharge;
  let linn1: UsIaEarlyDischargeCharge;

  beforeEach(() => {
    const [baseCharge] = form.opportunity.record.formInformation.charges;
    const charge = (chargeExternalId: string, jurisdiction: string) => ({
      ...baseCharge,
      chargeExternalId,
      jurisdiction,
    });
    polk1 = charge("CHARGE-001", "POLK");
    polk2 = charge("CHARGE-002", "POLK");
    linn1 = charge("CHARGE-003", "LINN");

    vi.spyOn(form.opportunity, "chargesByJurisdiction", "get").mockReturnValue(
      new Map([
        ["POLK", [polk1, polk2]],
        ["LINN", [linn1]],
      ]),
    );
  });

  function deselect(...chargeExternalIds: string[]) {
    const draftData: Record<DeselectedChargeKey, boolean> = {};
    chargeExternalIds.forEach((id) => {
      draftData[deselectedChargeKey(id)] = true;
    });
    vi.spyOn(form, "draftData", "get").mockReturnValue(draftData);
  }

  test("includes every charge when nothing is deselected", () => {
    expect([...form.selectedChargesByJurisdiction]).toEqual([
      ["POLK", [polk1, polk2]],
      ["LINN", [linn1]],
    ]);
  });

  test("keeps a jurisdiction when only some of its charges are deselected", () => {
    deselect("CHARGE-001");
    expect([...form.selectedChargesByJurisdiction]).toEqual([
      ["POLK", [polk2]],
      ["LINN", [linn1]],
    ]);
  });

  test("drops a jurisdiction when all of its charges are deselected", () => {
    deselect("CHARGE-003");
    expect([...form.selectedChargesByJurisdiction]).toEqual([
      ["POLK", [polk1, polk2]],
    ]);
  });

  test("is empty when every charge is deselected", () => {
    deselect("CHARGE-001", "CHARGE-002", "CHARGE-003");
    expect(form.selectedChargesByJurisdiction.size).toBe(0);
  });

  test("ignores deselections for charges no longer on the record", () => {
    deselect("CHARGE-999");
    expect([...form.selectedChargesByJurisdiction]).toEqual([
      ["POLK", [polk1, polk2]],
      ["LINN", [linn1]],
    ]);
  });

  test("leaves a charge deselected if it leaves the record and returns", () => {
    deselect("CHARGE-003");
    vi.spyOn(form.opportunity, "chargesByJurisdiction", "get").mockReturnValue(
      new Map([["POLK", [polk1, polk2]]]),
    );
    expect(form.selectedChargesByJurisdiction.has("LINN")).toBe(false);

    vi.spyOn(form.opportunity, "chargesByJurisdiction", "get").mockReturnValue(
      new Map([
        ["POLK", [polk1, polk2]],
        ["LINN", [linn1]],
      ]),
    );
    expect(form.selectedChargesByJurisdiction.has("LINN")).toBe(false);
  });
});
