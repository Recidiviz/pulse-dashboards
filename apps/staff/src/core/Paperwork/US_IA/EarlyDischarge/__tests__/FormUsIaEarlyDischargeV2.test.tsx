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

import { UsIaEarlyDischargeForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import { UsIaEarlyDischargeOpportunity } from "../../../../../WorkflowsStore/Opportunity/UsIa";
import { UsIaEarlyDischargeOpportunityUpdate } from "../../../../../WorkflowsStore/Opportunity/UsIa/UsIaEarlyDischargeOpportunity/types";
import { FormHeaderProps } from "../../../FormContainer";
import { FormUsIaEarlyDischargeV2 } from "../FormUsIaEarlyDischargeV2";

vi.mock("../../../FormContainer", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../FormContainer")>()),
  FormContainer: ({
    additionalHeaderButtons,
    children,
    menuActions = [],
    printable,
  }: FormHeaderProps) => (
    <div data-printable={String(!!printable)}>
      {additionalHeaderButtons}
      {menuActions.map(({ label, onClick }) => (
        <button key={label} onClick={onClick}>
          {label}
        </button>
      ))}
      {children}
    </div>
  ),
}));
vi.mock("../FormChargesStep", () => ({
  FormChargesStep: ({
    emptySelectionAction,
  }: {
    emptySelectionAction?: string;
  }) =>
    emptySelectionAction ? (
      <p>Charges step: {emptySelectionAction} pressed</p>
    ) : null,
}));
vi.mock("../FormOrderStep", () => ({ FormOrderStep: () => null }));
vi.mock("../SubmitForApprovalModal", () => ({
  SubmitForApprovalModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog" aria-label="Submit for approval" /> : null,
}));

const SUBMIT = "Submit for supervisor approval";

function renderForm({
  charges = {},
  selectedChargeCount = 1,
}: {
  charges?: UsIaEarlyDischargeOpportunityUpdate["charges"];
  selectedChargeCount?: number;
} = {}) {
  const opportunity = Object.assign(
    Object.create(UsIaEarlyDischargeOpportunity.prototype),
    {
      person: { supervisionType: "PROBATION" },
      updatesSubscription: { data: { charges } },
      form: { selectedChargeCount } as UsIaEarlyDischargeForm,
    },
  ) as UsIaEarlyDischargeOpportunity;
  return render(<FormUsIaEarlyDischargeV2 opportunity={opportunity} />);
}

describe("FormUsIaEarlyDischargeV2", () => {
  it("opens the browser's print dialog from the header's menu", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Print" }));

    expect(print).toHaveBeenCalledOnce();
  });

  it("tells the charges step, instead of printing, when no charge is selected", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    renderForm({ selectedChargeCount: 0 });

    fireEvent.click(screen.getByRole("button", { name: "Print" }));

    expect(print).not.toHaveBeenCalled();
    expect(screen.getByText("Charges step: print pressed")).toBeInTheDocument();
  });

  it("asks the form container to print only the form", () => {
    const { container } = renderForm();

    expect(container.querySelector('[data-printable="true"]')).not.toBeNull();
  });

  it("opens the confirmation from the header's Submit button", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: SUBMIT }));

    expect(
      screen.getByRole("dialog", { name: "Submit for approval" }),
    ).toBeInTheDocument();
  });

  it("tells the charges step, instead of opening the confirmation, when no charge is selected", () => {
    renderForm({ selectedChargeCount: 0 });
    const submit = screen.getByRole("button", { name: SUBMIT });

    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByText("Charges step: submit pressed"),
    ).toBeInTheDocument();
  });

  it("drops Submit once the report is with the supervisor", () => {
    renderForm({
      charges: { C1: { iconSubmissionStatus: "SUPERVISOR_REVIEW" } },
    });

    expect(
      screen.queryByRole("button", { name: SUBMIT }),
    ).not.toBeInTheDocument();
  });
});
