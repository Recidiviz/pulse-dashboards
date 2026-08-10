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

import { format } from "date-fns";
import { useState } from "react";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { ChooseSnapshotStep, SnapshotOption } from "./ChooseSnapshotStep";
import { WizardModal, WizardStepper } from "./IndividualLevelDataFlow.styles";
import { TermsOfUseStep } from "./TermsOfUseStep";

type WizardStep = "chooseSnapshot" | "termsOfUse";

const WIZARD_STEPS = ["Snapshot type", "Terms of use"];

const WIZARD_STEP_CONTENT_LABELS: Record<WizardStep, string> = {
  chooseSnapshot: "Individual-level data",
  termsOfUse: "Terms of use",
};

type IndividualLevelDataFlowProps = {
  isOpen: boolean;
  onCancel: () => void;
  /**
   * Called when the user agrees to the terms. `snapshotDate` is the picked
   * month/year for the single-snapshot option, or `null` for the bulk
   * last-5-years option.
   */
  onAgree: (snapshotDate: Date | null) => void;
};

/**
 * Orchestrates the 2-step individual-level data download wizard: choosing a
 * snapshot (a single month/year, or every month for the last 5 years),
 * followed by the terms of use. Owns a single modal shell and the step
 * indicator so neither step-content component needs to render its own
 * modal or import the Stepper.
 */
export function IndividualLevelDataFlow({
  isOpen,
  onCancel,
  onAgree,
}: IndividualLevelDataFlowProps) {
  const [step, setStep] = useState<WizardStep>("chooseSnapshot");
  const [snapshotOption, setSnapshotOption] = useState<
    SnapshotOption | undefined
  >(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const resetWizardState = () => {
    setStep("chooseSnapshot");
    setSnapshotOption(undefined);
    setSelectedDate(null);
  };

  const handleCancel = () => {
    resetWizardState();
    onCancel();
  };

  // Unlike handleCancel, this only rewinds the step -- the snapshot
  // selection is preserved so the user doesn't lose their choice.
  const handleBack = () => {
    setStep("chooseSnapshot");
  };

  const handleAgree = () => {
    const snapshotDateToDownload =
      snapshotOption === "single" ? selectedDate : null;
    resetWizardState();
    onAgree(snapshotDateToDownload);
  };

  const snapshotInfoBannerText =
    snapshotOption === "single" && selectedDate
      ? `${format(selectedDate, "MMMM yyyy")} snapshot — complete and unfiltered.`
      : undefined;

  const currentStepIndex = step === "chooseSnapshot" ? 0 : 1;

  return (
    <WizardModal
      isOpen={isOpen}
      onRequestClose={handleCancel}
      contentLabel={WIZARD_STEP_CONTENT_LABELS[step]}
    >
      <WizardStepper
        steps={WIZARD_STEPS}
        currentStep={currentStepIndex}
        accentColor={publicPathwaysPalette.focusColor}
      />
      {step === "chooseSnapshot" ? (
        <ChooseSnapshotStep
          snapshotOption={snapshotOption}
          onSnapshotOptionChange={setSnapshotOption}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          onCancel={handleCancel}
          onContinue={() => setStep("termsOfUse")}
        />
      ) : (
        <TermsOfUseStep
          snapshotInfoBannerText={snapshotInfoBannerText}
          onBack={handleBack}
          onAgree={handleAgree}
        />
      )}
    </WizardModal>
  );
}
