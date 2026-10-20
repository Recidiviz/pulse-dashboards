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

import { UsMaTFunction } from "~@jii/translation";

import { loadUsMaTranslations } from "../../__tests__/testUtils";
import { buildContactInformation } from "../utils";

let t: UsMaTFunction;

beforeAll(async () => {
  t = await loadUsMaTranslations();
});

const rowsFor = (
  overrides: Partial<Parameters<typeof buildContactInformation>[0]> = {},
) =>
  buildContactInformation(
    { addresses: [], county: undefined, ...overrides },
    t,
  ).map(({ label, value }) => [label, value]);

describe("buildContactInformation", () => {
  test("shows the address and county", () => {
    expect(
      rowsFor({
        addresses: [{ id: 1, address: "1 Main St, Springfield, MA 01101" }],
        county: "Hampden",
      }),
    ).toEqual([
      ["Address", "1 Main St, Springfield, MA 01101"],
      ["County", "Hampden"],
    ]);
  });

  test("shows n/a for a missing address or county", () => {
    expect(rowsFor()).toEqual([
      ["Address", "n/a"],
      ["County", "n/a"],
    ]);
  });

  test("shows only the first address", () => {
    expect(
      rowsFor({
        addresses: [
          { id: 1, address: "1 Main St" },
          { id: 2, address: "2 Elm St" },
        ],
        county: "Suffolk",
      }),
    ).toEqual([
      ["Address", "1 Main St"],
      ["County", "Suffolk"],
    ]);
  });
});
