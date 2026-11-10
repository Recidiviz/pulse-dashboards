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

import { LABEL_STATE } from "~@idaho-th/client/constants/label";

import { ProviderLabels } from "../ProviderLabels";

describe("ProviderLabels", () => {
  it("renders match labels as inline text and non-match labels as badges", () => {
    render(
      <ProviderLabels
        labels={[
          { text: "D1", state: LABEL_STATE.match, displayOrder: 1 },
          { text: "All genders", state: LABEL_STATE.match, displayOrder: 2 },
          { text: "No riders", state: LABEL_STATE.error, displayOrder: 3 },
        ]}
      />,
    );

    expect(screen.getByTestId("match-label")).toHaveTextContent("D1");
    expect(screen.getByTestId("match-label")).toHaveTextContent("All genders");
    expect(screen.getByTestId("badge-label")).toHaveTextContent("No riders");
  });

  it("returns null when labels array is empty", () => {
    const { container } = render(<ProviderLabels labels={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
