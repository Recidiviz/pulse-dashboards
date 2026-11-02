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
import { FormChargesStep } from "../FormChargesStep";

function charge(
  jurisdiction: string,
  causeNumber: string,
  description: string,
): UsIaEarlyDischargeCharge {
  return {
    jurisdiction,
    causeNumber,
    description,
    counts: 1,
    chargeExternalId: causeNumber,
    crimeCdOffenseType: "",
    classificationTypeRawText: "",
    statute: "",
    tdd: "",
    sdd: "",
  };
}

function renderStep(charges: UsIaEarlyDischargeCharge[]) {
  const chargesByJurisdiction = new Map<string, UsIaEarlyDischargeCharge[]>();
  charges.forEach((c) =>
    chargesByJurisdiction.set(c.jurisdiction, [
      ...(chargesByJurisdiction.get(c.jurisdiction) ?? []),
      c,
    ]),
  );
  const form = {
    opportunity: { chargesByJurisdiction },
  } as unknown as UsIaEarlyDischargeForm;

  return render(
    <OpportunityFormProvider value={form}>
      <FormChargesStep />
    </OpportunityFormProvider>,
  );
}

describe("FormChargesStep", () => {
  it("lists charges from every jurisdiction under a label for each", () => {
    renderStep([
      charge("POLK", "FECR001", "THEFT IN THE THIRD DEGREE"),
      charge("POLK", "FECR002", "BURGLARY IN THE THIRD DEGREE"),
      charge("MONROE", "FECR003", "CRIMINAL MISCHIEF"),
    ]);

    expect(screen.getByText("POLK · 2 charges")).toBeInTheDocument();
    expect(screen.getByText("MONROE · 1 charge")).toBeInTheDocument();
    expect(screen.getByText("CRIMINAL MISCHIEF")).toBeInTheDocument();
  });

  it("omits jurisdiction labels when every charge is in one jurisdiction", () => {
    renderStep([
      charge("POLK", "FECR001", "THEFT IN THE THIRD DEGREE"),
      charge("POLK", "FECR002", "BURGLARY IN THE THIRD DEGREE"),
    ]);

    expect(screen.queryByText(/· 2 charges/)).not.toBeInTheDocument();
  });
});
