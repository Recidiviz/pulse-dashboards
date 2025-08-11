// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import React, { useState } from "react";

import StepOne from "~@reentry/frontend/components/IntakeChatV2/PreIntake/StepOne";
import StepTwo from "~@reentry/frontend/components/IntakeChatV2/PreIntake/StepTwo";

interface PreIntakeProps {
  onStartIntake: () => void;
}
const PreIntake: React.FC<PreIntakeProps> = ({ onStartIntake }) => {
  const [step, setStep] = useState<1 | 2>(1);

  const handleGoBack = () => {
    if (step === 1) {
      window.history.back();
    } else {
      setStep(1);
    }
  };
  const handleContinue = () => setStep(2);

  return (
    <>
      {step === 1 ? (
        <StepOne onGoBack={handleGoBack} onContinue={handleContinue} />
      ) : (
        <StepTwo onGoBack={handleGoBack} onStartIntake={onStartIntake} />
      )}
    </>
  );
};

export default PreIntake;
