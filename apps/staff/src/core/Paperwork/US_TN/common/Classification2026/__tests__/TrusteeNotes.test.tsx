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

import { TRUSTEE_CRITERIA } from "~datatypes";

import { FormBase } from "../../../../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { OpportunityFormProvider } from "../../../../OpportunityFormContext";
import { TrusteeDenialReasons } from "../TrusteeNotes";

vi.mock("../../../../../../components/StoreProvider", () => ({
  useRootStore: () => ({ workflowsStore: { formIsPrinting: false } }),
  useFeatureVariants: () => ({}),
}));

const keyFor = (n: number) => TRUSTEE_CRITERIA[n - 1].key;
const allTrue = Object.fromEntries(
  TRUSTEE_CRITERIA.map((c) => [c.key, "true"]),
);

function renderNotes(formData: Record<string, string> = {}) {
  const updateDraftData = vi.fn();
  const form = { formData, updateDraftData } as unknown as FormBase<any>;

  render(
    <OpportunityFormProvider value={form}>
      <TrusteeDenialReasons />
    </OpportunityFormProvider>,
  );

  return { updateDraftData };
}

describe("TrusteeDenialReasons", () => {
  it("names the criterion that was not met", () => {
    renderNotes({ [keyFor(3)]: "false" });

    expect(screen.getByText("Criterion 3 not met.")).toBeInTheDocument();
    expect(
      screen.getByText(/The requirement is stated in full under Trustee/),
    ).toBeInTheDocument();
  });

  it("lists every failed criterion in one sentence", () => {
    renderNotes({ [keyFor(3)]: "false", [keyFor(11)]: "false" });

    expect(screen.getByText("Criteria 3 and 11 not met.")).toBeInTheDocument();
    expect(
      screen.getByText(/The requirements are stated in full under Trustee/),
    ).toBeInTheDocument();
  });

  it("does not restate what the eligibility block already prints", () => {
    renderNotes({ [keyFor(3)]: "false" });

    expect(screen.queryByText(/Inmate is not a sex offender/)).toBeNull();
  });

  it("explains that the paragraph fills itself in while nothing has failed", () => {
    renderNotes();

    expect(screen.getByText(/Fills in automatically/)).toBeInTheDocument();
    expect(screen.queryByText(/not met/)).toBeNull();
  });

  it("writes nothing to the draft, so mounting cannot edit a record", () => {
    const { updateDraftData } = renderNotes({ [keyFor(3)]: "false" });

    expect(updateDraftData).not.toHaveBeenCalled();
  });

  it("renders the derived sentence as text rather than a field", () => {
    renderNotes({ [keyFor(3)]: "false" });

    expect(screen.getByText("Criterion 3 not met.").tagName).toBe("SPAN");
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("offers one box for notes the derived paragraph does not cover", () => {
    renderNotes(allTrue);

    expect(screen.getByText("Additional notes")).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "name",
      "trusteeDenialNotes",
    );
  });
});
