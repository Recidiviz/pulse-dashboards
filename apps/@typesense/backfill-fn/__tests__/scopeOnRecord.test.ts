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

// Scope travels on the opportunity row itself.
//
// These guard the projection, which carries the ETL's values into the index.
// See `opportunityScope.test.ts` in ~@typesense/client for the config that
// holds no person merge, and `scope.test.ts` for what still merges.

import { describe, expect, test } from "vitest";

import { projectFields } from "../src/projection";

const FIELDS = ["stateCode", "externalId", "officerId", "locationId"];

const etlRow = {
  stateCode: "US_TN",
  externalId: "123",
  officerId: "OFFICER_A",
  locationId: "DISTRICT_7",
};

describe("scope on the opportunity row", () => {
  test("the record's own values reach the index", () => {
    const out = projectFields(etlRow, FIELDS, "id-1");

    expect(out["officerId"]).toBe("OFFICER_A");
    expect(out["locationId"]).toBe("DISTRICT_7");
  });

  test("a row with no scope leaves both fields unset", () => {
    // Unset fails CLOSED: a scoped key constraining either one matches
    // nothing, so the document is invisible rather than wrongly visible. An
    // empty string would look populated and match nothing just the same.
    const out = projectFields(
      { stateCode: "US_TN", externalId: "123" },
      FIELDS,
      "id-1",
    );

    expect(out).not.toHaveProperty("officerId");
    expect(out).not.toHaveProperty("locationId");
  });

  test("an undeclared field is still dropped", () => {
    // The projection is a privacy boundary. Indexing a field has to stay an
    // explicit act.
    const out = projectFields({ ...etlRow, somethingNew: "x" }, FIELDS, "id-1");

    expect(out).not.toHaveProperty("somethingNew");
  });
});
