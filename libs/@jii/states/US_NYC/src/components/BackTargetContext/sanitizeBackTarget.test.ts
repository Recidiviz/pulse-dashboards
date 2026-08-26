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

import { sanitizeBackTarget } from "./sanitizeBackTarget";

describe("sanitizeBackTarget", () => {
  it("accepts an internal path", () => {
    expect(sanitizeBackTarget("/resources/categories/housing")).toBe(
      "/resources/categories/housing",
    );
  });

  it("rejects an absolute external URL", () => {
    expect(sanitizeBackTarget("https://evil.example.com")).toBeNull();
  });

  it("rejects a protocol-relative URL", () => {
    expect(sanitizeBackTarget("//evil.example.com")).toBeNull();
  });

  it("rejects a javascript: URL", () => {
    // eslint-disable-next-line no-script-url -- this is the exact value being tested and not live code
    expect(sanitizeBackTarget("javascript:alert(1)")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(sanitizeBackTarget(undefined)).toBeNull();
  });
});
