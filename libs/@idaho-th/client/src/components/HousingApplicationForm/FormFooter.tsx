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

import React from "react";

import { useFormContext } from "./FormContext";
import * as Styled from "./HousingApplicationForm.styles";
import { FIRST_STEP, LAST_STEP, previousStep } from "./utils/steps";

type FormFooterProps = {
  onNext: () => void;
  isLoading?: boolean;
};

export const FormFooter: React.FC<FormFooterProps> = ({
  onNext,
  isLoading,
}) => {
  const { step, setStep, canProceed } = useFormContext();

  let nextLabel = "Next page";
  if (step === LAST_STEP)
    nextLabel = isLoading ? "Saving…" : "Choose providers";

  return (
    <Styled.Footer>
      {step > FIRST_STEP && (
        <Styled.BackButton
          type="button"
          onClick={() => setStep?.(previousStep)}
        >
          Back
        </Styled.BackButton>
      )}
      <Styled.NextButton
        type="button"
        disabled={!canProceed() || isLoading}
        onClick={onNext}
      >
        {nextLabel}
      </Styled.NextButton>
    </Styled.Footer>
  );
};
