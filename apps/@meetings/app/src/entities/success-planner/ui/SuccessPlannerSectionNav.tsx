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
import CheckIcon from "react-native-heroicons/outline/CheckIcon";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import { SUCCESS_PLANNER_SECTIONS } from "../config/successPlannerSections";
import { isSectionComplete } from "../lib/getSuccessPlannerProgress";
import { SuccessPlannerAnswers } from "../model/successPlanner";

export function SuccessPlannerSectionNav({
  answers,
}: {
  answers: SuccessPlannerAnswers;
}) {
  return (
    <View className="gap-3">
      <Typography variant="body-m-medium">Sections</Typography>
      <View className="gap-2.5">
        {SUCCESS_PLANNER_SECTIONS.map((section) => {
          const isComplete = isSectionComplete(section, answers);

          return (
            <View key={section.id} className="flex-row items-center gap-2">
              <View className="size-3.5 items-center justify-center">
                {isComplete ? (
                  <CheckIcon className="size-3.5 stroke-brand stroke-2" />
                ) : (
                  <View className="size-2 rounded-full border border-subtle" />
                )}
              </View>
              <Typography
                variant="body-s-regular"
                className={clsx(isComplete ? "text-primary" : "text-secondary")}
              >
                {section.navLabel}
              </Typography>
            </View>
          );
        })}
      </View>
    </View>
  );
}
