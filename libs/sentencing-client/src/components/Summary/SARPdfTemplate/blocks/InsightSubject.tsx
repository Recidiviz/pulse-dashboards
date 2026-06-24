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

import { Text } from "@react-pdf/renderer";
import React from "react";

import { formatOffenseLabel } from "../../../../utils/utils";
import { getDescriptionGender } from "../../../CaseDetails/components/charts/common/utils";
import { BUCKET_TO_RISK_LEVEL } from "../../../CaseDetails/components/charts/DispositionChart/sarUtils";
import type { InsightDescriptionContext } from "../../insightsUtils";
import { font } from "../tokens";

/**
 * The bold inline "subject" shared by the two Historical Outcome sentences,
 * e.g. "men with high risk scores* with DRUG TRAFFICKING convictions". A pure
 * react-pdf port of the DOM report's `InsightSubjectSpans` (insightsUtils.tsx):
 * bold segments are nested <Text> (so it must be rendered INSIDE a parent
 * <Text>), whitespace between segments is explicit (react-pdf does not collapse
 * whitespace between inline nodes the way the browser does between <span>s), and
 * the risk clause is omitted when no assessment bucket is available.
 */
export const InsightSubject: React.FC<{
  context: InsightDescriptionContext;
}> = ({
  context: { gender, assessmentScoreBucketStart, offense, offenseCategory },
}) => {
  const genderString = getDescriptionGender(gender).trim();
  const offenseDescriptor =
    offenseCategory ?? formatOffenseLabel(offense).replace(/\s*offenses$/i, "");

  if (assessmentScoreBucketStart == null) {
    return (
      <>
        <Text style={{ fontWeight: font.weight.bold }}>{genderString}</Text>{" "}
        with{" "}
        <Text style={{ fontWeight: font.weight.bold }}>
          {offenseDescriptor} convictions
        </Text>
      </>
    );
  }

  const riskLevel =
    BUCKET_TO_RISK_LEVEL[assessmentScoreBucketStart] ?? "unknown risk";
  return (
    <>
      <Text style={{ fontWeight: font.weight.bold }}>{genderString}</Text> with{" "}
      <Text style={{ fontWeight: font.weight.bold }}>{riskLevel} scores*</Text>{" "}
      with{" "}
      <Text style={{ fontWeight: font.weight.bold }}>
        {offenseDescriptor} convictions
      </Text>
    </>
  );
};
