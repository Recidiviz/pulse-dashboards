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

import { addDays, startOfToday } from "date-fns";

import { ParoleHearing } from "~datatypes";

import { RootStore } from "../../../RootStore";
import { formatDateToISO } from "../../../utils";
import { ParoleOfflineAPIClient } from "../../api/ParoleOfflineAPIClient";
import { ParoleStore } from "../../ParoleStore";
import { ParoleDocketPresenter } from "../ParoleDocketPresenter";

// This presenter is tested against ParoleOfflineAPIClient's fixture data
// regardless of which tenants ParoleAPIClient supports for real data --
// force offline mode directly so that holds as SUPPORTED_TENANT_IDS grows
// (see ParoleAPIClient.ts).
import.meta.env["VITE_IS_OFFLINE"] = "true";

// Dated relative to today so they sit inside US_CO's docket window -- these
// exercise search and filter behavior, not the window (which has its own
// tests below).
const daysOut = (days: number) =>
  formatDateToISO(addDays(startOfToday(), days));

const TEST_HEARINGS: Array<ParoleHearing> = [
  {
    docId: "1",
    displayId: "91",
    individualName: "Anderson, Michael",
    hearingDate: daysOut(1),
    hearingType: "Parole Grant Hearing",
    facility: "Facility A",
  },
  {
    docId: "2",
    displayId: "92",
    individualName: "Brooks, Sarah",
    hearingDate: daysOut(2),
    hearingType: "Revocation Hearing",
    facility: "Facility B",
  },
  {
    docId: "3",
    displayId: "93",
    individualName: "Chen, David",
    hearingDate: daysOut(3),
    hearingType: "Parole Grant Hearing",
    facility: "Facility B",
  },
];

describe("ParoleDocketPresenter", () => {
  let paroleStore: ParoleStore;
  let presenter: ParoleDocketPresenter;

  beforeEach(() => {
    const rootStore = new RootStore();
    // hearings() is mocked in every test below except "hydrate", which hits
    // the real US_CO fixture, so a real Parole-enabled tenant is required.
    rootStore.tenantStore.currentTenantId = "US_CO";
    paroleStore = new ParoleStore(rootStore);
    presenter = new ParoleDocketPresenter(paroleStore);
  });

  test("hydrate", async () => {
    expect(presenter.hydrationState).toEqual({ status: "needs hydration" });

    const hydrationPromise = presenter.hydrate();
    expect(presenter.hydrationState).toEqual({ status: "loading" });

    await hydrationPromise;

    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  });

  test("hydration error", async () => {
    const err = new Error("fake error");
    vi.spyOn(ParoleOfflineAPIClient.prototype, "hearings").mockImplementation(
      () => {
        throw err;
      },
    );

    await presenter.hydrate();

    expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
  });

  describe("after hydration", () => {
    beforeEach(async () => {
      vi.spyOn(ParoleOfflineAPIClient.prototype, "hearings").mockResolvedValue(
        TEST_HEARINGS,
      );
      await presenter.hydrate();
    });

    it("exposes every hearing when no filters are selected", () => {
      expect(presenter.filteredHearings).toEqual(TEST_HEARINGS);
      expect(presenter.totalHearingsCount).toBe(3);
    });

    it("builds filter options from the unique facility/hearing type values", () => {
      expect(presenter.filterStore.filterConfig.filters).toEqual([
        {
          title: "Facility",
          type: "parole",
          field: "facility",
          options: [{ value: "Facility A" }, { value: "Facility B" }],
        },
        {
          title: "Hearing Type",
          type: "parole",
          field: "hearingType",
          options: [
            { value: "Parole Grant Hearing" },
            { value: "Revocation Hearing" },
          ],
        },
      ]);
    });

    it("filters hearings by a single selected field", () => {
      presenter.filterStore.setFilter("facility", { value: "Facility B" });

      expect(presenter.filteredHearings).toEqual([
        TEST_HEARINGS[1],
        TEST_HEARINGS[2],
      ]);
      // The total is unaffected by the active filter selection.
      expect(presenter.totalHearingsCount).toBe(3);
    });

    it("filters hearings by multiple selected fields, ANDed together", () => {
      presenter.filterStore.setFilter("facility", { value: "Facility B" });
      presenter.filterStore.setFilter("hearingType", {
        value: "Revocation Hearing",
      });

      expect(presenter.filteredHearings).toEqual([TEST_HEARINGS[1]]);
    });

    it("counts hearings matching a given option, ignoring the current filter selection", () => {
      presenter.filterStore.setFilter("facility", { value: "Facility A" });

      expect(
        presenter.numItems("parole", "facility", { value: "Facility B" }),
      ).toBe(2);
    });

    it("returns 0 from numItems for any filter type other than parole", () => {
      expect(
        presenter.numItems("person", "facility", { value: "Facility B" }),
      ).toBe(0);
    });

    it("filters hearings by search query matching name or DOC ID, case-insensitively", () => {
      presenter.setSearchQuery("brooks");
      expect(presenter.filteredHearings).toEqual([TEST_HEARINGS[1]]);

      presenter.setSearchQuery("2");
      expect(presenter.filteredHearings).toEqual([TEST_HEARINGS[1]]);
    });

    it("combines search query with selected filters, ANDed together", () => {
      presenter.setSearchQuery("chen");
      presenter.filterStore.setFilter("facility", { value: "Facility A" });

      expect(presenter.filteredHearings).toEqual([]);
    });
  });
});

describe("ParoleDocketPresenter docket display config", () => {
  it("exposes docketSubheading and docketSearchEnabled from the tenant's paroleConfig", () => {
    const rootStore = new RootStore();
    rootStore.tenantStore.currentTenantId = "US_CO";
    const presenter = new ParoleDocketPresenter(new ParoleStore(rootStore));

    expect(presenter.docketSubheading).toBe("Two Week Outlook");
    expect(presenter.docketSearchEnabled).toBe(true);
  });

  it("hides the subheading and search for tenants that don't configure them", () => {
    const rootStore = new RootStore();
    rootStore.tenantStore.currentTenantId = "US_ID";
    const presenter = new ParoleDocketPresenter(new ParoleStore(rootStore));

    expect(presenter.docketSubheading).toBeUndefined();
    expect(presenter.docketSearchEnabled).toBe(false);
  });
});

describe("ParoleDocketPresenter docket window", () => {
  async function hydratedPresenterFor(
    tenantId: "US_CO" | "US_ID",
    hearings: Array<ParoleHearing>,
  ) {
    const rootStore = new RootStore();
    rootStore.tenantStore.currentTenantId = tenantId;
    const presenter = new ParoleDocketPresenter(new ParoleStore(rootStore));
    vi.spyOn(ParoleOfflineAPIClient.prototype, "hearings").mockResolvedValue(
      hearings,
    );
    await presenter.hydrate();
    return presenter;
  }

  function hearingOn(docId: string, days: number): ParoleHearing {
    return {
      docId,
      // These tests only exercise date-window filtering; displayId's value
      // is never asserted on, so it's a fixed placeholder rather than
      // derived from docId.
      displayId: "unused-display-id",
      individualName: `Resident ${docId}`,
      hearingDate: daysOut(days),
      hearingType: "Parole Grant Hearing",
      facility: "Facility A",
    };
  }

  // US_CO looks 14 days ahead, US_ID 30 -- see each tenant's paroleConfig.
  it.each([
    ["US_CO", 14],
    ["US_ID", 30],
  ] as const)(
    "keeps a %s hearing on the last day of the window and drops the day after",
    async (tenantId, windowDaysAfter) => {
      const presenter = await hydratedPresenterFor(tenantId, [
        hearingOn("in", windowDaysAfter),
        hearingOn("out", windowDaysAfter + 1),
      ]);

      expect(presenter.filteredHearings.map((h) => h.docId)).toEqual(["in"]);
    },
  );

  // US_ID looks back 7 days; US_CO looks back 31 -- a full month, since its
  // scheduled hearing dates are truncated to the 1st of the month (see
  // us_co/parole_board_client_profile.py), so a hearing set for "this month"
  // must stay on the docket through the month's last day.
  it.each([
    ["US_CO", 31],
    ["US_ID", 7],
  ] as const)(
    "keeps a %s hearing on the first day of its look-back and drops the day before",
    async (tenantId, windowDaysBefore) => {
      const presenter = await hydratedPresenterFor(tenantId, [
        hearingOn("in", -windowDaysBefore),
        hearingOn("out", -(windowDaysBefore + 1)),
      ]);

      expect(presenter.filteredHearings.map((h) => h.docId)).toEqual(["in"]);
    },
  );

  it("counts and filter options describe the windowed set, not the whole one", async () => {
    const presenter = await hydratedPresenterFor("US_CO", [
      hearingOn("in", 3),
      { ...hearingOn("out", 40), facility: "Facility Z" },
    ]);

    expect(presenter.totalHearingsCount).toBe(1);
    expect(
      presenter.numItems("parole", "facility", { value: "Facility Z" }),
    ).toBe(0);
    expect(presenter.filterStore.filterConfig.filters).toEqual([
      {
        title: "Facility",
        type: "parole",
        field: "facility",
        options: [{ value: "Facility A" }],
      },
      {
        title: "Hearing Type",
        type: "parole",
        field: "hearingType",
        options: [{ value: "Parole Grant Hearing" }],
      },
    ]);
  });
});
