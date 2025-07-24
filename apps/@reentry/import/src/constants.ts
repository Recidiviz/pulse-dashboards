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
  staffImportSchema,
} from "~@reentry/import/models";
import { transformAndLoadClientData } from "~@reentry/import/utils/clients";
import { transformAndLoadStaffData } from "~@reentry/import/utils/staff";

// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/reentry/client.py
export const CLIENTS_FILE_NAME = "client.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/reentry/case_manager.py
export const CASE_MANAGERS_FILE_NAME = "case_manager.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/reentry/supervision_officer.py
export const SUPERVISION_OFFICERS_FILE_NAME = "supervision_officer.json";

export const FILE_NAME_TO_SCHEMA_AND_LOADER_FN = {
  [CLIENTS_FILE_NAME]: {
    schema: clientImportSchema,
    loaderFn: transformAndLoadClientData,
  },
  [CASE_MANAGERS_FILE_NAME]: {
    schema: staffImportSchema,
    loaderFn: transformAndLoadStaffData,
  },
  [SUPERVISION_OFFICERS_FILE_NAME]: {
    schema: staffImportSchema,
    loaderFn: transformAndLoadStaffData,
  },
};
