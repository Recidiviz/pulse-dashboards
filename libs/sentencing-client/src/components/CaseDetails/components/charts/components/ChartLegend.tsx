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

import { useMemo } from "react";

import { CaseInsight } from "../../../../../api";
import { convertDecimalToPercentage } from "../../../../../utils/utils";
import { BW_COLOR_SCHEME, SENTENCE_TYPE_TO_COLOR } from "../common/constants";
import {
  getSentenceLengthBucketLabel,
  sortDataForSentenceLengthCharts,
} from "../common/utils";
import * as CommonStyled from "../components/Styles";

interface ChartLegendProps {
  datapoints?: Array<
    | CaseInsight["dispositionData"][number]
    | CaseInsight["rollupRecidivismSeries"][number]
  >;
  isReport?: boolean;
}
export function ChartLegend({ datapoints, isReport }: ChartLegendProps) {
  const chartLegend = useMemo(
    () =>
      sortDataForSentenceLengthCharts(datapoints ?? []).map((dp, i) => {
        const label = getSentenceLengthBucketLabel(
          dp.recommendationType,
          dp.sentenceLengthBucketStart,
          dp.sentenceLengthBucketEnd,
        );
        const color = isReport
          ? BW_COLOR_SCHEME[i]
          : SENTENCE_TYPE_TO_COLOR[label];

        return (
          <CommonStyled.ChartLegendItem key={label}>
            <CommonStyled.ChartLegendDot $backgroundColor={color} />
            <div style={{ whiteSpace: "nowrap" }}>
              {label}{" "}
              {"percentage" in dp && (
                <>
                  {isReport ? (
                    <span style={{ fontWeight: 700 }}>
                      - {convertDecimalToPercentage(dp.percentage)}%
                    </span>
                  ) : (
                    <>({convertDecimalToPercentage(dp.percentage)}%)</>
                  )}
                </>
              )}
            </div>
          </CommonStyled.ChartLegendItem>
        );
      }),
    [datapoints, isReport],
  );

  return (
    <CommonStyled.ChartLegendContainer isReport={isReport}>
      {chartLegend}
    </CommonStyled.ChartLegendContainer>
  );
}
