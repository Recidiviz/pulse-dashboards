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

import { UsIaEarlyDischargeOpportunity } from "../../../../../WorkflowsStore/Opportunity/UsIa";
import { FormHeaderProps } from "../../../FormContainer";
import { FormUsIaEarlyDischargeV2 } from "../FormUsIaEarlyDischargeV2";

vi.mock("../../../FormContainer", () => ({
  FormContainer: ({ menuActions = [], printable }: FormHeaderProps) => (
    <div data-printable={String(!!printable)}>
      {menuActions.map(({ label, onClick }) => (
        <button key={label} onClick={onClick}>
          {label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock("../FormChargesStep", () => ({ FormChargesStep: () => null }));
vi.mock("../FormOrderStep", () => ({ FormOrderStep: () => null }));

function renderForm() {
  const opportunity = Object.assign(
    Object.create(UsIaEarlyDischargeOpportunity.prototype),
    { person: { supervisionType: "PROBATION" } },
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

  it("asks the form container to print only the form", () => {
    const { container } = renderForm();

    expect(container.querySelector('[data-printable="true"]')).not.toBeNull();
  });
});
