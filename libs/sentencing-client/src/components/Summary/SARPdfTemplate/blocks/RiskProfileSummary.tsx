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

// react-pdf templates render fully data-driven, order-stable lists. Array
// indices are stable React keys for the domain-label rows.
/* eslint-disable react/no-array-index-key */

import { Text, View } from "@react-pdf/renderer";
import React from "react";

import { formatLongDate, joinNonEmptyParts } from "../../../../utils/utils";
import type { RiskLevelKey } from "../../../OffenderAssessment/constants";
import { shouldShowOrasContent } from "../../../OffenderAssessment/utils";
import {
  ageAtAssessment as getAgeAtAssessment,
  riskProfileGroups,
} from "../derive";
import { Badge } from "../primitives/Badge";
import { SectionHeading } from "../primitives/SectionHeading";
import { useActiveFeatureVariants, useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { color, font, space } from "../tokens";

const RiskProfileCol: React.FC<{
  level: RiskLevelKey;
  domains: string[];
}> = ({ level, domains }) => (
  <View style={{ flex: 1 }}>
    <View style={{ flexDirection: "row", marginBottom: space[8] }}>
      <Badge level={level} />
    </View>
    {domains.length ? (
      domains.map((d, i) => (
        <Text
          key={i}
          style={{
            fontSize: font.size.md,
            lineHeight: font.lineHeight.tight,
            marginBottom: space[2],
          }}
        >
          {d}
        </Text>
      ))
    ) : (
      <Text style={{ fontSize: font.size.md, color: color.text.faint }}>—</Text>
    )}
  </View>
);

/**
 * Page-1 three-column chip table grouping the assessment's ORAS domains by risk
 * level. Renders nothing when no ORAS is on file or the defendant declined.
 */
export const RiskProfileSummary: React.FC<{ style?: PdfStyle }> = ({
  style = {},
}) => {
  const { sar } = useSAR();
  const activeFeatureVariants = useActiveFeatureVariants();
  const hasOras =
    !!sar.assessmentDate &&
    !sar.defendantDeclinedToParticipate &&
    shouldShowOrasContent(sar.ORASDomainsAvailable, activeFeatureVariants);
  if (!hasOras) return null;

  const groups = riskProfileGroups(sar);
  const administeredBy = sar.assessmentAdministeredBy ?? "Unknown";
  const ageAtAssessment = getAgeAtAssessment(sar);
  const meta = joinNonEmptyParts(
    [
      joinNonEmptyParts(
        [
          `Administered By: ${administeredBy}`,
          sar.assessmentDate
            ? formatLongDate(new Date(sar.assessmentDate))
            : null,
        ],
        ", ",
      ),
      ageAtAssessment != null ? `Age at Assessment: ${ageAtAssessment}` : null,
    ],
    " | ",
  );

  return (
    <View style={style} wrap={false}>
      <SectionHeading
        title={`RISK PROFILE SUMMARY (${sar.assessmentType})`}
        meta={meta}
      />
      <View
        style={{
          flexDirection: "row",
          paddingVertical: space[8],
          gap: space[16],
        }}
      >
        <RiskProfileCol level="HIGH" domains={groups.HIGH} />
        <RiskProfileCol level="MODERATE" domains={groups.MODERATE} />
        <RiskProfileCol level="LOW" domains={groups.LOW} />
      </View>
    </View>
  );
};
