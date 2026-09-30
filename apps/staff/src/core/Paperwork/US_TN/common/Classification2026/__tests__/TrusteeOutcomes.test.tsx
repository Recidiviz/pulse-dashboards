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

/** Headings split over several elements, so read them off the rendered text. */
function text(container: HTMLElement): string {
  return container.textContent ?? "";
}

describe("TrusteeOutcome", () => {
  it("says the outcome is pending while unresolved", () => {
    const { container } = renderOutcomes();

    expect(text(container)).toContain(
      "Complete remaining questions to determine Trustee eligibility.",
    );
  });

  it("reports eligibility when all fifteen are met", () => {
    const { container } = renderOutcomes(allTrue);

    expect(text(container)).toContain("Inmate is eligible for Trustee custody");
    expect(text(container)).toContain("All 15 questions are met.");
  });

  it("underlines the verdict so it can be found without reading the sentence", () => {
    const { container } = renderOutcomes({ ...allTrue, [keyFor(3)]: "false" });

    expect(
      Array.from(container.querySelectorAll("span")).map((s) => s.textContent),
    ).toContain("not eligible");
  });

  it("names the Assistant Commissioner when a Group E question is False", () => {
    const { container } = renderOutcomes({
      ...allTrue,
      [keyFor(15)]: "false",
    });

    expect(
      screen.getByText(/^Question 15 is False: .*risk assessment/),
    ).toBeInTheDocument();
    expect(text(container)).toContain("Assistant Commissioner approval");
  });

  it("lists both Group E questions when both are False", () => {
    renderOutcomes({
      ...allTrue,
      [keyFor(14)]: "false",
      [keyFor(15)]: "false",
    });

    expect(screen.getByText(/^Question 14 is False:/)).toBeInTheDocument();
    expect(screen.getByText(/^Question 15 is False:/)).toBeInTheDocument();
  });

  it("lists every failed hard bar, not just the first", () => {
    renderOutcomes({
      ...allTrue,
      [keyFor(1)]: "false",
      [keyFor(9)]: "false",
      [keyFor(12)]: "false",
    });

    expect(screen.getByText(/^Question 1 is False:/)).toBeInTheDocument();
    expect(screen.getByText(/^Question 9 is False:/)).toBeInTheDocument();
    expect(screen.getByText(/^Question 12 is False:/)).toBeInTheDocument();
  });

  it("quotes the question it names, without the bold markers", () => {
    renderOutcomes({ [keyFor(3)]: "false" });

    expect(
      screen.getByText("Question 3 is False: “Inmate is not a sex offender.”"),
    ).toBeInTheDocument();
  });

  it("offers no way to hand-edit the outcome", () => {
    renderOutcomes(allTrue);

    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });
});

describe("AnnexOutcome", () => {
  it("asks only for questions 1 through 6 while unresolved", () => {
    const { container } = renderOutcomes();

    expect(text(container)).toContain(
      "Complete questions 1 through 6 to determine Annex eligibility.",
    );
  });

  it("resolves without waiting on questions 7 through 15", () => {
    const annexOnly = Object.fromEntries(
      TRUSTEE_CRITERIA.filter((c) => c.affectsAnnex).map((c) => [
        c.key,
        "true",
      ]),
    );
    const { container } = renderOutcomes(annexOnly);

    expect(text(container)).toContain(
      "Inmate is eligible for Annex housing placement",
    );
    expect(
      screen.getByText("Warden approval required for Annex housing."),
    ).toBeInTheDocument();
  });

  it("says so when Annex is not available", () => {
    const { container } = renderOutcomes({ ...allTrue, [keyFor(1)]: "false" });

    expect(text(container)).toContain(
      "Inmate is not eligible for Annex housing placement",
    );
  });

  it("explains the sex offender route when that is why Annex is open", () => {
    renderOutcomes({
      ...allTrue,
      [TRUSTEE_ANNEX_SUB_QUESTION.parentKey]: "false",
      [TRUSTEE_ANNEX_SUB_QUESTION.key]: "true",
    });

    expect(
      screen.getByText(/^Sex offenders with 7 years or less remaining/),
    ).toBeInTheDocument();
  });

  it("can be eligible while Trustee is not", () => {
    const { container } = renderOutcomes({
      ...allTrue,
      [TRUSTEE_ANNEX_SUB_QUESTION.parentKey]: "false",
      [TRUSTEE_ANNEX_SUB_QUESTION.key]: "true",
    });

    expect(text(container)).toContain(
      "Inmate is not eligible for Trustee custody",
    );
    expect(text(container)).toContain(
      "Inmate is eligible for Annex housing placement",
    );
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

    expect(text(box)).toContain("Inmate is not eligible for Trustee custody");
    expect(text(box)).toContain(
      "Inmate is eligible for Annex housing placement",
    );
  });

  it("sends the reader on to the approvals page", () => {
    const { container } = renderOutcomes(allTrue);

    expect(text(container)).toContain(
      "Continue to the next page for approvals and signatures",
    );
  });
});
