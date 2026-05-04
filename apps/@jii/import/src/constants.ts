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

import { rnaWritebackSchema } from "./models";
import { transformAndLoadRNAWritebackData } from "./utils/usNcRNA";

// See view_id from https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/calculator/query/state/views/jii/us_nc_rna_writeback.py
export const NC_RNA_FILE_NAME = "us_nc_rna_writeback.json";

export const FILE_NAME_TO_SCHEMA_AND_LOADER_FN = {
  [NC_RNA_FILE_NAME]: {
    schema: rnaWritebackSchema,
    loaderFn: transformAndLoadRNAWritebackData,
  },
};
