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

import { trpc } from "~@reentry/frontend/components/IntakeChatV2/IntakeChatV2";
import Loading from "~@reentry/frontend/components/IntakeChatV2/Loading/Loading";
import StepOne from "~@reentry/frontend/components/IntakeChatV2/PreIntake/StepOne";
import StepTwo from "~@reentry/frontend/components/IntakeChatV2/PreIntake/StepTwo";
import { showErrorToast } from "~@reentry/frontend/utils/toast";

interface PreIntakeProps {
  clientPseudoId: string;
}

const PreIntake: React.FC<PreIntakeProps> = ({ clientPseudoId }) => {
  const [step, setStep] = useState<1 | 2>(1);

  const utils = trpc.useUtils();
  const createIntakeMutation = trpc.intake.createIntake.useMutation({
    onMutate: async (input) => {
      await utils.intake.getIntake.cancel(input);
      const previous = utils.intake.getIntake.getData(input);
      return { previous, input };
    },
    onError: (_, __, ctx) => {
      showErrorToast(
        "We ran into an issue starting the chat. Please refresh and try again.",
      );
      if (ctx?.previous) {
        utils.intake.getIntake.setData(ctx.input, ctx.previous);
      }
    },
    onSuccess: (intake, input) => {
      utils.intake.getIntake.setData(input, intake);
    },
    onSettled: async (_, __, input) => {
      await utils.intake.getIntake.invalidate(input);
    },
  });

  const handleGoBack = () => {
    if (step === 1) {
      window.history.back();
    } else {
      setStep(1);
    }
  };
  const handleContinue = () => setStep(2);

  const onStartIntake = () => {
    createIntakeMutation.mutate({ clientPseudoId });
  };

  if (createIntakeMutation.isPending) {
    return <Loading />;
  }

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
