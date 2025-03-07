// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { render } from "@testing-library/react";
import { observable } from "mobx";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import mockWithTestId from "../../../__helpers__/mockWithTestId";
import StoreProvider from "../../components/StoreProvider";
import filterOptionsMap from "../../RootStore/TenantStore/filterOptions";
import { US_MO } from "../../RootStore/TenantStore/lanternTenants";
import { setTranslateLocale } from "../../utils/i18nSettings";
import CaseTable from "../CaseTable/CaseTable";
import AdmissionTypeFilter from "../FiltersBar/AdmissionTypeFilter";
import DistrictFilter from "../FiltersBar/DistrictFilter";
import SelectFilter from "../FiltersBar/SelectFilter";
import ViolationFilter from "../FiltersBar/ViolationFilter";
import { useLanternStore } from "../LanternStoreProvider";
import Matrix from "../Matrix";
import RevocationCharts from "../RevocationCharts";
import Revocations from "../Revocations";
import RevocationsOverTime from "../RevocationsOverTime";
import {
  ADMISSION_TYPE,
  CHARGE_CATEGORY,
  SUPERVISION_LEVEL,
  SUPERVISION_TYPE,
} from "../utils/constants";

const METADATA_NAMESPACE = import.meta.env.VITE_METADATA_NAMESPACE;

vi.mock("../FiltersBar/SelectFilter");
vi.mock("../FiltersBar/DistrictFilter");
vi.mock("../FiltersBar/AdmissionTypeFilter");
vi.mock("../FiltersBar/ViolationFilter");
vi.mock("../RevocationsOverTime");
vi.mock("../Matrix");
vi.mock("../RevocationCharts");
vi.mock("../CaseTable/CaseTable");
vi.mock("../../RootStore/TenantStore/filterOptions");
vi.mock("../LanternStoreProvider");

describe("Revocations component tests", () => {
  const metadataField = `${METADATA_NAMESPACE}app_metadata`;
  const mockTenantId = "TEST_TENANT";
  const mockUser = { [metadataField]: { stateCode: mockTenantId } };
  const filtersBarIdPrefix = "filters-bar-";
  const DistrictFilterId = "district-filter";
  const admissionTypeFilterId = "admission-type-filter";
  const violationFilterId = "violation-filter-id";
  const revocationsOverTimeId = "revocations-over-time";
  const revocationMatrixId = "revocation-matrix";
  const revocationChartsId = "revocation-charts";
  const caseTableId = "case-table";

  const DistrictFilterMock = DistrictFilter.type;
  const RevocationsOverTimeMock = RevocationsOverTime.type;
  const MatrixMock = Matrix.type;
  const CaseTableMock = CaseTable.type;
  const SelectFilterMock = SelectFilter.type;
  const AdmissionTypeFilterMock = AdmissionTypeFilter.type;
  const ViolationFilterMock = ViolationFilter.type;
  const RevocationChartsMock = RevocationCharts.type;

  beforeEach(() => {
    SelectFilterMock.mockImplementation(({ label }) =>
      mockWithTestId(`${filtersBarIdPrefix}${label}`),
    );
    DistrictFilterMock.mockReturnValue(mockWithTestId(DistrictFilterId));
    AdmissionTypeFilterMock.mockReturnValue(
      mockWithTestId(admissionTypeFilterId),
    );
    ViolationFilterMock.mockReturnValue(mockWithTestId(violationFilterId));
    RevocationsOverTimeMock.mockReturnValue(
      mockWithTestId(revocationsOverTimeId),
    );
    MatrixMock.mockReturnValue(mockWithTestId(revocationMatrixId));
    RevocationChartsMock.mockReturnValue(mockWithTestId(revocationChartsId));
    CaseTableMock.mockReturnValue(mockWithTestId(caseTableId));
    setTranslateLocale(US_MO);

    useLanternStore.mockReturnValue({
      userStore: { user: mockUser, isAuthorized: true },
      currentTenantId: US_MO,
      userRestrictionsStore: { allowedSupervisionLocationIds: [] },
      filtersStore: {
        filters: observable.map({
          metricPeriodMonths: "",
          chargeCategory: "",
          reportedViolation: "",
          violationtype: "",
          supervisionLevel: "",
          supervisionType: "",
          admissionType: "",
          district: "",
        }),
        filterOptions: filterOptionsMap[mockTenantId],
      },
    });
  });

  it("should render Revocations component with proper filters and charts", () => {
    const { getByTestId } = render(
      <StoreProvider>
        <MemoryRouter>
          <Revocations />
        </MemoryRouter>
      </StoreProvider>,
    );

    expect(getByTestId(`${filtersBarIdPrefix}Time Period`)).toBeInTheDocument();
    expect(getByTestId(`${filtersBarIdPrefix}Case Type`)).toBeInTheDocument();
    expect(
      getByTestId(`${filtersBarIdPrefix}Supervision Type`),
    ).toBeInTheDocument();
    expect(
      getByTestId(`${filtersBarIdPrefix}Supervision Level`),
    ).toBeInTheDocument();

    expect(getByTestId(DistrictFilterId)).toBeInTheDocument();
    expect(getByTestId(admissionTypeFilterId)).toBeInTheDocument();
    expect(getByTestId(violationFilterId)).toBeInTheDocument();
    expect(getByTestId(revocationsOverTimeId)).toBeInTheDocument();
    expect(getByTestId(revocationMatrixId)).toBeInTheDocument();
    expect(getByTestId(revocationChartsId)).toBeInTheDocument();
    expect(getByTestId(caseTableId)).toBeInTheDocument();
  });

  it("should not render supervision type and supervision level if they are not enabled", () => {
    filterOptionsMap[mockTenantId][SUPERVISION_LEVEL].componentEnabled = false;
    filterOptionsMap[mockTenantId][SUPERVISION_TYPE].componentEnabled = false;
    filterOptionsMap[mockTenantId][CHARGE_CATEGORY].componentEnabled = false;
    filterOptionsMap[mockTenantId][ADMISSION_TYPE].componentEnabled = false;
    const { queryByTestId } = render(
      <StoreProvider>
        <MemoryRouter>
          <Revocations />
        </MemoryRouter>
      </StoreProvider>,
    );

    expect(queryByTestId(`${filtersBarIdPrefix}Supervision Level`)).toBeNull();
    expect(queryByTestId(`${filtersBarIdPrefix}Supervision Type`)).toBeNull();
    expect(queryByTestId(`${filtersBarIdPrefix}Case Type`)).toBeNull();
    expect(queryByTestId(admissionTypeFilterId)).toBeNull();
  });
});
