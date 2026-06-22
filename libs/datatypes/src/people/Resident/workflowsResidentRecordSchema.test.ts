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

import { rawAllResidents } from "./fixtures";
import { stateMetadataSchemas } from "./stateMetadataSchemas";
import { workflowsResidentRecordSchema } from "./workflowsResidentRecordSchema";

const statesWithMetadata: string[] = stateMetadataSchemas.map(
  (s) => s.shape.stateCode.value,
);

test.each(rawAllResidents)(
  "schema for $stateCode $personExternalId",
  (input) => {
    const output = workflowsResidentRecordSchema.parse(input);
    expect(output).toMatchSnapshot();

    // Residents in state with defined metadata schemas must have non-empty metadata
    if (statesWithMetadata.includes(input.stateCode)) {
      expect(output.metadata.stateCode).toBeDefined();
    }
  },
);
