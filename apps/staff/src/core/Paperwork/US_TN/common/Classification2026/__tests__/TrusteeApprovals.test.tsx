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

import { cleanup, render, screen, within } from "@testing-library/react";

import { TRUSTEE_ANNEX_SUB_QUESTION, TRUSTEE_CRITERIA } from "~datatypes";

import { FormBase } from "../../../../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { OpportunityFormProvider } from "../../../../OpportunityFormContext";
import { TrusteeApprovals } from "../TrusteeApprovals";

const keyFor = (n: number) => TRUSTEE_CRITERIA[n - 1].key;
const allTrue = Object.fromEntries(
  TRUSTEE_CRITERIA.map((c) => [c.key, "true"]),
);

function renderApprovals(formData: Record<string, string> = {}) {
  const form = {
    formData,
    updateDraftData: vi.fn(),
  } as unknown as FormBase<any>;

  render(
    <OpportunityFormProvider value={form}>
      <TrusteeApprovals />
    </OpportunityFormProvider>,
  );
}

const row = (label: RegExp) =>
  screen.getByText(label).closest("tr") as HTMLElement;

describe("TrusteeApprovals", () => {
  it("labels the section as a record of decisions, not signatures", () => {
    renderApprovals();

    expect(screen.getByText("Approvals recorded")).toBeInTheDocument();
    expect(
      screen.getByText(/records of decisions, not signatures/),
    ).toBeInTheDocument();
  });

  it("renders all four approvers even when none apply", () => {
    renderApprovals();

    expect(row(/Warden, Trustee custody/)).toBeInTheDocument();
    expect(row(/Warden, Annex housing/)).toBeInTheDocument();
    expect(row(/Contract Monitor/)).toBeInTheDocument();
    expect(row(/Assistant Commissioner/)).toBeInTheDocument();
  });

  it("does not assert ineligibility or waive the AC on a blank form", () => {
    renderApprovals();

    [
      /Warden, Trustee custody/,
      /Contract Monitor/,
      /Assistant Commissioner/,
    ].forEach((label) => {
      const cells = within(row(label));
      expect(cells.getByText(/Pending\. Complete/)).toBeInTheDocument();
      expect(cells.queryByText(/Not applicable/)).not.toBeInTheDocument();
    });
  });

  it("states Not applicable explicitly rather than omitting a row", () => {
    renderApprovals(allTrue);

    expect(
      within(row(/Assistant Commissioner/)).getByText(
        /Approval only required if criteria 14 or 15 is False/,
      ),
    ).toBeInTheDocument();
  });

  it("opens the Warden row only once Trustee eligibility is settled", () => {
    renderApprovals();
    expect(
      within(row(/Warden, Trustee custody/)).getByText(/Pending\. Complete/),
    ).toBeInTheDocument();

    cleanup();
    renderApprovals(allTrue);
    expect(
      within(row(/Warden, Trustee custody/)).getByRole("checkbox", {
        name: /approved/,
      }),
    ).toBeInTheDocument();
  });

  it("closes the Warden row when the inmate is not eligible", () => {
    renderApprovals({ ...allTrue, [keyFor(1)]: "false" });

    expect(
      within(row(/Warden, Trustee custody/)).getByText(
        /not eligible for Trustee custody/,
      ),
    ).toBeInTheDocument();
  });

  it("asks only for criteria 1 through 6 on the Annex row", () => {
    renderApprovals();

    expect(
      within(row(/Warden, Annex housing/)).getByText(
        /Pending\. Complete criteria 1 through 6\./,
      ),
    ).toBeInTheDocument();
  });

  it("opens the Annex row while Trustee is not eligible", () => {
    renderApprovals({
      ...allTrue,
      [TRUSTEE_ANNEX_SUB_QUESTION.parentKey]: "false",
      [TRUSTEE_ANNEX_SUB_QUESTION.key]: "true",
    });

    expect(
      within(row(/Warden, Annex housing/)).getByRole("checkbox", {
        name: /approved/,
      }),
    ).toBeInTheDocument();
    expect(
      within(row(/Warden, Trustee custody/)).getByText(
        /not eligible for Trustee custody/,
      ),
    ).toBeInTheDocument();
  });

  it("names the criterion that triggered the Assistant Commissioner", () => {
    renderApprovals({ ...allTrue, [keyFor(15)]: "false" });

    const acRow = row(/Assistant Commissioner/);

    expect(
      within(acRow).getByText(/Required because criterion 15 was marked False/),
    ).toBeInTheDocument();
    expect(
      within(acRow).getByRole("checkbox", { name: /approved/ }),
    ).toBeInTheDocument();
  });

  it("names both criteria when both triggered it", () => {
    renderApprovals({
      ...allTrue,
      [keyFor(14)]: "false",
      [keyFor(15)]: "false",
    });

    expect(
      within(row(/Assistant Commissioner/)).getByText(
        /Required because criteria 14 and 15 were marked False/,
      ),
    ).toBeInTheDocument();
  });

  it("names no trigger when a hard bar already failed alongside criterion 14", () => {
    renderApprovals({
      ...allTrue,
      [keyFor(10)]: "false",
      [keyFor(14)]: "false",
    });

    const acRow = row(/Assistant Commissioner/);

    expect(
      within(acRow).queryByText(/Required because/),
    ).not.toBeInTheDocument();
    expect(
      within(acRow).getByText(/Approval only required if criteria 14 or 15/),
    ).toBeInTheDocument();
  });

  it("says approvals are not required when neither placement is open", () => {
    renderApprovals({ ...allTrue, [keyFor(1)]: "false" });

    expect(screen.getByText(/No approvals are required/)).toBeInTheDocument();
  });

  it("suppresses that header while Annex eligibility is still open", () => {
    renderApprovals({ [TRUSTEE_ANNEX_SUB_QUESTION.parentKey]: "false" });

    expect(screen.queryByText(/No approvals are required/)).toBeNull();
  });

  it("offers squares to tick rather than radios to choose between", () => {
    renderApprovals(allTrue);

    expect(screen.queryAllByRole("radio")).toHaveLength(0);

    const boxes = screen.getAllByRole("checkbox");

    expect(boxes.length).toBeGreaterThan(0);
    boxes.forEach((box) => {
      expect(box).toHaveAccessibleName(/: (approved|denied)$/);
    });
  });

  it("records nothing in the app, because the decision is made on paper", () => {
    const updateDraftData = vi.fn();
    const form = {
      formData: allTrue,
      updateDraftData,
    } as unknown as FormBase<any>;

    render(
      <OpportunityFormProvider value={form}>
        <TrusteeApprovals />
      </OpportunityFormProvider>,
    );

    screen.getAllByRole("checkbox").forEach((box) => {
      expect(box).toBeDisabled();
    });

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /sign/i })).toBeNull();
    expect(updateDraftData).not.toHaveBeenCalled();
  });

  it("stacks the two decisions so the column costs one word of width", () => {
    renderApprovals(allTrue);

    const approved = within(row(/Warden, Trustee custody/)).getByLabelText(
      /: approved$/,
    );

    expect(approved.closest("label")).toHaveStyleRule("display", "block");
  });

  it("gives the signature its own rule above the date rule", () => {
    renderApprovals(allTrue);

    const cell = within(row(/Warden, Trustee custody/))
      .getByText("Signature:")
      .closest("td") as HTMLElement;

    const rules = cell.querySelectorAll("div");

    expect(rules).toHaveLength(3);
    expect(rules[0]).toHaveStyleRule("border-bottom", "1px solid black");
    expect(rules[1]).toHaveTextContent("Date received:");
    expect(rules[2]).toHaveStyleRule("border-bottom", "1px solid black");
  });

  it("heads the column for both marks it now carries", () => {
    renderApprovals();

    expect(
      screen.getByRole("columnheader", { name: "Signature and date" }),
    ).toBeInTheDocument();
  });

  it("drops the state column now that every row states its own", () => {
    renderApprovals();

    expect(screen.queryByRole("columnheader", { name: "State" })).toBeNull();
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  });
});
