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

import { parsePrPreviewLink } from "./parsePrPreviewLink";

describe("parsePrPreviewLink", () => {
  it("returns the channel for a valid link", () => {
    expect(
      parsePrPreviewLink("recidiviz-staging://pr-preview?channel=pr-14211"),
    ).toBe("pr-14211");
  });

  it("accepts any scheme prefix", () => {
    expect(parsePrPreviewLink("recidiviz://pr-preview?channel=pr-1")).toBe(
      "pr-1",
    );
    expect(parsePrPreviewLink("recidiviz-dev://pr-preview?channel=pr-99")).toBe(
      "pr-99",
    );
  });

  it("returns null for the wrong path", () => {
    expect(
      parsePrPreviewLink("recidiviz-staging://something-else?channel=pr-14211"),
    ).toBeNull();
  });

  it("returns null when the channel param is missing", () => {
    expect(parsePrPreviewLink("recidiviz-staging://pr-preview")).toBeNull();
  });

  it("returns null when the channel param is invalid", () => {
    expect(
      parsePrPreviewLink("recidiviz-staging://pr-preview?channel=abc"),
    ).toBeNull();
  });

  it("returns null for a non-pr channel value", () => {
    expect(
      parsePrPreviewLink("recidiviz-staging://pr-preview?channel=staging"),
    ).toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(parsePrPreviewLink("not a url")).toBeNull();
    expect(parsePrPreviewLink("")).toBeNull();
  });
});
