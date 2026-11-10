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
import userEvent from "@testing-library/user-event";

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

function renderStep(
  charges: UsIaEarlyDischargeCharge[],
  deselectedIds: string[] = [],
) {
  const chargesByJurisdiction = new Map<string, UsIaEarlyDischargeCharge[]>();
  charges.forEach((charge) =>
    chargesByJurisdiction.set(charge.jurisdiction, [
      ...(chargesByJurisdiction.get(charge.jurisdiction) ?? []),
      charge,
    ]),
  );
  const isChargeSelected = (id: string) => !deselectedIds.includes(id);
  const selectedChargesByJurisdiction = new Map(
    [...chargesByJurisdiction]
      .map(
        ([jurisdiction, jurisdictionCharges]) =>
          [
            jurisdiction,
            jurisdictionCharges.filter((charge) =>
              isChargeSelected(charge.chargeExternalId),
            ),
          ] as const,
      )
      .filter(([, jurisdictionCharges]) => jurisdictionCharges.length > 0),
  );
  const form = {
    opportunity: { chargesByJurisdiction },
    isChargeSelected,
    setChargesSelected: vi.fn(),
    selectedChargesByJurisdiction,
    selectedChargeCount: [...selectedChargesByJurisdiction.values()].flat()
      .length,
  } as unknown as UsIaEarlyDischargeForm;

  render(
    <OpportunityFormProvider value={form}>
      <FormChargesStep />
    </OpportunityFormProvider>,
  );
  return form;
}

describe("FormChargesStep", () => {
  it("names each jurisdiction's group by its visible label when there are several jurisdictions", () => {
    renderStep([
      charge("POLK", "FECR001", "THEFT IN THE THIRD DEGREE"),
      charge("MONROE", "FECR003", "CRIMINAL MISCHIEF"),
    ]);

    expect(
      screen.getByRole("group", { name: "POLK · 1 charge" }),
    ).toBeInTheDocument();
  });

  it("names the group by its jurisdiction when the label is hidden", () => {
    renderStep([charge("POLK", "FECR001", "THEFT IN THE THIRD DEGREE")]);

    expect(
      screen.getByRole("group", { name: "POLK charges" }),
    ).toBeInTheDocument();
  });

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

  it("starts every charge checked and counts them", () => {
    renderStep([
      charge("POLK", "FECR001", "THEFT IN THE THIRD DEGREE"),
      charge("POLK", "FECR002", "BURGLARY IN THE THIRD DEGREE"),
    ]);

    expect(screen.getByLabelText(/THEFT IN THE THIRD DEGREE/)).toBeChecked();
    expect(screen.getByLabelText(/BURGLARY IN THE THIRD DEGREE/)).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent("2 selected");
  });

  it("shows a deselected charge unchecked and leaves it out of the count", () => {
    renderStep(
      [
        charge("POLK", "FECR001", "THEFT IN THE THIRD DEGREE"),
        charge("POLK", "FECR002", "BURGLARY IN THE THIRD DEGREE"),
      ],
      ["FECR002"],
    );

    expect(screen.getByLabelText(/THEFT IN THE THIRD DEGREE/)).toBeChecked();
    expect(
      screen.getByLabelText(/BURGLARY IN THE THIRD DEGREE/),
    ).not.toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent("1 selected");
  });

  it("saves the change when a charge is unchecked or checked", async () => {
    const form = renderStep(
      [
        charge("POLK", "FECR001", "THEFT IN THE THIRD DEGREE"),
        charge("POLK", "FECR002", "BURGLARY IN THE THIRD DEGREE"),
      ],
      ["FECR002"],
    );

    await userEvent.click(screen.getByLabelText(/THEFT IN THE THIRD DEGREE/));
    expect(form.setChargesSelected).toHaveBeenCalledWith(["FECR001"], false);

    await userEvent.click(
      screen.getByLabelText(/BURGLARY IN THE THIRD DEGREE/),
    );
    expect(form.setChargesSelected).toHaveBeenCalledWith(["FECR002"], true);
    expect(form.setChargesSelected).toHaveBeenCalledTimes(2);
  });
});

describe("Select all", () => {
  const polkCharges = [
    charge("POLK", "FECR001", "THEFT IN THE THIRD DEGREE"),
    charge("POLK", "FECR002", "BURGLARY IN THE THIRD DEGREE"),
  ];

  it("shows for a jurisdiction with several charges, even as the only jurisdiction", () => {
    renderStep(polkCharges);

    expect(screen.getByLabelText("Select all")).toBeInTheDocument();
  });

  it("shows only on jurisdictions with several charges", () => {
    renderStep([
      ...polkCharges,
      charge("MONROE", "FECR003", "CRIMINAL MISCHIEF"),
    ]);

    expect(screen.getAllByLabelText("Select all")).toHaveLength(1);
  });

  it("hides for a jurisdiction with one charge", () => {
    renderStep([charge("POLK", "FECR001", "THEFT IN THE THIRD DEGREE")]);

    expect(screen.queryByLabelText("Select all")).not.toBeInTheDocument();
  });

  it.each([
    ["every charge is selected", true, false, []],
    ["some charges are selected", false, true, ["FECR002"]],
    ["no charges are selected", false, false, ["FECR001", "FECR002"]],
  ])(
    "when %s, is checked: %s and indeterminate: %s",
    (_, checked, indeterminate, deselectedIds) => {
      renderStep(polkCharges, deselectedIds);

      const selectAll = screen.getByLabelText("Select all") as HTMLInputElement;
      expect(selectAll.checked).toBe(checked);
      expect(selectAll.indeterminate).toBe(indeterminate);
    },
  );

  it.each([
    ["every charge is selected", [], ["FECR001", "FECR002"], false],
    ["some charges are selected", ["FECR002"], ["FECR002"], true],
    [
      "no charges are selected",
      ["FECR001", "FECR002"],
      ["FECR001", "FECR002"],
      true,
    ],
  ])(
    "when %s, a click sets only the charges that change",
    async (_, deselectedIds, changedIds, selected) => {
      const form = renderStep(polkCharges, deselectedIds);

      await userEvent.click(screen.getByLabelText("Select all"));

      expect(form.setChargesSelected).toHaveBeenCalledTimes(1);
      expect(form.setChargesSelected).toHaveBeenCalledWith(
        changedIds,
        selected,
      );
    },
  );
});
