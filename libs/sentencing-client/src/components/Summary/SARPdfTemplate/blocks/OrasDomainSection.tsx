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

import { Text, View } from "@react-pdf/renderer";
import React from "react";

import { LevelOfEducationLabels } from "../../../constants";
import type { RiskLevelKey } from "../../../OffenderAssessment/constants";
import { DomainConfig } from "../../../OffenderAssessment/utils";
import { KVRow } from "../primitives/KVRow";
import { Paragraph } from "../primitives/Paragraph";
import { SectionHeading } from "../primitives/SectionHeading";
import { useSAR } from "../SARContext";
import type { PdfStyle } from "../SARPdfTemplate.types";
import { font, space } from "../tokens";
import { yesNoOrDash } from "../utils";
import { EmploymentTable } from "./EmploymentTable";
import { SubstanceUseTable } from "./SubstanceUseTable";

/**
 * One ORAS domain — gray banner (with risk pip when scored) + narrative, plus
 * the Education/Employment fields or the Substance Use table when the domain
 * carries that structured data. Receives the domain config; reads the field
 * values off the SAR in context.
 */
export const OrasDomainSection: React.FC<{
  domain: DomainConfig;
  style?: PdfStyle;
}> = ({ domain, style = {} }) => {
  const { sar } = useSAR();
  const hasOras = !!sar.assessmentDate && !sar.defendantDeclinedToParticipate;

  const rawLevel = domain.riskLevelField ? sar[domain.riskLevelField] : null;
  const riskLevel: RiskLevelKey | null =
    hasOras &&
    (rawLevel === "LOW" || rawLevel === "MODERATE" || rawLevel === "HIGH")
      ? rawLevel
      : null;

  const narrative = sar[domain.summaryField] as string | null | undefined;

  return (
    // Keep each domain banner + body together so the badge doesn't orphan at
    // the bottom of a page. Long narratives fall back to splitting if the
    // section truly cannot fit on one page (react-pdf treats wrap=false as a
    // hint, not a guarantee, when content > page height).
    <View style={[{ marginBottom: space[10] }, style]} wrap={false}>
      {/* ORAS banners render uppercase per the Figma; the shared domain config
          keeps title-case titles (used by the on-screen ORAS UI and the
          title-case Risk Profile Summary columns). */}
      <SectionHeading title={domain.title.toUpperCase()} risk={riskLevel} />
      {narrative ? (
        <View style={{ paddingHorizontal: space[4] }}>
          <Paragraph>{narrative}</Paragraph>
        </View>
      ) : null}
      {domain.key === "educationEmployment" ? (
        <View style={{ paddingHorizontal: space[2] }}>
          <KVRow
            label="Highest Level of Education:"
            value={
              sar.levelOfEducation
                ? LevelOfEducationLabels[sar.levelOfEducation]
                : "—"
            }
          />
          <KVRow
            label="Employed at Time of Offense:"
            value={yesNoOrDash(sar.employedAtOffense)}
          />
          {sar.employmentHistories.length ? (
            <EmploymentTable
              style={{ marginBottom: space[2] }}
              rows={sar.employmentHistories}
            />
          ) : null}
          <Text
            style={{
              fontSize: font.size.xxs,
            }}
          >
            * The defendant's employment was verified through independent
            documentation (such as paystubs or tax records), direct
            communication with the employer, or other reliable corroborating
            evidence.
          </Text>
        </View>
      ) : null}
      {domain.key === "substanceUse" && sar.drugHistories.length ? (
        <View style={{ paddingHorizontal: space[2] }}>
          <SubstanceUseTable rows={sar.drugHistories} />
        </View>
      ) : null}
    </View>
  );
};
