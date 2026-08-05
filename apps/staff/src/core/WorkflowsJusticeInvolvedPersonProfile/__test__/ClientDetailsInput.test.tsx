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

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { Client } from "../../../WorkflowsStore";
import ClientDetailsInput from "../ClientDetailsInput";

function makeFakeClient(recordId: string, givenNames: string): Client {
  return {
    recordId,
    updates: {},
    updatePerson: vi.fn(),
    fullName: { givenNames },
  } as unknown as Client;
}

describe("ClientDetailsInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("saves a pending edit to the person it was made for, not whoever is displayed when the debounce fires", () => {
    // Alicia (Alice) Smith: preferred name "Alice" being edited when the
    // profile page swaps to a different person before the debounced write
    // fires.
    const aliciaSmith = makeFakeClient("alicia-smith", "Alicia");
    const bobbyBob = makeFakeClient("bobby-bob", "Bobby");

    const { rerender } = render(
      <ClientDetailsInput
        text="Alice"
        client={aliciaSmith}
        updateType="preferredName"
      />,
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Ali" },
    });

    // The profile page swaps `client` without remounting this component
    // (e.g. navigating to a different person's caseload row) before the
    // debounced write for the previous person has fired.
    rerender(
      <ClientDetailsInput
        text="Bobby"
        client={bobbyBob}
        updateType="preferredName"
      />,
    );

    vi.runAllTimers();

    expect(aliciaSmith.updatePerson).toHaveBeenCalledExactlyOnceWith(
      "preferredName",
      "Ali",
    );
    expect(bobbyBob.updatePerson).not.toHaveBeenCalled();
  });
});
