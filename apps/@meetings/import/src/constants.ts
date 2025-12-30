// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
  clientImportSchema,
  residentImportSchema,
  staffImportSchema,
} from "~@meetings/import/models";
import { transformAndLoadClientData } from "~@meetings/import/utils/clients";
import { transformAndLoadResidentData } from "~@meetings/import/utils/residents";
import { transformAndLoadStaffData } from "~@meetings/import/utils/staff";

// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/meetings/clients.py
export const CLIENTS_FILE_NAME = "clients.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/meetings/residents.py
export const RESIDENTS_FILE_NAME = "residents.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/meetings/staff.py
export const STAFF_FILE_NAME = "staff.json";

export const FILE_NAME_TO_SCHEMA_AND_LOADER_FN = {
  [CLIENTS_FILE_NAME]: {
    schema: clientImportSchema,
    loaderFn: transformAndLoadClientData,
  },
  [RESIDENTS_FILE_NAME]: {
    schema: residentImportSchema,
    loaderFn: transformAndLoadResidentData,
  },
  [STAFF_FILE_NAME]: {
    schema: staffImportSchema,
    loaderFn: transformAndLoadStaffData,
  },
};
