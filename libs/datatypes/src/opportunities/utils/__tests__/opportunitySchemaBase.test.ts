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

import { opportunitySchemaBase } from "~datatypes";

const baseRecord = {
  id: "123",
  stateCode: "US_OZ",
  externalId: "US_OZ_123",
  isEligible: true,
  isAlmostEligible: false,
  eligibleCriteria: {},
  ineligibleCriteria: {},
};

describe("opportunitySchemaBase", () => {
  it("passes through arbitrary metadata fields", () => {
    const input = {
      ...baseRecord,
      metadata: {
        foo: "bar",
        baz: "qux",
      },
    };
    expect(opportunitySchemaBase.parse(input).metadata).toEqual(input.metadata);
  });

  it("adds an empty metadata object when none supplied", () => {
    expect(opportunitySchemaBase.parse(baseRecord).metadata).toEqual({});
  });
});
