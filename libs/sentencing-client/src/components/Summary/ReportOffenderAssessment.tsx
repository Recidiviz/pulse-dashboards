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

import React from "react";

import { SAR } from "../../api";
import {
  formatAssessmentNote,
  formatBooleanDisplay,
  formatLongDate,
} from "../../utils/utils";
import { LevelOfEducationLabels } from "../constants";
import { getAssessmentTypeShortName } from "../OffenderAssessment/assessmentTypeUtils";
import { RISK_LEVELS } from "../OffenderAssessment/constants";
import {
  buildStatic99RReportText,
  deriveStatic99RRiskCategory,
  getDomainsForAssessmentType,
  ORASDomainKey,
  shouldShowOrasContent,
  shouldShowSexualHistoryContent,
  STATIC_99R_RISK_CATEGORY_TO_RISK_LEVEL,
} from "../OffenderAssessment/utils";
import { useStore } from "../StoreProvider/StoreProvider";
import { ReportBlock } from "./ReportBlock";
import { ReportDomainSection } from "./ReportDomainSection";
import {
  ReportDrugHistoryTable,
  ReportEmploymentHistoryTable,
} from "./ReportHistoryTable";
import { RISK_COLUMN_CONFIG } from "./ReportRiskProfileSummaryCard";
import { BLOCK_GAP } from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

interface ReportOffenderAssessmentProps {
  sarData: SAR;
  administeredBy: string | null;
  ageAtAssessment: number | null;
  offenderName: string;
  hasOrasAssessment?: boolean;
  isDeclined?: boolean;
}

function getEducationExtraContent(sarData: SAR): React.ReactNode {
  return (
    <Styled.ColumnFlexContainer gap={4}>
      <Styled.RowFlexContainer gap={8}>
        <Styled.Label>Highest Level of Education:</Styled.Label>
        <Styled.Value>
          {sarData.levelOfEducation
            ? LevelOfEducationLabels[sarData.levelOfEducation]
            : "Not specified"}
        </Styled.Value>
      </Styled.RowFlexContainer>
      <Styled.RowFlexContainer gap={8}>
        <Styled.Label>Employed at Time of Offense:</Styled.Label>
        <Styled.Value>
          {formatBooleanDisplay(sarData.employedAtOffense)}
        </Styled.Value>
      </Styled.RowFlexContainer>
    </Styled.ColumnFlexContainer>
  );
}

function getFamilySupportExtraContent(sarData: SAR): React.ReactNode {
  const client = sarData.client;
  if (!client) return null;

  const { fatherName, motherName, guardianName } = client;
  if (!fatherName && !motherName && !guardianName) return null;

  return (
    <Styled.ColumnFlexContainer gap={4}>
      {fatherName && (
        <Styled.RowFlexContainer gap={8}>
          <Styled.Label>Father:</Styled.Label>
          <Styled.Value>{fatherName}</Styled.Value>
        </Styled.RowFlexContainer>
      )}
      {motherName && (
        <Styled.RowFlexContainer gap={8}>
          <Styled.Label>Mother:</Styled.Label>
          <Styled.Value>{motherName}</Styled.Value>
        </Styled.RowFlexContainer>
      )}
      {guardianName && (
        <Styled.RowFlexContainer gap={8}>
          <Styled.Label>Who Raised Offender:</Styled.Label>
          <Styled.Value>{guardianName}</Styled.Value>
        </Styled.RowFlexContainer>
      )}
    </Styled.ColumnFlexContainer>
  );
}

function getDomainExtraContent(
  key: ORASDomainKey,
  sarData: SAR,
): React.ReactNode {
  switch (key) {
    case "educationEmployment":
      return getEducationExtraContent(sarData);
    case "familySocialSupport":
      return getFamilySupportExtraContent(sarData);
    default:
      return null;
  }
}

/** Static-99R's risk category collapsed onto the shared LOW/MODERATE/HIGH
 * color scale, rendered as a plain colored badge (no pip meter — Static-99R
 * doesn't have the 3-tier squares scale ORAS domains do), alongside the raw
 * score out of its 12-point max. */
function getStatic99RRiskBadge(score: number | null): React.ReactNode {
  if (score == null) return null;
  const riskLevel =
    STATIC_99R_RISK_CATEGORY_TO_RISK_LEVEL[deriveStatic99RRiskCategory(score)];
  const config = RISK_COLUMN_CONFIG.find((c) => c.level === riskLevel);
  if (!config) return null;
  return (
    <Styled.RiskLevelIndicator>
      <span>{score}/12</span>
      <Styled.RiskLevelColumnHeader
        $bgColor={config.bgColor}
        $textColor={config.textColor}
      >
        {RISK_LEVELS[riskLevel]}
      </Styled.RiskLevelColumnHeader>
    </Styled.RiskLevelIndicator>
  );
}

function getDomainTableContent(
  key: ORASDomainKey,
  sarData: SAR,
): React.ReactNode {
  switch (key) {
    case "substanceUse":
      return <ReportDrugHistoryTable drugHistories={sarData.drugHistories} />;
    case "educationEmployment":
      return (
        <ReportEmploymentHistoryTable
          employmentHistories={sarData.employmentHistories}
        />
      );
    default:
      return null;
  }
}

export const ReportOffenderAssessment: React.FC<
  ReportOffenderAssessmentProps
> = ({
  sarData,
  administeredBy,
  ageAtAssessment,
  offenderName,
  hasOrasAssessment = true,
  isDeclined = false,
}) => {
  const { activeFeatureVariants } = useStore();
  const { assessmentType } = sarData;
  const allDomains = getDomainsForAssessmentType(assessmentType);
  const domains =
    isDeclined || !hasOrasAssessment
      ? allDomains.filter((d) => d.key === "criminalHistory")
      : allDomains;

  if (!domains.length) return null;
  const note = !isDeclined
    ? formatAssessmentNote(
        administeredBy,
        sarData.assessmentDate ? formatLongDate(sarData.assessmentDate) : null,
        ageAtAssessment,
      )
    : null;
  const sectionTitle = isDeclined
    ? "Offender Risk Assessment"
    : `Offender Risk Assessment (${getAssessmentTypeShortName(assessmentType)})`;
  const showSexualHistorySection =
    domains.some((d) => d.key === "responsivity") &&
    shouldShowSexualHistoryContent(
      sarData.involvesSexCrime,
      activeFeatureVariants,
    );

  return (
    <Styled.ColumnFlexContainer gap={15}>
      <ReportBlock>
        <Styled.SectionTitleContainer>
          <Styled.SectionTitle>{sectionTitle}</Styled.SectionTitle>
          {note && <Styled.SectionTitleNote>{note}</Styled.SectionTitleNote>}
        </Styled.SectionTitleContainer>
        {isDeclined && sarData.defendantStatement && (
          <Styled.FreeTextContent>
            {sarData.defendantStatement}
          </Styled.FreeTextContent>
        )}
        {!shouldShowOrasContent(
          sarData.ORASDomainsAvailable,
          activeFeatureVariants,
        ) &&
          sarData.noORASDomainReason && (
            <Styled.FreeTextContent>
              {sarData.noORASDomainReason}
            </Styled.FreeTextContent>
          )}
      </ReportBlock>

      {/* Domain cards — each individually non-splittable, but the collection
          is splittable so page cuts can fall between cards. Each card beyond
          the first embeds a "Continued..." heading at its own top. Because the
          heading is inside the sar-no-split block, a cut always snaps to this
          block's top — guaranteeing the heading lands on the new page, not the
          previous one. The PDF generator hides it when no cut precedes the
          block (see SARPdfExport reverse-flow logic). */}
      <Styled.ColumnFlexContainer gap={BLOCK_GAP}>
        {domains.map((domain, index) => (
          <ReportDomainSection
            key={domain.key}
            domain={domain}
            sarData={sarData}
            hasOrasAssessment={!isDeclined && hasOrasAssessment}
            extraContent={getDomainExtraContent(domain.key, sarData)}
            tableContent={getDomainTableContent(domain.key, sarData)}
            continuationTitle={
              index > 0 ? `${sectionTitle} Continued...` : undefined
            }
          />
        ))}
        {showSexualHistorySection && (
          <>
            <ReportBlock>
              <Styled.ReportCardHeader>
                <span>Sexual History</span>
              </Styled.ReportCardHeader>
              {sarData.sexualHistorySummary && (
                <Styled.ReportDomainSectionBody>
                  <Styled.FreeTextContent>
                    {sarData.sexualHistorySummary}
                  </Styled.FreeTextContent>
                </Styled.ReportDomainSectionBody>
              )}
            </ReportBlock>
            {sarData.static99RCompleted && (
              <ReportBlock>
                <Styled.ReportCardHeader>
                  <span>Static-99R Total Score</span>
                  {getStatic99RRiskBadge(sarData.static99RScore ?? null)}
                </Styled.ReportCardHeader>
                <Styled.ReportDomainSectionBody>
                  <Styled.FreeTextContent>
                    {buildStatic99RReportText(
                      offenderName,
                      sarData.client?.gender,
                      sarData.static99RScore ?? null,
                    )}
                  </Styled.FreeTextContent>
                </Styled.ReportDomainSectionBody>
              </ReportBlock>
            )}
          </>
        )}
      </Styled.ColumnFlexContainer>
    </Styled.ColumnFlexContainer>
  );
};
