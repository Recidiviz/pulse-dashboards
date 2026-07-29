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

import { ParoleHearing } from "~datatypes";

import { RootStore } from "../../../RootStore";
import { ParoleOfflineAPIClient } from "../../api/ParoleOfflineAPIClient";
import { ParoleStore } from "../../ParoleStore";
import { ParoleDocketPresenter } from "../ParoleDocketPresenter";

const TEST_HEARINGS: Array<ParoleHearing> = [
  {
    docId: "1",
    individualName: "Anderson, Michael",
    hearingDate: "2026-01-01",
    hearingType: "Parole Grant Hearing",
    facility: "Facility A",
  },
  {
    docId: "2",
    individualName: "Brooks, Sarah",
    hearingDate: "2026-01-02",
    hearingType: "Revocation Hearing",
    facility: "Facility B",
  },
  {
    docId: "3",
    individualName: "Chen, David",
    hearingDate: "2026-01-03",
    hearingType: "Parole Grant Hearing",
    facility: "Facility B",
  },
];

describe("ParoleDocketPresenter", () => {
  let paroleStore: ParoleStore;
  let presenter: ParoleDocketPresenter;

  beforeEach(() => {
    paroleStore = new ParoleStore(new RootStore());
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
  });
});
