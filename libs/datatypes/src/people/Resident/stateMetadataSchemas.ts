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

import { usArResidentMetadataSchema } from "./US_AR/metadata/schema";
import { usAzResidentMetadataSchema } from "./US_AZ/metadata/schema";
import { usCoResidentJiiDataSchema } from "./US_CO/metadata/schema";
import { usIdResidentMetadataSchema } from "./US_ID/metadata/schema";
import { usMaResidentJiiDataSchema } from "./US_MA/metadata/schema";
import { usMeResidentMetadataSchema } from "./US_ME/metadata/schema";
import { usMiResidentMetadataSchema } from "./US_MI/metadata/schema";
import { usMoResidentMetadataSchema } from "./US_MO/metadata/schema";
import { usNcResidentMetadataSchema } from "./US_NC/metadata/schema";
import { usNdResidentMetadataSchema } from "./US_ND/metadata/schema";
import { usNeResidentMetadataSchema } from "./US_NE/metadata/schema";
import { usTnResidentMetadataSchema } from "./US_TN/metadata/schema";
import { usUtResidentMetadataSchema } from "./US_UT/metadata/schema";

export const stateMetadataSchemas = [
  usArResidentMetadataSchema,
  usAzResidentMetadataSchema,
  usCoResidentJiiDataSchema,
  usIdResidentMetadataSchema,
  usMeResidentMetadataSchema,
  usMaResidentJiiDataSchema,
  usMiResidentMetadataSchema,
  usMoResidentMetadataSchema,
  usNcResidentMetadataSchema,
  usNdResidentMetadataSchema,
  usNeResidentMetadataSchema,
  usTnResidentMetadataSchema,
  usUtResidentMetadataSchema,
] as const;
