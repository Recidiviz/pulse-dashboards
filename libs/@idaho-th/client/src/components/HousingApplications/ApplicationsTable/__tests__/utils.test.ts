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

import { getAvatarInitials } from "../utils";

describe("getAvatarInitials", () => {
  it("uses first and last initials for multi-part names", () => {
    expect(getAvatarInitials("Jane Doe")).toBe("JD");
    expect(getAvatarInitials("Mary Ann Smith")).toBe("MS");
  });

  it("truncates a single name to maxLetters", () => {
    expect(getAvatarInitials("Madonna")).toBe("MA");
    expect(getAvatarInitials("Madonna", 1)).toBe("M");
  });

  it("reorders Last, First comma style before taking initials", () => {
    expect(getAvatarInitials("Doe, Jane")).toBe("JD");
  });

  it("strips punctuation and returns empty for blank input", () => {
    expect(getAvatarInitials("Jane!!! Doe")).toBe("JD");
    expect(getAvatarInitials("   ")).toBe("");
    expect(getAvatarInitials("@@@")).toBe("");
  });
});
