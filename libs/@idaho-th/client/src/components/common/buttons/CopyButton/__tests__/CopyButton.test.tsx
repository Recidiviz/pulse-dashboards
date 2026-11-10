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
import { describe, expect, it, vi } from "vitest";

import { CopyButton } from "../CopyButton";

// Both icons resolve to the same aliased SVG stub under test, so the copied
// state is asserted through `data-copied` rather than through the rendered icon.
function renderButton(onCopy: (text: string) => Promise<boolean>) {
  render(<CopyButton text="Jane Doe" ariaLabel="Copy name" onCopy={onCopy} />);
  return screen.getByRole("button", { name: "Copy name" });
}

describe("CopyButton", () => {
  it("confirms the copy when the text reached the clipboard", async () => {
    const user = userEvent.setup();
    const button = renderButton(vi.fn().mockResolvedValue(true));

    await user.click(button);

    // The copied state is set after `onCopy` resolves, which the click does not await.
    await waitFor(() => expect(button).toHaveAttribute("data-copied", "true"));
  });

  it("does not confirm the copy when it failed", async () => {
    const user = userEvent.setup();
    const button = renderButton(vi.fn().mockResolvedValue(false));

    await user.click(button);

    expect(button).toHaveAttribute("data-copied", "false");
  });

  it("renders nothing when there is no text to copy", () => {
    render(<CopyButton text={null} ariaLabel="Copy name" onCopy={vi.fn()} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
