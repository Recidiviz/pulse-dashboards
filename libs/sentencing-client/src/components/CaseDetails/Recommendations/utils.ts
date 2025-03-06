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

import { CaseInsight, Offenses } from "../../../../src/api";
import { convertDecimalToPercentage } from "../../../../src/utils/utils";
import { OTHER_OPTION } from "../Form/constants";
import { RecommendationType } from "../types";
import {
  DispositionData,
  RecommendationOption,
  RecommendationOptionTemplateBase,
  RollupRecidivismSeries,
} from "./types";

const getDataKey = (item: DispositionData | RollupRecidivismSeries) => {
  if (
    item.sentenceLengthBucketStart === 0 &&
    item.sentenceLengthBucketEnd === -1 &&
    item.recommendationType
  ) {
    return item.recommendationType;
  }
  return item.sentenceLengthBucketStart ?? item.recommendationType;
};

export const generateRecommendationOptions = (
  optionsBase: RecommendationOptionTemplateBase[],
  insight?: CaseInsight,
  recommendedOpportunities?: string[],
): RecommendationOption[] => {
  const { dispositionData, rollupRecidivismSeries } = insight ?? {};

  const noneOption = {
    key: RecommendationType.None,
    label: "I do not wish to make a recommendation",
  };

  const dispositionDataByKey = keyBy(dispositionData, (item) =>
    getDataKey(item),
  );

  const rollUpRecidivismSeriesByKey = keyBy(rollupRecidivismSeries, (item) =>
    getDataKey(item),
  );

  const options: RecommendationOption[] = optionsBase
    .map((option) => {
      const key =
        option.label === OTHER_OPTION
          ? OTHER_OPTION
          : option.recommendationType ?? option.sentenceLengthBucketStart;
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

export const getMandatoryMinimumsData = (
  optionsBase: RecommendationOptionTemplateBase[],
  mandatoryMinimums?: Offenses[number]["mandatoryMinimums"],
) => {
  if (!mandatoryMinimums || !mandatoryMinimums?.length) return {};

  const mandatoryMinimumsSentenceTypes = mandatoryMinimums.map(
    (mm) => mm.sentenceType,
  );
  const mandatoryMinimumAutoSelectionRecommendation =
    mandatoryMinimumsSentenceTypes?.[0];
  const disabledMandatoryMinimumOptions = optionsBase
    .map((option) => option.recommendationType)
    .filter((option) => option !== undefined)
    .filter(
      (recommendationType) =>
        recommendationType &&
        !mandatoryMinimumsSentenceTypes?.includes(recommendationType) &&
        recommendationType !== RecommendationType.None &&
        recommendationType !== OTHER_OPTION,
    );

  return {
    mandatoryMinimums,
    mandatoryMinimumsSentenceTypes,
    mandatoryMinimumAutoSelectionRecommendation,
    disabledMandatoryMinimumOptions,
  };
};
