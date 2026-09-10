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
  caseNoteInsightsImportSchema,
  clientImportSchema,
  residentImportSchema,
  staffImportSchema,
} from "~@meetings/import/models";
import { transformAndLoadCaseNoteInsightsSummaryData } from "~@meetings/import/utils/caseNoteInsights";
import { transformAndLoadClientData } from "~@meetings/import/utils/clients";
import { transformAndLoadResidentData } from "~@meetings/import/utils/residents";
import { transformAndLoadStaffData } from "~@meetings/import/utils/staff";

// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/meetings/clients.py
export const CLIENTS_FILE_NAME = "clients.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/meetings/residents.py
export const RESIDENTS_FILE_NAME = "residents.json";
// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/meetings/staff.py
export const STAFF_FILE_NAME = "staff.json";
// TODO(#OBT-48016): Link to product view after it's been created.
export const CNI_EMPLOYMENT_FILE_NAME =
  "case_note_insights_employment_summary.json";
export const CNI_HOUSING_FILE_NAME = "case_note_insights_housing_summary.json";

// Exclude CNI files from the default list so they will only be imported via a
// manual command (prevents import job errors when CNI files don't exist in GCS yet,
// and to avoid clobbering "lastImportedAt" dates in the CNI summary db.
//
// TODO(OBT-48016): Remove this once CNI infra is out of "sandbox mode".
export const DEFAULT_IMPORT_FILE_NAMES = [
  CLIENTS_FILE_NAME,
  RESIDENTS_FILE_NAME,
  STAFF_FILE_NAME,
];

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
  [CNI_EMPLOYMENT_FILE_NAME]: {
    schema: caseNoteInsightsImportSchema,
    loaderFn: transformAndLoadCaseNoteInsightsSummaryData,
  },
  [CNI_HOUSING_FILE_NAME]: {
    schema: caseNoteInsightsImportSchema,
    loaderFn: transformAndLoadCaseNoteInsightsSummaryData,
  },
};
