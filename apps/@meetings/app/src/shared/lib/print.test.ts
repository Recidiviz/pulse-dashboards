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

import { escapeHtml } from "./print";

describe("escapeHtml", () => {
  it("leaves plain text alone", () => {
    expect(escapeHtml("Met with the client on Tuesday.")).toBe(
      "Met with the client on Tuesday.",
    );
  });

  it("escapes angle brackets so markup renders as text", () => {
    expect(escapeHtml("<b>note</b>")).toBe("&lt;b&gt;note&lt;/b&gt;");
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("Smith & Sons")).toBe("Smith &amp; Sons");
  });

  it("escapes the ampersand before the brackets, not after", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});
