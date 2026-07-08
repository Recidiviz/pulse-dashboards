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

import { runInAction } from "mobx";

import { SARDetailsFixture, StaffInfoFixture } from "../../api/offlineFixtures";
import { ORAS_EMPTY_FORM } from "../../components/OffenderAssessment/utils";
import { SARSection } from "../../components/SARDetails/constants";
import { SentencingStore } from "../../datastores/SentencingStore";
import { createMockSentencingStore } from "../../utils/test";
import { SARDetailsPresenter } from "../SARDetailsPresenter";

const sarId = "default";
let sentencingStore: SentencingStore;
let presenter: SARDetailsPresenter;

beforeEach(() => {
  sentencingStore = createMockSentencingStore();
  presenter = new SARDetailsPresenter(sentencingStore, sarId);

  vi.spyOn(sentencingStore.staffStore, "loadStaffInfo");
  vi.spyOn(sentencingStore.apiClient, "getSARDetails").mockResolvedValue(
    SARDetailsFixture[sarId],
  );
  vi.spyOn(sentencingStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );
});

afterEach(() => {
  presenter.dispose();
  vi.restoreAllMocks();
});

async function hydrateWithDeclined(declined: boolean) {
  vi.spyOn(sentencingStore.apiClient, "getSARDetails").mockResolvedValue({
    ...SARDetailsFixture[sarId],
    defendantDeclinedToParticipate: declined,
  });
  await presenter.hydrate();
}

describe("orasData", () => {
  it("returns null before hydration", () => {
    expect(presenter.orasData).toBeNull();
  });

  it("returns ORAS fields from SARData after hydration", async () => {
    vi.spyOn(sentencingStore.apiClient, "getSARDetails").mockResolvedValue({
      ...SARDetailsFixture[sarId],
      assessmentType: "ORAS_CST",
      assessmentScore: 10,
      criminalHistoryLevel: 3,
    });
    await presenter.hydrate();

    expect(presenter.orasData).toMatchObject({
      assessmentType: "ORAS_CST",
      assessmentScore: 10,
      criminalHistoryLevel: 3,
    });
  });
});

describe("saveORASData", () => {
  it("calls updateSARDetails with derived domain risk levels", async () => {
    vi.spyOn(sentencingStore.apiClient, "updateSARDetails").mockResolvedValue(
      undefined as never,
    );
    await presenter.hydrate();

    await presenter.saveORASData({
      ...ORAS_EMPTY_FORM,
      assessmentType: "ORAS_CST",
      assessmentDate: new Date("2025-01-01"),
      assessmentAdministeredBy: "Officer Smith",
      criminalHistoryLevel: 6, // 6/8 = 75% → HIGH
      educationLevelScore: 2, // 2/6 = 33.3% → MODERATE
    });

    expect(presenter.SARData).toBeDefined();
    expect(sentencingStore.apiClient.updateSARDetails).toHaveBeenCalledWith(
      presenter.SARData?.id,
      expect.objectContaining({
        criminalHistoryRiskLevel: "HIGH",
        educationRiskLevel: "MODERATE",
        familySocialSupportRiskLevel: null,
        ORASLastUpdatedAt: expect.any(Date),
      }),
    );
  });

  it("updates SARData locally after saving", async () => {
    vi.spyOn(sentencingStore.apiClient, "updateSARDetails").mockResolvedValue(
      undefined as never,
    );
    await presenter.hydrate();

    await presenter.saveORASData({
      ...ORAS_EMPTY_FORM,
      assessmentType: "ORAS_CST",
      assessmentDate: new Date("2025-06-01"),
      assessmentAdministeredBy: "Officer Smith",
    });

    expect(presenter.SARData?.assessmentType).toBe("ORAS_CST");
    expect(presenter.SARData?.assessmentAdministeredBy).toBe("Officer Smith");
    expect(presenter.SARData?.ORASLastUpdatedAt).toBeInstanceOf(Date);
  });
});

describe("defendant declined to participate", () => {
  describe("SARSections", () => {
    it("includes all sections when defendant has not declined", async () => {
      await hydrateWithDeclined(false);

      expect(presenter.SARSections).toContain(SARSection.KEY_CONSIDERATIONS);
      expect(presenter.SARSections).toContain(SARSection.DEFENDANTS_VERSION);
      expect(presenter.SARSections).toContain(SARSection.RECOMMENDATION);
    });

    it("excludes Key Considerations, Defendant's Version, and Recommendation when declined", async () => {
      await hydrateWithDeclined(true);

      expect(presenter.SARSections).not.toContain(
        SARSection.KEY_CONSIDERATIONS,
      );
      expect(presenter.SARSections).not.toContain(
        SARSection.DEFENDANTS_VERSION,
      );
      expect(presenter.SARSections).not.toContain(SARSection.RECOMMENDATION);
    });

    it("still includes Case Information, Victim Impact, Offender Assessment, Prior Treatment History, and Summary when declined", async () => {
      await hydrateWithDeclined(true);

      expect(presenter.SARSections).toContain(SARSection.CASE_INFORMATION);
      expect(presenter.SARSections).toContain(SARSection.VICTIM_IMPACT);
      expect(presenter.SARSections).toContain(SARSection.OFFENDER_ASSESSMENT);
      expect(presenter.SARSections).toContain(
        SARSection.PRIOR_TREATMENT_HISTORY,
      );
      expect(presenter.SARSections).toContain(SARSection.SUMMARY);
    });
  });

  describe("hasOrasAssessment", () => {
    it("returns false when declined even if assessmentDate is set", async () => {
      vi.spyOn(sentencingStore.apiClient, "getSARDetails").mockResolvedValue({
        ...SARDetailsFixture[sarId],
        defendantDeclinedToParticipate: true,
        assessmentDate: new Date("2025-01-01"),
      });
      await presenter.hydrate();

      expect(presenter.hasOrasAssessment).toBe(false);
    });

    it("returns true when not declined and assessmentDate is set", async () => {
      vi.spyOn(sentencingStore.apiClient, "getSARDetails").mockResolvedValue({
        ...SARDetailsFixture[sarId],
        defendantDeclinedToParticipate: false,
        assessmentDate: new Date("2025-01-01"),
      });
      await presenter.hydrate();

      expect(presenter.hasOrasAssessment).toBe(true);
    });
  });

  describe("sectionStatuses", () => {
    it("marks Key Considerations, Defendant's Version, and Recommendation as complete when declined", async () => {
      await hydrateWithDeclined(true);

      expect(presenter.sectionStatuses[SARSection.KEY_CONSIDERATIONS]).toBe(
        "complete",
      );
      expect(presenter.sectionStatuses[SARSection.DEFENDANTS_VERSION]).toBe(
        "complete",
      );
      expect(presenter.sectionStatuses[SARSection.RECOMMENDATION]).toBe(
        "complete",
      );
    });

    it("marks Prior Treatment History as complete when declined (regardless of summary content)", async () => {
      vi.spyOn(sentencingStore.apiClient, "getSARDetails").mockResolvedValue({
        ...SARDetailsFixture[sarId],
        defendantDeclinedToParticipate: true,
        priorTreatmentHistorySummary: null,
      });
      await presenter.hydrate();

      expect(
        presenter.sectionStatuses[SARSection.PRIOR_TREATMENT_HISTORY],
      ).toBe("complete");
    });

    it("Prior Treatment History status reflects content when not declined", async () => {
      vi.spyOn(sentencingStore.apiClient, "getSARDetails").mockResolvedValue({
        ...SARDetailsFixture[sarId],
        defendantDeclinedToParticipate: false,
        priorTreatmentHistorySummary: null,
      });
      await presenter.hydrate();

      expect(
        presenter.sectionStatuses[SARSection.PRIOR_TREATMENT_HISTORY],
      ).toBe("empty");
    });
  });

  describe("overallProgress", () => {
    it("excludes declined sections from the total field count", async () => {
      await hydrateWithDeclined(false);
      const progressNotDeclined = presenter.overallProgress;

      runInAction(() => {
        if (presenter.SARData) {
          presenter.SARData.defendantDeclinedToParticipate = true;
        }
      });
      const progressDeclined = presenter.overallProgress;

      // Declining removes Key Considerations, Defendant's Version, Recommendation,
      // and Prior Treatment History from the total, so the denominator shrinks —
      // the same amount of completed fields results in a higher percentage.
      expect(progressDeclined).toBeGreaterThanOrEqual(progressNotDeclined);
    });
  });

  describe("employmentHistories", () => {
    const manualRecord = {
      id: "emp-1",
      employerName: "Acme Corp",
      startDate: null,
      endDate: null,
      verifiedByReportAuthor: null,
      importedFromDOC: false,
    };
    const importedRecord = {
      id: "emp-2",
      employerName: "DOC Employer",
      startDate: null,
      endDate: null,
      verifiedByReportAuthor: null,
      importedFromDOC: true,
    };

    beforeEach(() => {
      vi.spyOn(sentencingStore.apiClient, "getSARDetails").mockResolvedValue({
        ...SARDetailsFixture[sarId],
        employmentHistories: [manualRecord, importedRecord],
      });
    });

    it("filters out importedFromDOC records when variant is off", async () => {
      await presenter.hydrate();
      expect(presenter.employmentHistories).toEqual([manualRecord]);
    });

    it("returns all records including importedFromDOC when variant is on", async () => {
      // Mutate the mock userStore before any computed access so MobX evaluates
      // the non-observable activeFeatureVariants with the updated value.
      sentencingStore.rootStore.userStore.activeFeatureVariants = {
        SARImportEmploymentRecords: {},
      };
      await presenter.hydrate();
      expect(presenter.employmentHistories).toEqual([
        manualRecord,
        importedRecord,
      ]);
    });

    it("sorts manual and imported records by start date, most recent first", async () => {
      const olderImportedRecord = {
        ...importedRecord,
        id: "emp-3",
        startDate: new Date("2018-01-01"),
      };
      const recentManualRecord = {
        ...manualRecord,
        id: "emp-4",
        startDate: new Date("2024-01-01"),
      };
      sentencingStore.rootStore.userStore.activeFeatureVariants = {
        SARImportEmploymentRecords: {},
      };
      vi.spyOn(sentencingStore.apiClient, "getSARDetails").mockResolvedValue({
        ...SARDetailsFixture[sarId],
        employmentHistories: [
          olderImportedRecord,
          manualRecord,
          recentManualRecord,
        ],
      });

      await presenter.hydrate();

      expect(presenter.employmentHistories.map((h) => h.id)).toEqual([
        "emp-4", // 2024, manual
        "emp-3", // 2018, imported
        "emp-1", // no start date, manual
      ]);
    });
  });
});
