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

import { writeFileSync } from "fs";
import { mapValues } from "lodash";
import path from "path";

import { mockOpportunityConfigs } from "../src/core/__tests__/testUtils";

const pageConfigs = mapValues(
  mockOpportunityConfigs,
  (config) => config.urlSection,
);

writeFileSync(
  path.join(__dirname, "../src/cucumber/opportunityPageConfig.json"),
  JSON.stringify(pageConfigs),
);
