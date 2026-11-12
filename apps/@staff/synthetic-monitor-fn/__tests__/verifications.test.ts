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
  DEFAULT_VERIFICATION,
  STATE_VERIFICATIONS,
  verificationForState,
} from "../src/verifications";

describe("verificationForState", () => {
  it("falls back to the default verification when a state has no override", () => {
    expect(verificationForState("US_ZZ_NO_OVERRIDE")).toBe(
      DEFAULT_VERIFICATION,
    );
  });

  it("returns a state's explicit override when configured", () => {
    // US_NY is overridden (Pathways chart check, not the default Workflows check).
    expect(STATE_VERIFICATIONS["US_NY"]).toBeDefined();
    expect(verificationForState("US_NY")).toBe(STATE_VERIFICATIONS["US_NY"]);
    expect(verificationForState("US_NY")).not.toBe(DEFAULT_VERIFICATION);
  });
});
