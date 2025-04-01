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

import { CaseInsight } from "../../../../../api";
import { RecommendationOptionType } from "../../../Recommendations/constants";
import { RecommendationOptionTemplateBase } from "../../../Recommendations/types";
import { SelectedRecommendation } from "../../../types";
import { RecidivismChartBySentenceLength } from "./SentenceLength/RecidivismChartBySentenceLength";
import { RecidivismChartBySentenceType } from "./SentenceType/RecidivismChartBySentenceType";

interface RecidivismChartProps {
  insight?: CaseInsight;
  orgName: string;
  selectedRecommendation: SelectedRecommendation;
  recommendationType: RecommendationOptionType;
  baseOptionsTemplate: RecommendationOptionTemplateBase[];
}

export function RecidivismChart({
  recommendationType,
  insight,
  orgName,
  selectedRecommendation,
  baseOptionsTemplate,
}: RecidivismChartProps) {
  return recommendationType === RecommendationOptionType.SentenceType ? (
    <RecidivismChartBySentenceType
      insight={insight}
      orgName={orgName}
      selectedRecommendation={selectedRecommendation}
    />
  ) : (
    <RecidivismChartBySentenceLength
      insight={insight}
      orgName={orgName}
      baseOptionsTemplate={baseOptionsTemplate}
    />
  );
}
