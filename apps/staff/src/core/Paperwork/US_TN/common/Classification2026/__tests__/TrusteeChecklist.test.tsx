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

import { TRUSTEE_CRITERIA_SECTIONS } from "~datatypes";

import { FormBase } from "../../../../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { OpportunityFormProvider } from "../../../../OpportunityFormContext";
import { TrusteeChecklist } from "../TrusteeChecklist";

const mocks = vi.hoisted(() => ({
  featureVariants: {} as Record<string, unknown>,
}));

vi.mock("../../../../../../components/StoreProvider", () => ({
  useRootStore: () => ({ workflowsStore: { formIsPrinting: false } }),
  useFeatureVariants: () => mocks.featureVariants,
}));

const REWORK_SECTION_HEADING = TRUSTEE_CRITERIA_SECTIONS[0];

const LEGACY_INTRO = /All inmates that have a custody score placing them/;

function renderChecklist(reworkEnabled: boolean) {
  mocks.featureVariants = reworkEnabled ? { trusteeChecklistRework: {} } : {};

  const form = {
    formData: {},
    updateDraftData: vi.fn(),
    derivedData: {},
  } as unknown as FormBase<any>;

  render(
    <OpportunityFormProvider value={form}>
      <TrusteeChecklist display />
    </OpportunityFormProvider>,
  );
}

describe("TrusteeChecklist variant selector", () => {
  it("renders the legacy checklist while the variant is off", () => {
    renderChecklist(false);

    expect(screen.getByText(LEGACY_INTRO)).toBeInTheDocument();
    expect(screen.queryByText(REWORK_SECTION_HEADING)).toBeNull();
  });

  it("renders the reworked checklist under the variant", () => {
    renderChecklist(true);

    expect(screen.getByText(REWORK_SECTION_HEADING)).toBeInTheDocument();
    expect(screen.queryByText(LEGACY_INTRO)).toBeNull();
  });
});
