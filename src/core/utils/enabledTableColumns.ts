// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
  US_ID,
  US_ME,
  US_ND,
  US_TN,
} from "../../RootStore/TenantStore/pathwaysTenants";
import { TableColumns } from "../types/charts";

export const DefaultTableColumns: TableColumns = {
  prisonPopulationPersonLevel: [
    {
      Header: "Name",
      accessor: "fullName",
      titleCase: true,
      width: 150,
    },
    {
      Header: "DOC ID",
      accessor: "stateId",
      titleCase: false,
      width: 100,
    },
    {
      Header: "Gender",
      accessor: "gender",
      titleCase: true,
      width: 80,
    },
    {
      Header: "Age",
      accessor: "age",
      titleCase: false,
      width: 80,
    },
    {
      Header: "Facility",
      accessor: "facility",
      titleCase: false,
      width: 80,
    },
    {
      Header: "Admission Reason",
      accessor: "legalStatus",
      titleCase: true,
    },
  ],
  prisonToSupervisionPopulationPersonLevel: [
    {
      Header: "Name",
      accessor: "fullName",
      titleCase: true,
      width: 150,
    },
    {
      Header: "DOC ID",
      accessor: "stateId",
      titleCase: false,
      width: 100,
    },
    {
      Header: "Gender",
      accessor: "gender",
      titleCase: true,
      width: 80,
    },
    {
      Header: "Age",
      accessor: "age",
      titleCase: false,
      width: 80,
    },
    {
      Header: "Facility",
      accessor: "facility",
      titleCase: false,
      width: 100,
    },
  ],
};

export const IdEnabledTableColumns: TableColumns = {
  ...DefaultTableColumns,
};

export const TnEnabledTableColumns: TableColumns = {
  ...DefaultTableColumns,
};

export const MeEnabledTableColumns: TableColumns = {
  prisonPopulationPersonLevel: DefaultTableColumns.prisonPopulationPersonLevel,
};

export const NdEnabledTableColumns: TableColumns = {
  ...DefaultTableColumns,
};

export default {
  [US_ID]: IdEnabledTableColumns,
  [US_TN]: TnEnabledTableColumns,
  [US_ME]: MeEnabledTableColumns,
  [US_ND]: NdEnabledTableColumns,
} as const;
