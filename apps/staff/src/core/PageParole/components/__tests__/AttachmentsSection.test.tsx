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
});
