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
import { describe, expect, it, vi } from "vitest";

import { Preferences } from "../Preferences";

const testDoubles = vi.hoisted(() => ({
  formData: {} as Record<string, unknown>,
  preferredProviders: [] as { id: string; name: string }[],
}));

vi.mock("../../../../../hooks/useApplicationDetail", () => ({
  useCurrentApplicationDetail: () => ({
    formData: testDoubles.formData,
    preferredProviders: testDoubles.preferredProviders,
  }),
}));

describe("Preferences", () => {
  it("renders preferred provider names from the hydrated sibling, never from formData.preferredProviders", () => {
    // formData still holds the stored ids — a client-side lookup off those
    // ids would go stale after a rename or blank on a collapsed duplicate.
    // The resolved name must come only from the server-joined sibling
    // returned by useCurrentApplicationDetail.
    testDoubles.formData = {
      preferredProviders: ["provider-old-id"],
    };
    testDoubles.preferredProviders = [
      { id: "provider-old-id", name: "Acme Transitional House (Renamed)" },
    ];

    render(<Preferences />);

    expect(
      screen.getByText("Acme Transitional House (Renamed)"),
    ).toBeInTheDocument();
    expect(screen.queryByText("provider-old-id")).not.toBeInTheDocument();
  });

  it("shows an em dash when there are no hydrated preferred providers", () => {
    // Every other field is filled in so the only empty-placeholder "—" on
    // the page belongs to the preferred-providers row being asserted on.
    testDoubles.formData = {
      faithBasedPreferred: true,
      previousTransitionalHome: false,
      previousHomeName: "Hope House",
      previousHomeCity: "Nampa",
      preferredDistrict: ["D1"],
      preferredProviders: [],
    };
    testDoubles.preferredProviders = [];

    render(<Preferences />);

    expect(screen.getByText("Preferred Providers")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
