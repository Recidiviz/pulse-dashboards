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

import { creditActivitySchema } from "./schema";

// TODO(OBT-29541): mangled case produced by the Python ETL to Firestore.
// These tests exercise the preprocessing step that renames legacy keys to
// usMaEarnedCreditTypes and can be removed once the ETL is migrated.
describe("creditActivitySchema", () => {
  test("renames each legacy mixed-case credit-type key to its lowerCamelCase counterpart, preserving the value", () => {
    const rawActivity = {
      creditDate: "2024-01-01",
      activity: "Some Activity",
      rating: "S",
      EARNEDGoodTime: "7.5",
      BOOST: 10,
      COMPLETION: null,
    };

    const parsed = creditActivitySchema.parse(rawActivity);

    expect(parsed.earnedGoodTime).toBe(7.5);
    expect(parsed.boost).toBe(10);
    expect(parsed.completion).toBe(0);

    // the legacy keys should not survive preprocessing
    expect(parsed).not.toHaveProperty("EARNEDGoodTime");
    expect(parsed).not.toHaveProperty("BOOST");
    expect(parsed).not.toHaveProperty("COMPLETION");
  });

  test("parses a payload already keyed with the current lowerCamelCase enum unchanged", () => {
    const rawActivity = {
      creditDate: "2024-01-01",
      activity: "Some Activity",
      rating: "S",
      earnedGoodTime: "7.5",
      boost: 10,
      completion: null,
    };

    const parsed = creditActivitySchema.parse(rawActivity);

    expect(parsed.earnedGoodTime).toBe(7.5);
    expect(parsed.boost).toBe(10);
    expect(parsed.completion).toBe(0);
  });
});
