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

import { configure, runInAction } from "mobx";

import { AdjudicationStatusValue } from "../../../../FirestoreStore";
import { RootStore } from "../../../../RootStore";
import AnalyticsStore from "../../../../RootStore/AnalyticsStore";
import { Client } from "../../../Client";
import { DocumentSubscription } from "../../../subscriptions";
import { dateToTimestamp } from "../../../utils";
import { ineligibleClientRecord } from "../../__fixtures__";
import { UsNcCreditReductionReviewOpportunity } from "../UsNcCreditReductionReviewOpportunity";

vi.mock("../../../subscriptions");

const mockUpdateLog = {
  by: "officer@nc.gov",
  date: dateToTimestamp("2026-01-01"),
};

let opp: UsNcCreditReductionReviewOpportunity;
let updatesSub: DocumentSubscription<any>;

function createTestUnit() {
  const root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  const client = new Client(
    { ...ineligibleClientRecord, stateCode: "US_NC" },
    root,
  );
  const record = {
    stateCode: "US_NC",
    externalId: "crr-001",
    eligibleCriteria: {},
    ineligibleCriteria: {},
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
    metadata: {},
  };
  return new UsNcCreditReductionReviewOpportunity(client, record);
}

beforeEach(() => {
  configure({ safeDescriptors: false });
  opp = createTestUnit();
  updatesSub = opp.updatesSubscription;
  runInAction(() => {
    updatesSub.hydrationState = { status: "hydrated" };
  });
});

afterEach(() => {
  vi.resetAllMocks();
  configure({ safeDescriptors: true });
});

describe("tabTitle", () => {
  describe("when adjudicationStatus is set", () => {
    const cases: AdjudicationStatusValue[] = [
      "Approved",
      "Partially Approved",
      "Denied",
    ];

    test.each(cases)("returns %s", (status) => {
      runInAction(() => {
        updatesSub.data = {
          adjudicationStatus: { ...mockUpdateLog, adjudicationStatus: status },
        };
      });
      expect(opp.tabTitle()).toBe(status);
    });

    test("adjudicationStatus takes priority over submitted", () => {
      runInAction(() => {
        updatesSub.data = {
          submitted: mockUpdateLog,
          adjudicationStatus: {
            ...mockUpdateLog,
            adjudicationStatus: "Approved",
          },
        };
      });
      expect(opp.tabTitle()).toBe("Approved");
    });

    test("adjudicationStatus takes priority over denial", () => {
      runInAction(() => {
        updatesSub.data = {
          denial: { reasons: ["INELIGIBLE"], updated: mockUpdateLog },
          adjudicationStatus: {
            ...mockUpdateLog,
            adjudicationStatus: "Partially Approved",
          },
        };
      });
      expect(opp.tabTitle()).toBe("Partially Approved");
    });
  });

  describe("when adjudicationStatus is not set", () => {
    test("returns Marked Ineligible when denied", () => {
      runInAction(() => {
        updatesSub.data = {
          denial: { reasons: ["INELIGIBLE"], updated: mockUpdateLog },
        };
      });
      expect(opp.tabTitle()).toBe("Marked Ineligible");
    });
  });
});

describe("eligibilityStatusLabel", () => {
  const cases: AdjudicationStatusValue[] = [
    "Approved",
    "Partially Approved",
    "Denied",
  ];

  test.each(cases)("returns %s when adjudicationStatus is set", (status) => {
    runInAction(() => {
      updatesSub.data = {
        adjudicationStatus: { ...mockUpdateLog, adjudicationStatus: status },
      };
    });
    expect(opp.eligibilityStatusLabel()).toBe(status);
  });

  test("falls back to base logic when adjudicationStatus is not set", () => {
    runInAction(() => {
      updatesSub.data = {
        denial: { reasons: ["INELIGIBLE"], updated: mockUpdateLog },
      };
    });
    expect(opp.eligibilityStatusLabel()).toBe("Indefinitely ineligible");
  });
});

describe("customStatusPalette", () => {
  test("returns eligible (GREEN) when Approved", () => {
    runInAction(() => {
      updatesSub.data = {
        adjudicationStatus: {
          ...mockUpdateLog,
          adjudicationStatus: "Approved",
        },
      };
    });
    expect(opp.customStatusPalette?.palette).toBe("GREEN");
  });

  test("returns almostEligible (YELLOW) when Partially Approved", () => {
    runInAction(() => {
      updatesSub.data = {
        adjudicationStatus: {
          ...mockUpdateLog,
          adjudicationStatus: "Partially Approved",
        },
      };
    });
    expect(opp.customStatusPalette?.palette).toBe("YELLOW");
  });

  test("returns denied (RED) when Denied", () => {
    runInAction(() => {
      updatesSub.data = {
        adjudicationStatus: {
          ...mockUpdateLog,
          adjudicationStatus: "Denied",
        },
      };
    });
    expect(opp.customStatusPalette?.palette).toBe("RED");
  });

  test("returns undefined when adjudicationStatus is not set", () => {
    runInAction(() => {
      updatesSub.data = undefined;
    });
    expect(opp.customStatusPalette).toBeUndefined();
  });
});

describe("setAdjudicationStatus", () => {
  test.each(["Approved", "Partially Approved", "Denied"] as const)(
    "calls firestoreStore.updateAdjudicationStatus with status %s",
    async (status) => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(
        opp.rootStore.firestoreStore,
        "updateAdjudicationStatus",
      ).mockImplementation(mockUpdate);

      await opp.setAdjudicationStatus(status);

      expect(mockUpdate).toHaveBeenCalledWith(
        opp.currentUserEmail,
        opp,
        status,
      );
    },
  );
});

describe("deleteAdjudicationStatus", () => {
  test("calls firestoreStore.deleteAdjudicationStatus", async () => {
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(
      opp.rootStore.firestoreStore,
      "deleteAdjudicationStatus",
    ).mockImplementation(mockDelete);

    await opp.deleteAdjudicationStatus();

    expect(mockDelete).toHaveBeenCalledWith(opp);
  });
});

describe("markSubmitted", () => {
  beforeEach(() => {
    vi.spyOn(
      opp.rootStore.firestoreStore,
      "updateOpportunitySubmitted",
    ).mockResolvedValue(undefined);
    vi.spyOn(
      AnalyticsStore.prototype,
      "trackOpportunityMarkedSubmitted",
    ).mockImplementation(vi.fn());
  });

  test("clears adjudicationStatus when set", async () => {
    runInAction(() => {
      updatesSub.data = {
        adjudicationStatus: {
          ...mockUpdateLog,
          adjudicationStatus: "Approved",
        },
      };
    });
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(opp, "deleteAdjudicationStatus").mockImplementation(mockDelete);

    await opp.markSubmitted("US_NC");

    expect(mockDelete).toHaveBeenCalled();
  });

  test("does not call deleteAdjudicationStatus when not set", async () => {
    runInAction(() => {
      updatesSub.data = undefined;
    });
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(opp, "deleteAdjudicationStatus").mockImplementation(mockDelete);

    await opp.markSubmitted("US_NC");

    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe("setDenialReasons", () => {
  beforeEach(() => {
    vi.spyOn(
      Object.getPrototypeOf(UsNcCreditReductionReviewOpportunity.prototype),
      "setDenialReasons",
    ).mockResolvedValue(undefined);
  });

  test("clears adjudicationStatus when marking ineligible", async () => {
    runInAction(() => {
      updatesSub.data = {
        adjudicationStatus: {
          ...mockUpdateLog,
          adjudicationStatus: "Approved",
        },
      };
    });
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(opp, "deleteAdjudicationStatus").mockImplementation(mockDelete);

    await opp.setDenialReasons(["INELIGIBLE"]);

    expect(mockDelete).toHaveBeenCalled();
  });

  test("does not clear adjudicationStatus when undoing denial (empty reasons)", async () => {
    runInAction(() => {
      updatesSub.data = {
        adjudicationStatus: {
          ...mockUpdateLog,
          adjudicationStatus: "Approved",
        },
        denial: { reasons: ["INELIGIBLE"], updated: mockUpdateLog },
      };
    });
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(opp, "deleteAdjudicationStatus").mockImplementation(mockDelete);

    await opp.setDenialReasons([]);

    expect(mockDelete).not.toHaveBeenCalled();
  });

  test("does not clear adjudicationStatus when adjudicationStatus is not set", async () => {
    runInAction(() => {
      updatesSub.data = undefined;
    });
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(opp, "deleteAdjudicationStatus").mockImplementation(mockDelete);

    await opp.setDenialReasons(["INELIGIBLE"]);

    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe("deleteSubmitted", () => {
  beforeEach(() => {
    vi.spyOn(
      Object.getPrototypeOf(UsNcCreditReductionReviewOpportunity.prototype),
      "deleteSubmitted",
    ).mockResolvedValue(undefined);
  });

  test("clears action history when grant is approved", async () => {
    vi.spyOn(opp, "isGrantApproved", "get").mockReturnValue(true);
    const mockDeleteHistory = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(opp, "deleteActionHistory").mockImplementation(mockDeleteHistory);

    await opp.deleteSubmitted();

    expect(mockDeleteHistory).toHaveBeenCalled();
  });

  test("does not clear action history when grant is not approved", async () => {
    vi.spyOn(opp, "isGrantApproved", "get").mockReturnValue(false);
    const mockDeleteHistory = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(opp, "deleteActionHistory").mockImplementation(mockDeleteHistory);

    await opp.deleteSubmitted();

    expect(mockDeleteHistory).not.toHaveBeenCalled();
  });
});
