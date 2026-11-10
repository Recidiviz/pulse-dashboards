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

import { ProviderHeading } from "../ProviderHeading";
import { StaffHeading } from "../StaffHeading";

const isMobileState = vi.hoisted(() => ({ isMobile: false }));

vi.mock("../SearchBar", () => ({
  SearchBar: ({ onSearchChange }: { onSearchChange: (v: string) => void }) => (
    <input
      aria-label="search"
      onChange={(e) => onSearchChange(e.target.value)}
    />
  ),
}));

vi.mock("~utils/react/useIsMobile", () => ({
  breakpoints: {
    mobile: 480,
    tablet: 768,
  },
  default: () => ({ isMobile: isMobileState.isMobile }),
}));

vi.mock("../../hooks/useIsMobile", () => ({
  breakpoints: {
    mobile: 480,
    tablet: 768,
  },
  default: () => ({ isMobile: isMobileState.isMobile }),
}));

vi.mock("../../assets/search-icon.svg?react", () => ({
  default: () => <svg />,
}));

describe("dashboard headings", () => {
  beforeEach(() => {
    isMobileState.isMobile = false;
  });

  it("StaffHeading shows Housing Applications branding without Provider Portal badge", () => {
    render(
      <StaffHeading
        title="Housing Applications"
        subtitle="Track applications sent to housing providers"
        onSearchChange={vi.fn()}
        onUploadPdf={vi.fn()}
      />,
    );

    expect(screen.getByText("Housing Applications")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.queryByText("Provider Portal")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start an application/i }),
    ).toBeInTheDocument();
  });

  it("hides Start an application on mobile", () => {
    isMobileState.isMobile = true;

    render(
      <StaffHeading
        title="Housing Applications"
        subtitle="Track applications sent to housing providers"
        onSearchChange={vi.fn()}
        onUploadPdf={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Start an application/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("ProviderHeading uses provider name header and Provider Portal + Beta badges", () => {
    render(<ProviderHeading title="Hope Housing" onSearchChange={vi.fn()} />);

    expect(screen.getByText("Hope Housing")).toBeInTheDocument();
    expect(screen.getByText("Provider Portal")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Start an application/i }),
    ).not.toBeInTheDocument();
  });

  it("ProviderHeading optionally shows extra header actions", () => {
    const onClick = vi.fn();
    render(
      <ProviderHeading
        title="Hope Housing"
        actions={[{ key: "settings", label: "Settings", onClick }]}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Settings" }),
    ).toBeInTheDocument();
  });
});
