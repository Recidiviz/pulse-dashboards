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

import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { Mock } from "vitest";

import { UsIaEarlyDischargeCharge } from "~datatypes";

import { useRootStore } from "../../../../../components/StoreProvider";
import { UsIaEarlyDischargeForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import { OpportunityFormProvider } from "../../../OpportunityFormContext";
import { REACTIVE_INPUT_UPDATE_DELAY } from "../../../utils";
import { FormJurisdictionBlock } from "../FormJurisdictionBlock";

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
      <FormJurisdictionBlock jurisdiction="BLACK HAWK" charges={charges} />
    </OpportunityFormProvider>,
  );
  return form;
}

describe("FormJurisdictionBlock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels a one-charge jurisdiction with the charge's meta line", () => {
    renderBlock([charge("FECR002891")]);

    expect(
      screen.getByText("BLACK HAWK · FECR002891 · Count 1"),
    ).toBeInTheDocument();
  });

  it("labels a several-charge jurisdiction with its charge count", () => {
    renderBlock([charge("FECR002891"), charge("FECR004417")]);

    expect(screen.getByText("BLACK HAWK · 2 charges")).toBeInTheDocument();
  });

  it("makes the header a heading, so screen readers can jump between blocks", () => {
    renderBlock([charge("FECR002891"), charge("FECR004417")]);

    expect(
      screen.getByRole("heading", { level: 3, name: "BLACK HAWK · 2 charges" }),
    ).toBeInTheDocument();
  });

  it("names its region after the header, so the narrative has context", () => {
    renderBlock([charge("FECR002891"), charge("FECR004417")]);

    const region = screen.getByRole("region", {
      name: "BLACK HAWK · 2 charges",
    });
    expect(within(region).getByRole("textbox")).toBeInTheDocument();
  });

  it("scrolls the charge table sideways instead of cutting off columns", () => {
    renderBlock([charge("FECR002891")]);

    const scroller = screen.getByRole("group", { name: "BLACK HAWK charges" });
    expect(within(scroller).getByRole("table")).toBeInTheDocument();
    expect(scroller).toHaveStyle({ overflowX: "auto" });
    expect(scroller).toHaveAttribute("tabindex", "0");
  });

  it("has no detectable accessibility violations", async () => {
    renderBlock([charge("FECR002891"), charge("FECR004417")]);

    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("excludes the narrative from session recordings", () => {
    renderBlock([charge("FECR002891")]);

    expect(screen.getByRole("textbox").closest(".fs-exclude")).not.toBeNull();
  });

  it("saves the narrative to a draft field named for the jurisdiction", () => {
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
