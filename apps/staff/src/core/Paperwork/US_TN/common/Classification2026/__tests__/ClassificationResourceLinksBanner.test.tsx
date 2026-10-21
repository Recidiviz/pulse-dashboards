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

import { render, screen } from "@testing-library/react";

import {
  ClassificationResourceLinksBanner,
  US_TN_CLASSIFICATION_RESOURCE_LINKS,
} from "../ClassificationResourceLinksBanner";

describe("ClassificationResourceLinksBanner", () => {
  it("links the User's Guide and Offense Severity List in a new tab", () => {
    render(<ClassificationResourceLinksBanner />);

    expect(
      screen.getByRole("region", { name: "Classification resources" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Refer to")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: /Classification Form Guide/ }),
    ).not.toBeInTheDocument();
    US_TN_CLASSIFICATION_RESOURCE_LINKS.forEach(({ label, url }) => {
      const link = screen.getByRole("link", {
        name: `${label} (opens in new tab)`,
      });
      expect(link).toHaveAttribute("href", url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});
