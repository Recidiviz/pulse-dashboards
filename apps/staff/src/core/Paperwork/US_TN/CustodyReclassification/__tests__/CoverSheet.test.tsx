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
import { Mock } from "vitest";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../../../components/StoreProvider";
import { RootStore } from "../../../../../RootStore";
import { FormBase } from "../../../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { OpportunityFormProvider } from "../../../OpportunityFormContext";
import CoverSheet from "../CoverSheet";

vi.mock("../../../../../components/StoreProvider");

const useRootStoreMock = useRootStore as Mock;
const useFeatureVariantsMock = useFeatureVariants as Mock;

const GATING_HEADING = /If Offender scored or overridden to LOW/;

function renderCoverSheet({
  reworkEnabled = false,
  oppType = "usTnAnnualReclassification2026Policy",
} = {}) {
  useRootStoreMock.mockReturnValue(new RootStore());
  useFeatureVariantsMock.mockReturnValue(
    reworkEnabled ? { trusteeChecklistRework: {} } : {},
  );

  const form = {
    formData: {},
    derivedData: {},
    opportunity: { type: oppType },
    updateDraftData: vi.fn(),
  } as unknown as FormBase<any>;

  render(
    <OpportunityFormProvider value={form}>
      <CoverSheet />
    </OpportunityFormProvider>,
  );
}

describe("CoverSheet trustee gating questions", () => {
  it("asks the four gating questions while the rework is off", () => {
    renderCoverSheet();

    expect(screen.getByText(GATING_HEADING)).toBeInTheDocument();
    expect(
      screen.getByText(/Are they serving a Life Sentence/),
    ).toBeInTheDocument();
  });

  it("retires the gating questions under the rework", () => {
    renderCoverSheet({ reworkEnabled: true });

    expect(screen.queryByText(GATING_HEADING)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Are they serving a Life Sentence/),
    ).not.toBeInTheDocument();
  });

  it("keeps the rest of the pilot header either way", () => {
    renderCoverSheet({ reworkEnabled: true });

    expect(
      screen.getByText(/FOR 2026 CLASSIFICATION PILOT PURPOSES/),
    ).toBeInTheDocument();
  });

  it("never asks them on the diagnostic form, which has no gating block", () => {
    renderCoverSheet({ oppType: "usTnInitialClassification2026Policy" });

    expect(screen.queryByText(GATING_HEADING)).not.toBeInTheDocument();
  });
});
