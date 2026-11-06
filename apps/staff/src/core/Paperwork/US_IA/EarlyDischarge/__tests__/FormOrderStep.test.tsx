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

import { UsIaEarlyDischargeCharge } from "~datatypes";

import { UsIaEarlyDischargeForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import { OpportunityFormProvider } from "../../../OpportunityFormContext";
import { FormOrderStep } from "../FormOrderStep";

vi.mock("../FormCountyBlock", () => ({
  FormCountyBlock: ({
    jurisdiction,
    charges,
  }: {
    jurisdiction: string;
    charges: UsIaEarlyDischargeCharge[];
  }) => (
    <section aria-label={`${jurisdiction} block`}>
      {charges.map((c) => (
        <div key={c.chargeExternalId}>{c.description}</div>
      ))}
    </section>
  ),
}));

function charge(
  jurisdiction: string,
  chargeExternalId: string,
  description: string,
) {
  return {
    jurisdiction,
    chargeExternalId,
    description,
  } as UsIaEarlyDischargeCharge;
}

function renderStep(
  selectedChargesByJurisdiction: Map<string, UsIaEarlyDischargeCharge[]>,
  chargesByJurisdiction = selectedChargesByJurisdiction,
) {
  const form = {
    opportunity: {
      chargesByJurisdiction,
      person: {
        displayId: "DOC-001",
        fullName: { givenNames: "Jordan", surname: "Example" },
      },
    },
    selectedChargesByJurisdiction,
  } as unknown as UsIaEarlyDischargeForm;

  render(
    <OpportunityFormProvider value={form}>
      <FormOrderStep />
    </OpportunityFormProvider>,
  );
}

describe("FormOrderStep", () => {
  it("renders only the selected charges", () => {
    const theft = charge("POLK", "CHARGE-001", "THEFT");
    const burglary = charge("POLK", "CHARGE-002", "BURGLARY");
    renderStep(
      new Map([["POLK", [burglary]]]),
      new Map([["POLK", [theft, burglary]]]),
    );

    expect(screen.getByLabelText("POLK block")).toBeInTheDocument();
    expect(screen.getByText("BURGLARY")).toBeInTheDocument();
    expect(screen.queryByText("THEFT")).not.toBeInTheDocument();
    expect(screen.getByText("Shared header")).toBeInTheDocument();
  });

  it("renders one county block for now", () => {
    renderStep(
      new Map([
        ["POLK", [charge("POLK", "CHARGE-001", "THEFT")]],
        ["LINN", [charge("LINN", "CHARGE-002", "BURGLARY")]],
      ]),
    );

    expect(screen.getByLabelText("POLK block")).toBeInTheDocument();
    expect(screen.queryByLabelText("LINN block")).not.toBeInTheDocument();
  });

  it("shows an empty state when no charges are selected", () => {
    renderStep(
      new Map(),
      new Map([["POLK", [charge("POLK", "CHARGE-001", "THEFT")]]]),
    );

    expect(
      screen.getByText(
        "No charges selected — select charges above to generate the report.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Shared header")).not.toBeInTheDocument();
  });

  it("says the client has no eligible charges when there are none to select", () => {
    renderStep(new Map());

    expect(
      screen.getByText("No eligible charges for this client."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/select charges above/)).not.toBeInTheDocument();
    expect(screen.queryByText("Shared header")).not.toBeInTheDocument();
  });
});
