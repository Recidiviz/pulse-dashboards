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

import { USER_ROLE } from "~@idaho-th/shared";

import { palette } from "../../../styles";
import { StatusBadge } from "../StatusBadge";

const testDoubles = vi.hoisted(() => ({
  role: "staff" as string | undefined,
}));

vi.mock("../../../datastores/IdahoTHStoreContext", () => ({
  useIdahoTHStore: () => ({
    rootStore: {
      userStore: {
        user: testDoubles.role ? { role: testDoubles.role } : undefined,
      },
    },
  }),
}));

describe("StatusBadge", () => {
  beforeEach(() => {
    testDoubles.role = USER_ROLE.STAFF;
  });

  it("shows Action Needed / Waiting / Done for staff", () => {
    const { rerender } = render(<StatusBadge status="ACTION_NEEDED" />);
    expect(screen.getByText("Action Needed")).toBeInTheDocument();

    rerender(<StatusBadge status="WAITING" />);
    expect(screen.getByText("Waiting")).toBeInTheDocument();

    rerender(<StatusBadge status="DONE" />);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("shows Action Needed / Waiting / Done for providers", () => {
    testDoubles.role = USER_ROLE.PROVIDER;
    const { rerender } = render(<StatusBadge status="ACTION_NEEDED" />);
    expect(screen.getByText("Action Needed")).toBeInTheDocument();

    rerender(<StatusBadge status="WAITING" />);
    expect(screen.getByText("Waiting")).toBeInTheDocument();

    rerender(<StatusBadge status="DONE" />);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("labels Selected and Not Selected provider outcomes", () => {
    const { rerender } = render(<StatusBadge status="SELECTED" />);
    expect(screen.getByText("Selected")).toBeInTheDocument();

    rerender(<StatusBadge status="NOT_SELECTED" />);
    expect(screen.getByText("Not Selected")).toBeInTheDocument();
  });

  it("shows PROVIDER_REVIEW as Pending for staff and Provider Review for providers", () => {
    const { unmount } = render(<StatusBadge status="PROVIDER_REVIEW" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    unmount();

    testDoubles.role = USER_ROLE.PROVIDER;
    render(<StatusBadge status="PROVIDER_REVIEW" />);
    expect(screen.getByText("Provider Review")).toBeInTheDocument();
  });

  it("labels closed and approvals statuses used on the dashboard", () => {
    const { rerender } = render(<StatusBadge status="RELEASED" />);
    expect(screen.getByText("Released")).toBeInTheDocument();

    rerender(<StatusBadge status="PLAN_REJECTED" />);
    expect(screen.getByText("Plan Rejected")).toBeInTheDocument();

    rerender(<StatusBadge status="CANCELED" />);
    expect(screen.getByText("Canceled")).toBeInTheDocument();

    rerender(<StatusBadge status="HOUSING_PLAN_REJECTED" />);
    expect(screen.getByText("Housing Plan Rejected")).toBeInTheDocument();

    rerender(<StatusBadge status="RELEASE_DENIED" />);
    expect(screen.getByText("Release Denied")).toBeInTheDocument();
  });

  it("prefers an explicit label over the role-derived one", () => {
    render(<StatusBadge status="CANCELED" label="Application Canceled" />);
    expect(screen.getByText("Application Canceled")).toBeInTheDocument();
    expect(screen.queryByText("Canceled")).not.toBeInTheDocument();
  });

  it("maps statuses to badge color variants", () => {
    const { rerender } = render(<StatusBadge status="HOUSING_PLAN_REJECTED" />);
    expect(screen.getByText("Housing Plan Rejected")).toHaveStyleRule(
      "background-color",
      palette.background.attentionLight,
    );
    expect(screen.getByText("Housing Plan Rejected")).toHaveStyleRule(
      "color",
      palette.foreground.attention,
    );

    rerender(<StatusBadge status="RELEASE_DENIED" />);
    expect(screen.getByText("Release Denied")).toHaveStyleRule(
      "background-color",
      palette.background.attentionLight,
    );
    expect(screen.getByText("Release Denied")).toHaveStyleRule(
      "color",
      palette.foreground.attention,
    );

    rerender(<StatusBadge status="DONE" />);
    expect(screen.getByText("Done")).toHaveStyleRule(
      "background-color",
      palette.background.brandLight,
    );
    expect(screen.getByText("Done")).toHaveStyleRule(
      "color",
      palette.foreground.brand,
    );

    rerender(<StatusBadge status="INFO_NEEDED" />);
    expect(screen.getByText("Info Needed")).toHaveStyleRule(
      "background-color",
      palette.misc.catskillWhite,
    );
    expect(screen.getByText("Info Needed")).toHaveStyleRule(
      "color",
      palette.misc.seaBlue,
    );
  });
});
