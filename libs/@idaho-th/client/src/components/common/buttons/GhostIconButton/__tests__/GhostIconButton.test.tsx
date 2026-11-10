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
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { GhostIconButton } from "../GhostIconButton";

describe("GhostIconButton", () => {
  it("reports a click to the caller", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <GhostIconButton aria-label="Edit" onClick={onClick}>
        <svg />
      </GhostIconButton>,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ignores a click while disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <GhostIconButton aria-label="Edit" onClick={onClick} disabled>
        <svg />
      </GhostIconButton>,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <GhostIconButton aria-label="Edit" onClick={vi.fn()}>
        <svg />
      </GhostIconButton>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
