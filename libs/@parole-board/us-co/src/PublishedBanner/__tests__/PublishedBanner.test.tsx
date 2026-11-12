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
import { ComponentProps } from "react";

import { PublishedBanner } from "../PublishedBanner";

function renderBanner(props: Partial<ComponentProps<typeof PublishedBanner>>) {
  return render(
    <PublishedBanner
      monthLabel="September 2026"
      hearingDays={14}
      hearings={52}
      publishedAt={new Date("2026-10-09T18:27:00Z")}
      timeZone="America/Denver"
      publishedByEmail="editor@example.com"
      publicPageUrl="https://public-calendar.test/2026-09"
      {...props}
    />,
  );
}

describe("PublishedBanner", () => {
  it("shows the tag, the counts and who published when, in Denver time", () => {
    renderBanner({});

    const banner = screen.getByRole("region", { name: "Month status" });
    expect(banner).toHaveTextContent("UPLOAD COMPLETE");
    expect(
      screen.getByText(
        "September 2026 is live on the public calendar — 14 hearing days, 52 hearings.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Published Oct 9, 2026 at 12:27 PM by editor@example.com",
      ),
    ).toBeInTheDocument();
  });

  it("leaves out the design's notification line", () => {
    renderBanner({});

    const banner = screen.getByRole("region", { name: "Month status" });
    expect(banner).not.toHaveTextContent(/notified/i);
  });

  it("links View public page to the month's public page in a new tab, without opener or referrer", () => {
    renderBanner({});

    const link = screen.getByRole("link", { name: /^View public page/ });
    expect(link).toHaveAttribute(
      "href",
      "https://public-calendar.test/2026-09",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("leaves out View public page without a public page address", () => {
    renderBanner({ publicPageUrl: null });

    expect(
      screen.getByText(/is live on the public calendar/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("tells screen readers that View public page opens a new tab", () => {
    renderBanner({});

    expect(
      screen.getByRole("link", {
        name: "View public page (opens in a new tab)",
      }),
    ).toBeInTheDocument();
  });

  it("uses the singular for a count of one", () => {
    renderBanner({ hearingDays: 1, hearings: 1 });

    expect(
      screen.getByText(
        "September 2026 is live on the public calendar — 1 hearing day, 1 hearing.",
      ),
    ).toBeInTheDocument();
  });

  it("is static, so screen readers don't announce it as news", () => {
    renderBanner({});

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has no dismiss button, so it stays while the month is published", () => {
    renderBanner({});

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = renderBanner({});

    expect(await axe(container)).toHaveNoViolations();
  });
});
