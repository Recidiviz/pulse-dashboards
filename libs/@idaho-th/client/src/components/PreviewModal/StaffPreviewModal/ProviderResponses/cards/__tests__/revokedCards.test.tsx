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
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { ApprovalRevokedCard } from "../ApprovalRevokedCard";
import { SimpleProviderCard } from "../SimpleProviderCard";

vi.mock("../../../../../../datastores/IdahoTHStoreContext", () => ({
  useIdahoTHStore: () => ({
    rootStore: { userStore: { user: { role: "staff" } } },
  }),
}));

const REASON = "The bed is no longer available";

describe("ApprovalRevokedCard", () => {
  const renderCard = () =>
    render(
      <ApprovalRevokedCard
        providerName="Acme Housing"
        isPreferred
        approvalRevoked={{
          message: REASON,
          createdAt: new Date("2026-10-20T00:00:00Z"),
        }}
        sentAt={new Date("2026-10-01T00:00:00Z")}
      />,
    );

  it("shows the revoked badge and the provider's reason", () => {
    renderCard();

    expect(screen.getByText("Approval Canceled")).toBeInTheDocument();
    expect(screen.getByText("Acme Housing")).toBeInTheDocument();
    expect(screen.getByText(REASON)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Provide Info" }),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderCard();

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("SimpleProviderCard", () => {
  it("shows the revoked badge instead of the home plan marker", () => {
    render(
      <SimpleProviderCard providerName="Acme Housing" isHomePlan isRevoked />,
    );

    expect(screen.getByText("Approval Canceled")).toBeInTheDocument();
    expect(screen.queryByText("Home Plan")).not.toBeInTheDocument();
    expect(screen.queryByText(REASON)).not.toBeInTheDocument();
  });

  it("still marks a home plan that was not revoked", () => {
    render(<SimpleProviderCard providerName="Acme Housing" isHomePlan />);

    expect(screen.getByText("Home Plan")).toBeInTheDocument();
  });
});
