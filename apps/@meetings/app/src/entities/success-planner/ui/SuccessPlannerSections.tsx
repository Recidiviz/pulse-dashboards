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

import clsx from "clsx";
import { View } from "react-native";

import { getVisibleQuestions } from "~@jii/configs";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { SUCCESS_PLANNER_SECTIONS } from "../config/successPlannerSections";
import { SuccessPlannerAnswers } from "../model/successPlanner";
import { SuccessPlannerQuestionItem } from "./SuccessPlannerQuestionItem";

export function SuccessPlannerSections({
  answers,
}: {
  answers: SuccessPlannerAnswers;
}) {
  const visibleQuestions = getVisibleQuestions(answers);

  return (
    <View className="gap-8">
      {SUCCESS_PLANNER_SECTIONS.map((section, index) => (
        <View
          key={section.id}
          className={clsx("gap-4", index > 0 && "border-t border-subtle pt-8")}
        >
          <Typography variant="body-m-medium" className="text-primary">
            {section.heading}
          </Typography>
          <View className="gap-5">
            {section.questions
              .filter((question) =>
                visibleQuestions.some(
                  ({ questionId }) => questionId === question.id,
                ),
              )
              .map((question) => (
                <SuccessPlannerQuestionItem
                  key={question.id}
                  question={question}
                  answers={answers}
                />
              ))}
          </View>
        </View>
      ))}
    </View>
  );
}
