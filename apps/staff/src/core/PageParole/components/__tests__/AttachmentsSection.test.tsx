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

import { ParoleAttachment, ParolePlan } from "~datatypes";

import { AttachmentsSection } from "../AttachmentsSection";

const EMPTY_PAROLE_PLAN: ParolePlan = { onFile: true, documents: [] };

function makeAttachment(fields: Partial<ParoleAttachment>): ParoleAttachment {
  return {
    name: "Letter of Support - Rev. Thomas Mills",
    type: "Letter of Support",
    url: "/documents/support-letter.pdf",
    uploadDate: "2026-01-01",
    ...fields,
  };
}

describe("AttachmentsSection", () => {
  it("renders a View link for an attachment with a safe URL", () => {
    render(
      <AttachmentsSection
        parolePlan={EMPTY_PAROLE_PLAN}
        attachments={[makeAttachment({})]}
      />,
    );

    expect(screen.getByRole("link", { name: /view/i })).toBeInTheDocument();
  });

  it("does not render a View link for an attachment with an unsafe URL", () => {
    render(
      <AttachmentsSection
        parolePlan={EMPTY_PAROLE_PLAN}
        attachments={[
          // eslint-disable-next-line no-script-url -- deliberately testing that this string is rejected, not executing it
          makeAttachment({ url: "javascript:alert(1)" }),
        ]}
      />,
    );

    expect(
      screen.queryByRole("link", { name: /view/i }),
    ).not.toBeInTheDocument();
  });

  it("merges the parole plan documents and attachments into one newest-to-oldest list", () => {
    const parolePlan: ParolePlan = {
      onFile: true,
      documents: [
        { url: "/documents/parole-plan-1.pdf", uploadDate: "2026-01-05" },
        { url: "/documents/parole-plan-2.pdf", uploadDate: "2025-11-20" },
      ],
    };
    const attachments: Array<ParoleAttachment> = [
      makeAttachment({
        name: "Letter of Support - Rev. Thomas Mills",
        url: "/documents/support-letter-1.pdf",
        uploadDate: "2026-01-10",
      }),
      makeAttachment({
        name: "Victim Impact Statement",
        type: "Victim Impact Letter",
        url: "/documents/victim-impact.pdf",
        uploadDate: "2025-12-01",
      }),
    ];

    render(
      <AttachmentsSection parolePlan={parolePlan} attachments={attachments} />,
    );

    // Matches only each row's name (e.g. "Letter of Support - Rev. Thomas
    // Mills"), not its detail label (e.g. "Uploaded: Jan 10, 2026").
    const rowNames = screen
      .getAllByText(
        (content) =>
          content === "Parole Plan" ||
          content.startsWith("Letter of Support - ") ||
          content === "Victim Impact Statement",
      )
      .map((el) => el.textContent);
    expect(rowNames).toEqual([
      "Letter of Support - Rev. Thomas Mills",
      "Parole Plan",
      "Victim Impact Statement",
      "Parole Plan",
    ]);

    const viewLinks = screen.getAllByRole("link", { name: /view/i });
    expect(viewLinks).toHaveLength(4);
    viewLinks.forEach((link) => expect(link).toHaveAttribute("download"));
  });

  it("renders a banner when the parole plan hasn't been updated in over 90 days", () => {
    const staleParolePlan: ParolePlan = {
      onFile: true,
      lastUpdated: "2025-01-01",
      documents: [],
    };

    render(
      <AttachmentsSection parolePlan={staleParolePlan} attachments={[]} />,
    );

    expect(
      screen.getByText("PAROLE PLAN NOT RECENTLY UPDATED"),
    ).toBeInTheDocument();
  });

  it("renders no stale-plan banner when the parole plan is on file and current", () => {
    const currentParolePlan: ParolePlan = {
      onFile: true,
      lastUpdated: new Date().toISOString().slice(0, 10),
      documents: [],
    };

    render(
      <AttachmentsSection parolePlan={currentParolePlan} attachments={[]} />,
    );

    expect(
      screen.queryByText("PAROLE PLAN NOT RECENTLY UPDATED"),
    ).not.toBeInTheDocument();
  });
});
