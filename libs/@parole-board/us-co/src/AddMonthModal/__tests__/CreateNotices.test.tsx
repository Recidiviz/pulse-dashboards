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

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { CreateNotices } from "../CreateNotices";

const KIND_NOTICE =
  "Business Mtg entries weren't added because their schedule isn't set yet. Add them by hand if this month needs any.";
const OUTSIDE_NOTICE =
  "2 hearings fall after December ends and weren't added: DCC and SCC on Thursday, January 1.";

const GROUPS = [
  { year: 2026, month: 11, messages: [KIND_NOTICE] },
  { year: 2026, month: 12, messages: [KIND_NOTICE, OUTSIDE_NOTICE] },
];

describe("CreateNotices", () => {
  it("groups the server's messages under each month, word for word", () => {
    render(<CreateNotices groups={GROUPS} onDismiss={vi.fn()} />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Notices for November 2026");
    expect(status).toHaveTextContent("Notices for December 2026");
    expect(screen.getAllByText(KIND_NOTICE)).toHaveLength(2);
    expect(screen.getByText(OUTSIDE_NOTICE)).toBeInTheDocument();
  });

  it("calls onDismiss from its dismiss button", async () => {
    const onDismiss = vi.fn();
    render(<CreateNotices groups={GROUPS} onDismiss={onDismiss} />);

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    await waitFor(() => expect(onDismiss).toHaveBeenCalledOnce());
  });

  it("renders nothing without notices", () => {
    const { container } = render(
      <CreateNotices groups={[]} onDismiss={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <CreateNotices groups={GROUPS} onDismiss={vi.fn()} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
