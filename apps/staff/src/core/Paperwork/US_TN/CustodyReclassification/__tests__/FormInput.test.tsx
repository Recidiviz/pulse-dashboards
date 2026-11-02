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

import { FormBase } from "../../../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { FormViewerContext } from "../../../FormViewer";
import { OpportunityFormProvider } from "../../../OpportunityFormContext";
import FormInput from "../FormInput";

vi.mock("../../../../../components/StoreProvider", () => ({
  useRootStore: () => ({ workflowsStore: { formIsDownloading: false } }),
}));

function renderDateInput(
  finalApprovalDate: string,
  { isDate = true, isDownloading = false } = {},
) {
  const form = {
    formData: { finalApprovalDate },
    updateDraftData: vi.fn(),
  } as unknown as FormBase<any>;

  render(
    <FormViewerContext.Provider value={{ isDownloading }}>
      <OpportunityFormProvider value={form}>
        <FormInput name="finalApprovalDate" isDate={isDate} />
      </OpportunityFormProvider>
    </FormViewerContext.Provider>,
  );

  return screen.getByRole("textbox");
}

describe("FormInput date validation", () => {
  it("flags a date the CAF export would drop", () => {
    const input = renderDateInput("10-19/");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a date like MM/DD/YYYY");
  });

  it("does not flag a valid date", () => {
    const input = renderDateInput("10/19/2026");

    expect(input).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText("Enter a date like MM/DD/YYYY")).toBeNull();
  });

  it("does not flag an empty field", () => {
    const input = renderDateInput("");

    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("waits until the user leaves the field", () => {
    const input = renderDateInput("10/");

    fireEvent.focus(input);
    expect(input).not.toHaveAttribute("aria-invalid");

    fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("hides the warning while the form downloads", () => {
    const input = renderDateInput("10/", { isDownloading: true });

    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("does not validate inputs that are not dates", () => {
    const input = renderDateInput("10/", { isDate: false });

    expect(input).not.toHaveAttribute("aria-invalid");
  });
});
