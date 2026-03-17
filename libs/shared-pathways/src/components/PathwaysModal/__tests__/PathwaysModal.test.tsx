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

import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";

import { defaultPathwaysTheme } from "../../PathwaysTheme";
import PathwaysModal from "../PathwaysModal";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={defaultPathwaysTheme}>{children}</ThemeProvider>
);

describe("PathwaysModal", () => {
  const mockHide = vi.fn();

  beforeEach(() => {
    mockHide.mockClear();
  });

  it("should render content when isShowing is true", () => {
    render(
      <PathwaysModal isShowing hide={mockHide}>
        Some content
      </PathwaysModal>,
      { wrapper },
    );

    expect(screen.queryByText("Some content")).toBeInTheDocument();
  });

  it("should not render when isShowing is false", () => {
    render(
      <PathwaysModal isShowing={false} hide={mockHide}>
        Some content
      </PathwaysModal>,
      { wrapper },
    );

    expect(screen.queryByText("Some content")).not.toBeInTheDocument();
  });

  it("should close when Escape is pressed", () => {
    render(
      <PathwaysModal isShowing hide={mockHide}>
        Some content
      </PathwaysModal>,
      { wrapper },
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockHide).toHaveBeenCalledTimes(1);
  });

  it("should close when the close button is clicked", () => {
    render(
      <PathwaysModal isShowing hide={mockHide}>
        Some content
      </PathwaysModal>,
      { wrapper },
    );

    fireEvent.click(screen.getByLabelText("Close modal"));

    expect(mockHide).toHaveBeenCalledTimes(1);
  });
});
