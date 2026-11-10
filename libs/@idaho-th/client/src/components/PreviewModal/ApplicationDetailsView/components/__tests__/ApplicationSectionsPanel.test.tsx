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
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { ApplicationSectionsPanel } from "../ApplicationSectionsPanel";

vi.mock("../../../../hooks/useApplicationDetail", () => ({
  useCurrentApplicationDetail: () => ({ formData: {}, preferredProviders: [] }),
}));

vi.mock("../CollapsibleSection", () => ({
  CollapsibleSection: ({
    title,
    isOpen,
    onToggle,
  }: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
  }) => (
    <button type="button" aria-expanded={isOpen} onClick={onToggle}>
      {title}
    </button>
  ),
}));

vi.mock("../../ApplicationDetailsView.styles", () => ({
  AccordionsContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  ExpandCollapseToggle: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
  }) => <button {...props}>{children}</button>,
  ChevronIcon: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
  ArrowDown: () => null,
}));

describe("ApplicationSectionsPanel", () => {
  it("expands all sections then collapses all", async () => {
    const user = userEvent.setup();
    render(<ApplicationSectionsPanel />);

    expect(
      screen.getByRole("button", { name: "Expand all" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Personal info" }),
    ).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByRole("button", { name: "Expand all" }));

    expect(
      screen.getByRole("button", { name: "Collapse all" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Personal info" }),
    ).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Collapse all" }));

    expect(
      screen.getByRole("button", { name: "Expand all" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Personal info" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
