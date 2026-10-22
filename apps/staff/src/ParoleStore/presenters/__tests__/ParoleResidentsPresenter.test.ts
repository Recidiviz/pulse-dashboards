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

import { ParoleFacility, ParoleResident } from "~datatypes";

import { RootStore } from "../../../RootStore";
import { ParoleOfflineAPIClient } from "../../api/ParoleOfflineAPIClient";
import { ParoleStore } from "../../ParoleStore";
import { ParoleResidentsPresenter } from "../ParoleResidentsPresenter";

const TEST_FACILITIES: Array<ParoleFacility> = [
  { facilityId: "FAC_A", name: "Facility A" },
  { facilityId: "FAC_B", name: "Facility B" },
];

const TEST_RESIDENTS: Array<ParoleResident> = [
  {
    pseudonymizedId: "1",
    displayId: "91",
    individualName: "Anderson, Michael",
    facilityId: "FAC_A",
    hearingDate: "2026-11-01",
  },
  {
    pseudonymizedId: "2",
    displayId: "92",
    individualName: "Brooks, Sarah",
    facilityId: "FAC_B",
  },
];

describe("ParoleResidentsPresenter", () => {
  let paroleStore: ParoleStore;
  let presenter: ParoleResidentsPresenter;

  beforeEach(() => {
    // See ParoleDocketPresenter.test.ts: tested against the offline client
    // regardless of which tenants have real data.
    vi.stubEnv("VITE_IS_OFFLINE", "true");

    const rootStore = new RootStore();
    rootStore.tenantStore.currentTenantId = "US_CO";
    paroleStore = new ParoleStore(rootStore);
    presenter = new ParoleResidentsPresenter(paroleStore);

    vi.spyOn(ParoleOfflineAPIClient.prototype, "facilities").mockResolvedValue(
      TEST_FACILITIES,
    );
    vi.spyOn(
      ParoleOfflineAPIClient.prototype,
      "residentsInFacilities",
    ).mockImplementation(async (facilityIds) =>
      TEST_RESIDENTS.filter((r) => facilityIds.includes(r.facilityId)),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("hydrating the page fetches facilities but no residents", async () => {
    await presenter.hydrate();

    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
    expect(presenter.facilities).toEqual(TEST_FACILITIES);
    expect(presenter.hasSelectedFacilities).toBe(false);
    expect(
      ParoleOfflineAPIClient.prototype.residentsInFacilities,
    ).not.toHaveBeenCalled();
  });

  test("a new selection needs its own hydration", async () => {
    await presenter.hydrate();

    presenter.setSelectedFacilityIds(["FAC_A"]);
    await presenter.residentsHydrator.hydrate();
    expect(presenter.residentsHydrator.hydrationState).toEqual({
      status: "hydrated",
    });

    presenter.setSelectedFacilityIds(["FAC_A", "FAC_B"]);
    expect(presenter.residentsHydrator.hydrationState).toEqual({
      status: "needs hydration",
    });

    await presenter.residentsHydrator.hydrate();
    expect(presenter.filteredResidents.map((r) => r.pseudonymizedId)).toEqual([
      "1",
      "2",
    ]);
  });

  test("labels each row with its facility's name", async () => {
    await presenter.hydrate();
    presenter.setSelectedFacilityIds(["FAC_B"]);
    await presenter.residentsHydrator.hydrate();

    expect(presenter.filteredResidents).toEqual([
      { ...TEST_RESIDENTS[1], facility: "Facility B" },
    ]);
  });

  test.each([
    ["name", "brooks"],
    ["DOC ID", "92"],
    ["prefixed DOC ID", "DOC-92"],
  ])("search matches by %s", async (_field, query) => {
    await presenter.hydrate();
    presenter.setSelectedFacilityIds(["FAC_A", "FAC_B"]);
    await presenter.residentsHydrator.hydrate();

    presenter.setSearchQuery(query);

    expect(presenter.filteredResidents.map((r) => r.pseudonymizedId)).toEqual([
      "2",
    ]);
    expect(presenter.totalResidentsCount).toBe(2);
  });

  test("adds the resident count to the header once facilities are selected", async () => {
    await presenter.hydrate();
    expect(presenter.headerText).toBe("All Residents");

    presenter.setSelectedFacilityIds(["FAC_A", "FAC_B"]);
    await presenter.residentsHydrator.hydrate();
    presenter.setSearchQuery("brooks");

    expect(presenter.headerText).toBe("All Residents (2)");
  });

  // The presenter is rebuilt each time the page mounts, as when the user
  // comes back from a case profile.
  test("a new presenter keeps the selection and its cached residents", async () => {
    await presenter.hydrate();
    presenter.setSelectedFacilityIds(["FAC_A"]);
    await presenter.residentsHydrator.hydrate();

    const returningPresenter = new ParoleResidentsPresenter(paroleStore);

    expect(returningPresenter.selectedFacilityIds).toEqual(["FAC_A"]);
    expect(returningPresenter.residentsHydrator.hydrationState).toEqual({
      status: "hydrated",
    });
  });
});
