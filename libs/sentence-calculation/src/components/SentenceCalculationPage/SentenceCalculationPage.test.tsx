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

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SentenceCalculationHost } from "../../types";
import { SentenceCalculationPage } from "./SentenceCalculationPage";

const host: SentenceCalculationHost = {
  currentTenantId: "US_NV",
  userStore: { getToken: () => Promise.resolve("token") },
};

async function typeIntoField(text: string) {
  await act(() => userEvent.type(screen.getByLabelText("Text to send"), text));
}

async function clickSend() {
  await act(() =>
    userEvent.click(screen.getByRole("button", { name: "Send" })),
  );
}

describe("SentenceCalculationPage", () => {
  it("keeps what the user types and renders the echoed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ echo: "hello", stateCode: "US_NV" }),
      }),
    );

    render(<SentenceCalculationPage host={host} />);

    await typeIntoField("hello");

    // the presenter survives the re-renders caused by typing
    expect(screen.getByLabelText("Text to send")).toHaveValue("hello");

    await clickSend();

    expect(
      await screen.findByText('The backend echoed "hello" for US_NV.'),
    ).toBeInTheDocument();
  });

  it("surfaces a failed request to the user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );

    render(<SentenceCalculationPage host={host} />);

    await typeIntoField("hello");
    await clickSend();

    expect(
      await screen.findByText(/failed with status 401/),
    ).toBeInTheDocument();
  });
});
