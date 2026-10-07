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

import { UseMutationResult } from "@tanstack/react-query";
import { TRPCClientErrorLike } from "@trpc/client";
import assertNever from "assert-never";

import { checkInQuestionConfig } from "~@jii/configs";
import { useUsNeTranslations } from "~@jii/translation";
import { JiiResidentAppRouter } from "~@jii/trpc-types";

import { CheckInFormData, CheckInMutationInput } from "./types";
import { QuestionInfo } from "./types";
import { UsNeCheckInCheckboxQuestion } from "./UsNeCheckInCheckboxQuestion";
import { UsNeCheckInFooter } from "./UsNeCheckInFooter/UsNeCheckInFooter";
import { UsNeCheckInFreeTextQuestion } from "./UsNeCheckInFreeTextQuestion";
import { UsNeCheckInRadioQuestion } from "./UsNeCheckInRadioQuestion";

export const UsNeCheckInQuestion = ({
  sectionId,
  questionId,
  data,
  updateMutation,
}: QuestionInfo & {
  data: CheckInFormData;
  updateMutation: UseMutationResult<
    CheckInFormData,
    TRPCClientErrorLike<JiiResidentAppRouter>,
    CheckInMutationInput
  >;
}) => {
  const { t } = useUsNeTranslations();
  const config = checkInQuestionConfig[questionId];

  const renderQuestion = () => {
    switch (config.format) {
      case "RADIO":
        return (
          <UsNeCheckInRadioQuestion
            key={questionId}
            id={questionId}
            answers={config.answers}
          />
        );
      case "CHECKBOX":
        return (
          <UsNeCheckInCheckboxQuestion
            key={questionId}
            id={questionId}
            answers={config.answers}
          />
        );
      case "FREE_TEXT":
        return <UsNeCheckInFreeTextQuestion key={questionId} id={questionId} />;
      default:
        return assertNever(config);
    }
  };

  // TODO(OBT-47849): Add logic to control form inputs and send the user's selected
  // answer to the backend.
  return (
    <div>
      {renderQuestion()}
      <UsNeCheckInFooter
        onButtonClick={() => {
          const updatedAnswers = {
            ...data.answers,
            [questionId]: "TEST ANSWER!",
          };

          updateMutation.mutate({
            id: data.id,
            pseudonymizedId: data.pseudonymizedId,
            answers: updatedAnswers,
          });
        }}
        infoText={t(($) => $.checkIn.footer.nextInfo)}
        buttonText={t(($) => $.checkIn.footer.next)}
      />
    </div>
  );
};
