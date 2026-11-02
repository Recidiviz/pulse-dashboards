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

import { act, fireEvent, render, screen } from "@testing-library/react";
import { Mock } from "vitest";

import { UsIaEarlyDischargeCharge } from "~datatypes";

import { useRootStore } from "../../../../../components/StoreProvider";
import { UsIaEarlyDischargeForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import { OpportunityFormProvider } from "../../../OpportunityFormContext";
import { REACTIVE_INPUT_UPDATE_DELAY } from "../../../utils";
import { FormCountyBlock } from "../FormCountyBlock";

vi.mock("../../../../../components/StoreProvider");

function charge(causeNumber: string): UsIaEarlyDischargeCharge {
  return {
    jurisdiction: "BLACK HAWK",
    causeNumber,
    description: "THEFT IN THE THIRD DEGREE",
    counts: 1,
    chargeExternalId: causeNumber,
    crimeCdOffenseType: "",
    classificationTypeRawText: "Aggravated Misdemeanor",
    statute: "",
    tdd: "",
    sdd: "",
  };
}

function renderBlock(charges: UsIaEarlyDischargeCharge[]) {
  (useRootStore as Mock).mockReturnValue({
    userStore: { userFullName: undefined, userFullNameFromAdminPanel: "" },
    workflowsStore: { user: undefined },
  });
  const form = {
    formData: {},
    formIsDownloading: false,
    formIsReverting: false,
    updateDraftData: vi.fn(),
    getCurrentUserFromFormRecord: () => undefined,
  } as unknown as UsIaEarlyDischargeForm;

  render(
    <OpportunityFormProvider value={form}>
      <FormCountyBlock jurisdiction="BLACK HAWK" charges={charges} />
    </OpportunityFormProvider>,
  );
  return form;
}

describe("FormCountyBlock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels a one-charge county with the charge's meta line", () => {
    renderBlock([charge("FECR002891")]);

    expect(
      screen.getByText("BLACK HAWK · FECR002891 · Count 1"),
    ).toBeInTheDocument();
  });

  it("labels a several-charge county with its charge count", () => {
    renderBlock([charge("FECR002891"), charge("FECR004417")]);

    expect(screen.getByText("BLACK HAWK · 2 charges")).toBeInTheDocument();
  });

  it("excludes the narrative from session recordings", () => {
    renderBlock([charge("FECR002891")]);

    expect(screen.getByRole("textbox").closest(".fs-exclude")).not.toBeNull();
  });

  it("saves the narrative to a draft field named for the county", () => {
    vi.useFakeTimers();
    const form = renderBlock([charge("FECR002891")]);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Paid restitution in full." },
    });
    act(() => {
      vi.advanceTimersByTime(REACTIVE_INPUT_UPDATE_DELAY);
    });

    expect(form.updateDraftData).toHaveBeenCalledWith(
      "narrative-BLACK HAWK",
      "Paid restitution in full.",
    );
  });
});
