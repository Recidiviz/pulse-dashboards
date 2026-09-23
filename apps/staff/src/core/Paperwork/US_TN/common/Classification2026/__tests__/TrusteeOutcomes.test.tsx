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

import { render, screen, within } from "@testing-library/react";

import { TRUSTEE_ANNEX_SUB_QUESTION, TRUSTEE_CRITERIA } from "~datatypes";

import { FormBase } from "../../../../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { OpportunityFormProvider } from "../../../../OpportunityFormContext";
import { TrusteeEligibility } from "../TrusteeOutcomes";

const keyFor = (n: number) => TRUSTEE_CRITERIA[n - 1].key;

const allTrue = Object.fromEntries(
  TRUSTEE_CRITERIA.map((c) => [c.key, "true"]),
);

function renderOutcomes(formData: Record<string, string> = {}) {
  const form = {
    formData,
    updateDraftData: vi.fn(),
  } as unknown as FormBase<any>;

  return render(
    <OpportunityFormProvider value={form}>
      <TrusteeEligibility />
    </OpportunityFormProvider>,
  );
}

describe("TrusteeOutcome", () => {
  it("says the outcome is pending while unresolved", () => {
    renderOutcomes();

    expect(
      screen.getByText(/Complete remaining criteria to determine Trustee/),
    ).toBeInTheDocument();
  });

  it("reports eligibility when all fifteen are met", () => {
    renderOutcomes(allTrue);

    expect(
      screen.getByText(
        /Inmate is eligible for Trustee custody\. All 15 criteria/,
      ),
    ).toBeInTheDocument();
  });

  it("names the Assistant Commissioner when a Group E criterion is False", () => {
    renderOutcomes({ ...allTrue, [keyFor(15)]: "false" });

    expect(
      screen.getByText(
        /criterion 15 was marked False, and the Assistant Commissioner must approve/,
      ),
    ).toBeInTheDocument();
  });

  it("lists both Group E criteria when both are False", () => {
    renderOutcomes({
      ...allTrue,
      [keyFor(14)]: "false",
      [keyFor(15)]: "false",
    });

    const block = screen.getByText("Trustee custody").parentElement;

    expect(block?.textContent).toContain(
      "criteria 14 and 15 were marked False",
    );
  });

  it("lists every failed hard bar, not just the first", () => {
    renderOutcomes({
      ...allTrue,
      [keyFor(1)]: "false",
      [keyFor(9)]: "false",
      [keyFor(12)]: "false",
    });

    expect(screen.getByText("Criterion 1 not met.")).toBeInTheDocument();
    expect(screen.getByText("Criterion 9 not met.")).toBeInTheDocument();
    expect(screen.getByText("Criterion 12 not met.")).toBeInTheDocument();
  });

  it("states a failure as the requirement that was not met", () => {
    renderOutcomes({ [keyFor(3)]: "false" });

    expect(screen.getByText("Criterion 3 not met.")).toBeInTheDocument();
    expect(screen.getByText(/Requirement:/)).toBeInTheDocument();
    expect(screen.getByText(/a sex offender/)).toBeInTheDocument();
  });

  it("offers no way to hand-edit the outcome", () => {
    renderOutcomes(allTrue);

    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });
});

describe("AnnexOutcome", () => {
  it("asks only for criteria 1 through 6 while unresolved", () => {
    renderOutcomes();

    expect(
      screen.getByText(/Complete criteria 1 through 6 to determine Annex/),
    ).toBeInTheDocument();
  });

  it("resolves without waiting on criteria 7 through 15", () => {
    const annexOnly = Object.fromEntries(
      TRUSTEE_CRITERIA.filter((c) => c.affectsAnnex).map((c) => [
        c.key,
        "true",
      ]),
    );
    renderOutcomes(annexOnly);

    expect(
      screen.getByText("Inmate is eligible for Annex housing placement."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Warden approval is required for Annex housing/),
    ).toBeInTheDocument();
  });

  it("says so when Annex is not available", () => {
    renderOutcomes({ ...allTrue, [keyFor(1)]: "false" });

    expect(
      screen.getByText("Inmate is not eligible for Annex housing placement."),
    ).toBeInTheDocument();
  });

  it("explains the sex offender route when that is why Annex is open", () => {
    renderOutcomes({
      ...allTrue,
      [TRUSTEE_ANNEX_SUB_QUESTION.parentKey]: "false",
      [TRUSTEE_ANNEX_SUB_QUESTION.key]: "true",
    });

    expect(
      screen.getByText(/Sex offenders with 7 years or less remaining/),
    ).toBeInTheDocument();
  });

  it("can be eligible while Trustee is not", () => {
    renderOutcomes({
      ...allTrue,
      [TRUSTEE_ANNEX_SUB_QUESTION.parentKey]: "false",
      [TRUSTEE_ANNEX_SUB_QUESTION.key]: "true",
    });

    expect(
      screen.getByText("Inmate is not eligible for Trustee custody."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Inmate is eligible for Annex housing placement."),
    ).toBeInTheDocument();
  });
});

describe("TrusteeEligibility", () => {
  it("states both outcomes inside one box", () => {
    const { container } = renderOutcomes({
      ...allTrue,
      [TRUSTEE_ANNEX_SUB_QUESTION.parentKey]: "false",
      [TRUSTEE_ANNEX_SUB_QUESTION.key]: "true",
    });

    const box = container.firstElementChild as HTMLElement;

    expect(container.children).toHaveLength(1);
    expect(within(box).getByText("Trustee custody")).toBeInTheDocument();
    expect(within(box).getByText("Annex housing")).toBeInTheDocument();
  });
});
