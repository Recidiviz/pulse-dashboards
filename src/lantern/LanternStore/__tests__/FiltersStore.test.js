// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import RootStore from "../../../RootStore";
import LanternStore from "..";
import getDistrictKeyMap, {
  districtKeyMappings,
} from "../../../RootStore/TenantStore/districtKeyMappings";
import { LANTERN_TENANTS } from "../../../RootStore/TenantStore/lanternTenants";

jest.mock("../../../RootStore/TenantStore/districtKeyMappings");

let rootStore;

function getDistrictFilterKey(tenantId) {
  if (tenantId === "US_MO") return "levelOneSupervisionLocation";
  if (tenantId === "US_PA") return "levelTwoSupervisionLocation";
  return "district";
}
const defaultFilters = {
  chargeCategory: "All",
  metricPeriodMonths: "12",
  reportedViolations: "All",
  supervisionLevel: "All",
  supervisionType: "All",
  violationType: "All",
  levelOneSupervisionLocation: ["All"],
  levelTwoSupervisionLocation: ["All"],
  admissionType: ["All"],
};

// We are mocking the return of districtFilterKey to test the logic when there are
// different filter keys per tenant. This does not need to match the actual
// tenant mappings.
getDistrictKeyMap.mockImplementation((tenantId) => {
  const mappings = {
    ...districtKeyMappings,
    districtFilterKey: {
      US_MO: "levelOneSupervisionLocation",
      US_PA: "levelTwoSupervisionLocation",
    },
  };
  return {
    districtFilterKey: mappings.districtFilterKey[tenantId],
    districtFilterValueKey: mappings.districtFilterValueKey[tenantId],
    districtSecondaryLabelKey: mappings.districtSecondaryLabelKey[tenantId],
    districtPrimaryLabelKey: mappings.districtPrimaryLabelKey[tenantId],
    districtPrimaryIdKey: mappings.districtPrimaryIdKey[tenantId],
  };
});

describe("FiltersStore", () => {
  describe("default filter values", () => {
    it("are set correctly by default", () => {
      LANTERN_TENANTS.forEach((tenantId) => {
        rootStore = new LanternStore(RootStore);
        runInAction(() => {
          rootStore.districtsStore.isLoading = false;
          rootStore.tenantStore.setCurrentTenantId(tenantId);
          rootStore.tenantStore.currentTenantId = tenantId;
        });

        expect(rootStore.filtersStore.defaultFilterValues).toEqual(
          defaultFilters
        );
      });
    });

    it("sets the defaultFilters to restrictedDistrict if it exists", () => {
      const tenantId = "US_MO";
      const userDistrict = "99";

      rootStore = new LanternStore(RootStore);

      runInAction(() => {
        rootStore.tenantStore.currentTenantId = tenantId;
        rootStore.districtsStore.isLoading = false;
        rootStore.userRestrictedAccessStore.restrictedDistrict = userDistrict;
      });

      expect(
        rootStore.filtersStore.defaultFilterValues[
          getDistrictFilterKey(tenantId)
        ]
      ).toStrictEqual([userDistrict]);
    });

    it("clears the filter keys when switching tenants", () => {
      rootStore = new LanternStore(RootStore);
      const usMOFilterKey = getDistrictFilterKey("US_MO");
      const usPAFilterKey = getDistrictFilterKey("US_PA");

      // Set tenant to US_MO
      runInAction(() => {
        rootStore.districtsStore.isLoading = false;
        rootStore.tenantStore.currentTenantId = "US_MO";
      });

      // Expect default filters
      expect(rootStore.filtersStore.defaultFilterValues).toEqual(
        defaultFilters
      );

      // Set district filter for US_MO
      rootStore.filtersStore.setFilters({
        [usMOFilterKey]: ["01"],
      });

      // Expect level_1 filter set
      expect(
        Object.fromEntries(rootStore.filtersStore.filters)[usMOFilterKey]
      ).toEqual(["01"]);

      // Expect US_PA filter key to be "ALL"
      expect(rootStore.filtersStore.filters.get(usPAFilterKey)).toEqual([
        "All",
      ]);

      // Switch tenant to US_PA
      runInAction(() => {
        rootStore.tenantStore.currentTenantId = "US_PA";
      });

      // Set district filter for US_PA
      rootStore.filtersStore.setFilters({
        [usPAFilterKey]: ["10 - PHILADELPHIA"],
      });

      // Expect US_PA filter set to filter value
      expect(
        Object.fromEntries(rootStore.filtersStore.filters)[usPAFilterKey]
      ).toEqual(["10 - PHILADELPHIA"]);

      // Expect US_MO filter key to be "ALL"
      expect(rootStore.filtersStore.filters.get(usMOFilterKey)).toEqual([
        "All",
      ]);
    });
  });

  describe("districts filter", () => {
    const mockDistricts = [
      {
        level_2_supervision_location_external_id: "03",
        level_2_supervision_location_name: "HARRISBURG - 03",
        level_1_supervision_location_external_id: "03 - LANCASTER DO",
        level_1_supervision_location_name: "LANCASTER DO - 03",
      },
      {
        level_2_supervision_location_external_id: "03",
        level_2_supervision_location_name: "HARRISBURG - 03",
        level_1_supervision_location_external_id: "03 - YORK",
        level_1_supervision_location_name: "YORK - 03",
      },
      {
        level_2_supervision_location_external_id: "03",
        level_2_supervision_location_name: "HARRISBURG - 03",
        level_1_supervision_location_external_id: "03 - HARRISBURG",
        level_1_supervision_location_name: "HARRISBURG - 03",
      },
      {
        level_2_supervision_location_external_id: "CO",
        level_2_supervision_location_name: "CENTRAL OFFICE - CO",
        level_1_supervision_location_external_id: "CO - CENTRAL OFFICE",
        level_1_supervision_location_name: "CENTRAL OFFICE - CO",
      },
    ];

    beforeEach(() => {
      rootStore = new LanternStore(RootStore);
    });

    describe("when districts are loading", () => {
      const tenantId = "US_MO";
      it("returns an empty array", () => {
        runInAction(() => {
          rootStore.tenantStore.currentTenantId = tenantId;
          rootStore.districtsStore.isLoading = true;
        });
        expect(
          rootStore.filtersStore.filterOptions[getDistrictFilterKey(tenantId)]
            .options
        ).toEqual([]);
      });
    });

    describe("when districts are loaded", () => {
      describe("when there are nested options", () => {
        const tenantId = "US_PA";
        it("sets the district filter options to sorted unique values", () => {
          runInAction(() => {
            rootStore.districtsStore.apiData = { data: mockDistricts };
            rootStore.districtsStore.isLoading = false;
            rootStore.tenantStore.currentTenantId = tenantId;
          });
          expect(
            rootStore.filtersStore.filterOptions[getDistrictFilterKey(tenantId)]
              .options
          ).toEqual([
            {
              label: "CENTRAL OFFICE - CO",
              allSelectedLabel: "ALL",
              options: [
                {
                  label: "CENTRAL OFFICE - CO",
                  value: "CO - CENTRAL OFFICE",
                  secondaryValue: "CO",
                },
              ],
            },
            {
              label: "HARRISBURG - 03",
              allSelectedLabel: "ALL",
              options: [
                {
                  label: "HARRISBURG - 03",
                  value: "03 - HARRISBURG",
                  secondaryValue: "03",
                },
                {
                  label: "LANCASTER DO - 03",
                  value: "03 - LANCASTER DO",
                  secondaryValue: "03",
                },
                {
                  label: "YORK - 03",
                  value: "03 - YORK",
                  secondaryValue: "03",
                },
              ],
            },
          ]);
        });
      });

      describe("when there's only top level options", () => {
        const tenantId = "US_MO";
        it("sets the district filter options to sorted unique values", () => {
          runInAction(() => {
            rootStore.districtsStore.apiData = { data: mockDistricts };
            rootStore.districtsStore.isLoading = false;
            rootStore.tenantStore.currentTenantId = tenantId;
          });
          expect(
            rootStore.filtersStore.filterOptions[getDistrictFilterKey(tenantId)]
              .options
          ).toEqual([
            { value: "CO - CENTRAL OFFICE", label: "CENTRAL OFFICE - CO" },
            {
              label: "HARRISBURG - 03",
              value: "03 - HARRISBURG",
            },
            { value: "03 - LANCASTER DO", label: "LANCASTER DO - 03" },
            { value: "03 - YORK", label: "YORK - 03" },
          ]);
        });
      });
    });
  });
});
