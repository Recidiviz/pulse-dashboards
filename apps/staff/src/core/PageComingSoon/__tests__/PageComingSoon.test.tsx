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
import { Mock } from "vitest";

import mockWithTestId from "../../../../__helpers__/mockWithTestId";
import { NavigationLayout } from "../../NavigationLayout";
import PageComingSoon from "../PageComingSoon";

vi.mock("../../NavigationLayout", async () => ({
  ...(await vi.importActual("../../NavigationLayout")),
  NavigationLayout: vi.fn(),
}));

describe("PageComingSoon", () => {
  it("renders the navigation layout and a coming soon message", () => {
    (NavigationLayout as Mock).mockReturnValue(
      mockWithTestId("navigation-layout-id"),
    );

    render(<PageComingSoon />);

    expect(screen.getByTestId("navigation-layout-id")).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
