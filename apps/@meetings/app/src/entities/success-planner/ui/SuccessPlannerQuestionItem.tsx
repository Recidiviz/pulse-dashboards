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

import { View } from "react-native";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import {
  getAnswerState,
  SuccessPlannerAnswers,
  SuccessPlannerQuestion,
  SupportSystemContact,
} from "../model/successPlanner";
import { SuccessPlannerAnswerText } from "./SuccessPlannerAnswerText";
import { SuccessPlannerSupportSystemTable } from "./SuccessPlannerSupportSystemTable";

type Props = {
  question: SuccessPlannerQuestion;
  answers: SuccessPlannerAnswers;
};

export function SuccessPlannerQuestionItem({ question, answers }: Props) {
  const state = getAnswerState(answers, question.id);
  const value = answers[question.id];

  return (
    <View className="gap-1.5">
      <Typography variant="caption-s-regular" className="text-secondary">
        {question.label}
      </Typography>
      {state === "unreached" && (
        <Typography variant="body-s-regular" className="text-tertiary">
          Not answered yet
        </Typography>
      )}
      {state === "skipped" && (
        <Typography
          variant="caption-s-medium"
          className="w-fit rounded bg-attention-light px-2 py-0.5 !text-attention"
        >
          No response provided
        </Typography>
      )}
      {state === "answered" &&
        (question.answerType === "table" ? (
          <SuccessPlannerSupportSystemTable
            contacts={value as SupportSystemContact[]}
          />
        ) : (
          <SuccessPlannerAnswerText value={value as string} />
        ))}
    </View>
  );
}
