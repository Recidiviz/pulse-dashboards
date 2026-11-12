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

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { AUTOSAVE_FAILED_MESSAGE, MISSING_VALUE_TEXT } from "../constants";
import { ReportDropdown } from "../ReportDropdown";

const OPTIONS = [
  { value: "YES", label: "Yes" },
  {
    value: "INTERVIEW_NOT_CONDUCTED",
    label: "No, interview was not conducted",
  },
] as const;

type Waiver = (typeof OPTIONS)[number]["value"];

function renderDropdown({
  mode = "EDIT",
  value = null,
  onSave = vi.fn().mockResolvedValue(undefined),
}: {
  mode?: "EDIT" | "READ";
  value?: Waiver | null;
  onSave?: (value: Waiver) => Promise<void>;
}) {
  render(
    <ReportDropdown
      mode={mode}
      label="4th Amendment Waiver"
      options={[...OPTIONS]}
      value={value}
      onSave={onSave}
    />,
  );
  return onSave;
}

describe("ReportDropdown", () => {
  it("shows the placeholder before the PHI picks an option", () => {
    renderDropdown({});

    expect(
      screen.getByRole("button", { name: "4th Amendment Waiver: Select" }),
    ).toBeInTheDocument();
  });

  it("shows the saved option on the toggle", () => {
    renderDropdown({ value: "INTERVIEW_NOT_CONDUCTED" });

    expect(
      screen.getByRole("button", {
        name: "4th Amendment Waiver: No, interview was not conducted",
      }),
    ).toBeInTheDocument();
  });

  it("saves the option the PHI picks", async () => {
    const onSave = renderDropdown({});

    fireEvent.click(screen.getByRole("button", { name: /Select/ }));
    fireEvent.click(screen.getByText("Yes"));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith("YES"));
  });

  it("shows an error when the save fails", async () => {
    renderDropdown({ onSave: vi.fn().mockRejectedValue(new Error("offline")) });

    fireEvent.click(screen.getByRole("button", { name: /Select/ }));
    fireEvent.click(screen.getByText("Yes"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      AUTOSAVE_FAILED_MESSAGE,
    );
    // The toggle goes back to the saved value, since the pick didn't save.
    expect(
      screen.getByRole("button", { name: "4th Amendment Waiver: Select" }),
    ).toBeInTheDocument();
  });

  describe("when the PHI picks again before the first save finishes", () => {
    // Each save waits until the test settles it, in the order it started.
    function savesTheTestSettles() {
      const settles: Array<{ resolve: () => void; reject: () => void }> = [];
      const onSave = vi.fn(
        () =>
          new Promise<void>((resolve, reject) => {
            settles.push({
              resolve,
              reject: () => reject(new Error("offline")),
            });
          }),
      );
      return { onSave, settles };
    }

    function pickYesThenNo() {
      fireEvent.click(screen.getByRole("button", { name: /Select/ }));
      fireEvent.click(screen.getByText("Yes"));
      fireEvent.click(screen.getByRole("button", { name: /: Yes/ }));
      fireEvent.click(screen.getByText("No, interview was not conducted"));
    }

    it("keeps showing the latest pick when the first save finishes", async () => {
      const { onSave, settles } = savesTheTestSettles();
      renderDropdown({ onSave });

      pickYesThenNo();
      await act(async () => settles[0].resolve());

      expect(
        screen.getByRole("button", {
          name: "4th Amendment Waiver: No, interview was not conducted",
        }),
      ).toBeInTheDocument();
    });

    it("doesn't show an error when only the first save fails", async () => {
      const { onSave, settles } = savesTheTestSettles();
      renderDropdown({ onSave });

      pickYesThenNo();
      await act(async () => settles[0].reject());
      await act(async () => settles[1].resolve());

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("shows the saved option as text in read mode", () => {
    renderDropdown({ mode: "READ", value: "YES" });

    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the missing-value text in read mode when nothing was picked", () => {
    renderDropdown({ mode: "READ" });

    expect(screen.getByText(MISSING_VALUE_TEXT)).toBeInTheDocument();
  });
});
