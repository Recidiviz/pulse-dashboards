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

import { describe, expect, test } from "vitest";

import {
  DERIVED_WATCH_SOURCES,
  projectOpportunityUpdate,
} from "../emulator/helpers";

const PATH = "clientUpdatesV2/us_id_001/clientOpportunityUpdates/LSU";

describe("projectOpportunityUpdate", () => {
  test("ids from the PATH, not the document id", () => {
    // Every person's subcollection names its documents after the opportunity
    // type, so "LSU" alone collides across every person in the state.
    const row = projectOpportunityUpdate({}, PATH);

    expect(row["id"]).toBe("us_id_001_LSU");
  });

  test("derives the status an officer action implies", () => {
    const row = projectOpportunityUpdate(
      { denial: { reasons: ["TEST"] } },
      PATH,
    );

    expect(row["updateStatus"]).toBe("DENIED");
    expect(row["hasOfficerAction"]).toBe(true);
  });

  test("a record nobody has acted on carries neither", () => {
    const row = projectOpportunityUpdate({ lastViewed: {} }, PATH);

    expect(row["updateStatus"]).toBe("NONE");
    expect(row["hasOfficerAction"]).toBe(false);
  });

  test("drops undefined and null rather than storing them", () => {
    // Typesense rejects a null on a typed field, which would fail the whole
    // batch rather than the one document.
    const row = projectOpportunityUpdate(
      { denial: null, submitted: undefined },
      PATH,
    );

    expect("denial" in row).toBe(false);
    expect("submitted" in row).toBe(false);
  });
});

describe("DERIVED_WATCH_SOURCES", () => {
  test("watches opportunityUpdates through its per-person source", () => {
    expect(DERIVED_WATCH_SOURCES["opportunityUpdates"].collectionGroup).toBe(
      "clientOpportunityUpdates",
    );
  });

  test("does NOT watch opportunities", () => {
    // It merges many per-state referral collections plus the person record, so
    // one change cannot be re-derived without re-reading all of them.
    expect(DERIVED_WATCH_SOURCES["opportunities"]).toBeUndefined();
  });
});
