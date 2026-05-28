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

import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { BackLink } from "../BackLink";

const navigate = vi.fn();
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => navigate,
}));

function renderBackLink({
  previousPage,
  tenantId,
  fallbackUrl = "/workflows/clients",
}: {
  previousPage?: string;
  tenantId?: string;
  fallbackUrl?: string;
} = {}) {
  const entry = {
    pathname: "/workflows/clients/p1",
    search: tenantId ? `?tenantId=${tenantId}` : "",
    state: previousPage ? { previousPage } : null,
  };
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <BackLink fallbackUrl={fallbackUrl}>Back</BackLink>
    </MemoryRouter>,
  );
}

beforeEach(() => navigate.mockClear());

describe("BackLink", () => {
  it("renders the chevron + children", () => {
    renderBackLink();
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(document.querySelector("i.fa-angle-left")).toBeInTheDocument();
  });

  it("uses previousPage as the href when present", () => {
    renderBackLink({
      previousPage: "/workflows/home?tab=overdue&tenantId=US_MO",
      tenantId: "US_MO",
    });
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/workflows/home?tab=overdue&tenantId=US_MO",
    );
  });

  it("falls back to fallbackUrl (with tenantId appended) when there's no previousPage", () => {
    renderBackLink({ tenantId: "US_MO" });
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/workflows/clients?tenantId=US_MO",
    );
  });

  it("goes back in history on a plain left-click when there's app history", () => {
    renderBackLink({ previousPage: "/workflows/home", tenantId: "US_MO" });
    const link = screen.getByRole("link");
    const event = createEvent.click(link, { button: 0 });
    fireEvent(link, event);

    expect(event.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it("navigates to the fallback on a deep link (no previousPage)", () => {
    renderBackLink({ tenantId: "US_MO" });
    const link = screen.getByRole("link");
    const event = createEvent.click(link, { button: 0 });
    fireEvent(link, event);

    expect(event.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/workflows/clients");
    expect(navigate).not.toHaveBeenCalledWith(-1);
  });

  it("lets the browser handle a cmd/ctrl-click (open in new tab)", () => {
    renderBackLink({ previousPage: "/workflows/home" });
    const link = screen.getByRole("link");
    const event = createEvent.click(link, { button: 0, metaKey: true });
    fireEvent(link, event);

    expect(event.defaultPrevented).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
