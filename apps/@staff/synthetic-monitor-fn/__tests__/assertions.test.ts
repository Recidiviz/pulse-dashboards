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

import {
  assertionForState,
  DEFAULT_ASSERTION,
  STATE_ASSERTIONS,
} from "../src/assertions";

describe("assertionForState", () => {
  it("falls back to the default for a state with no override", () => {
    expect(assertionForState("US_ZZ_NOT_A_STATE")).toBe(DEFAULT_ASSERTION);
  });

  it("returns the explicit override for a state that has one", () => {
    const stateWithOverride = Object.keys(STATE_ASSERTIONS)[0];
    if (!stateWithOverride) {
      // No overrides configured yet — the default path is the only behavior.
      expect(assertionForState("US_IA")).toBe(DEFAULT_ASSERTION);
      return;
    }
    expect(assertionForState(stateWithOverride)).toBe(
      STATE_ASSERTIONS[stateWithOverride],
    );
  });
});
