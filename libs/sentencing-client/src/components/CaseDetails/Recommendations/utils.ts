// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { keyBy } from "lodash";

import { CaseInsight } from "../../../../src/api";
import { convertDecimalToPercentage } from "../../../../src/utils/utils";
import { OTHER_OPTION } from "../Form/constants";
import { RecommendationType } from "../types";
import { RecommendationOptionType } from "./constants";
import {
  RecommendationOption,
  RecommendationOptionTemplateBase,
} from "./types";

export const generateRecommendationOptions = (
  optionType: RecommendationOptionType,
  optionsBase: RecommendationOptionTemplateBase[],
  insight?: CaseInsight,
  recommendedOpportunities?: string[],
): RecommendationOption[] => {
  const { dispositionData, rollupRecidivismSeries } = insight ?? {};

  const noneOption = {
    key: RecommendationType.None,
    label: "I do not wish to make a recommendation",
  };
  const keyByField =
    optionType === RecommendationOptionType.SentenceType
      ? "recommendationType"
      : "sentenceLengthBucketStart";

  const dispositionDataByKey = keyBy(dispositionData, keyByField);
  const rollUpRecidivismSeriesByKey = keyBy(rollupRecidivismSeries, keyByField);

  const options: RecommendationOption[] = optionsBase
    .map((option) => {
      const key =
        option.label === OTHER_OPTION ? OTHER_OPTION : option[keyByField];
      if (key === undefined) return;

      const datapoints = rollUpRecidivismSeriesByKey[key]?.dataPoints;
      const recidivismRate =
        datapoints?.[datapoints.length - 1]?.eventRate &&
        convertDecimalToPercentage(
          datapoints?.[datapoints.length - 1].eventRate,
        );
      const historicalSentencingRate =
        dispositionDataByKey[key]?.percentage &&
        convertDecimalToPercentage(dispositionDataByKey[key].percentage);

      return {
        key: option.label,
        label: option.label,
        opportunities: recommendedOpportunities,
        recidivismRate,
        historicalSentencingRate,
      };
    })
    .filter((option) => option !== undefined) as RecommendationOption[];

  return [...options, noneOption];
};
