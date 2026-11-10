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

import { DigitizedApplicationPdfTemplate } from "../DigitizedApplicationPdfTemplate";

describe("DigitizedApplicationPdfTemplate", () => {
  it("renders Recidiviz branding, page footers, and L3 Restricted", () => {
    render(
      <DigitizedApplicationPdfTemplate
        formData={{ clientFullName: "Jane Doe", age: 36 }}
      />,
    );

    expect(screen.getAllByText("Recidiviz").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Digitized by Recidiviz").length).toBe(3);
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "IDOC Data Sensitivity Classification - L3 Restricted",
      ).length,
    ).toBe(3);
  });

  it("renders preferred providers from the resolved preferredProviderNames prop, never from formData.preferredProviders", () => {
    // formData.preferredProviders holds ids — HousingApplications.tsx resolves
    // them to names via a provider map before this template ever sees them.
    // A stale/blank render here would mean that resolution step regressed.
    render(
      <DigitizedApplicationPdfTemplate
        formData={{
          clientFullName: "Jane Doe",
          preferredProviders: ["provider-old-id"],
        }}
        preferredProviderNames={["Acme Transitional House (Renamed)"]}
      />,
    );

    expect(
      screen.getByText("Acme Transitional House (Renamed)"),
    ).toBeInTheDocument();
    expect(screen.queryByText("provider-old-id")).not.toBeInTheDocument();
  });
});
