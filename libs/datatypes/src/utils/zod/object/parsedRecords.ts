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

import { ParsedRecord } from "../../types";

export function inputFixture<PR extends ParsedRecord>(
  fixture: PR,
): PR["input"] {
  return fixture.input;
}

export function inputFixtureArray<PR extends ParsedRecord>(
  fixtures: Array<PR>,
): Array<PR["input"]> {
  return fixtures.map(inputFixture);
}

export function outputFixture<PR extends ParsedRecord>(
  fixture: PR,
): PR["output"] {
  return fixture.output;
}

export function outputFixtureArray<PR extends ParsedRecord>(
  fixtures: Array<PR>,
): Array<PR["output"]> {
  return fixtures.map(outputFixture);
}
