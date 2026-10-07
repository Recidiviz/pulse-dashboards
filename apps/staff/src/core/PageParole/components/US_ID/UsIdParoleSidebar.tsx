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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import {
  isParoleUnknownDate,
  PAROLE_UNKNOWN_TEXT,
  ParoleCase,
} from "~datatypes";
import { palette } from "~design-system";

import { formatDocId } from "../../../../ParoleStore/utils";
import { AssessmentsSidebarSection } from "../AssessmentsSidebarSection";
import { FullWidthHr, ParoleGeneralInfoProps } from "../ParoleGeneralInfo";
import {
  calculateAge,
  FactRow,
  formatDate,
  formatMonth,
  Hr,
  StackedFactRow,
  StackedFacts,
  SubsectionTitle,
} from "../shared";
import {
  UsIdFactLabel,
  UsIdFactStack,
  UsIdFactValue,
} from "./UsIdCaseProfileStyles";
import { UsIdInstantOffensesSection } from "./UsIdInstantOffensesSection";

const IdentityBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
`;

const PersonName = styled.div`
  ${typography.Serif24}
  color: ${palette.pine2};
`;

const IdentityDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
`;

const IdentityDetail = styled.div`
  ${typography.Sans14}
  line-height: ${rem(24)};
  color: ${palette.slate80};
`;

const ReportStatusRow = styled(StackedFactRow)`
  align-items: center;
`;

const PersonalDetailsFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

/**
 * Idaho's Personal Details block
 *
 * @param caseDetail - The case whose resident to describe.
 */
function UsIdPersonalDetails({ caseDetail }: { caseDetail: ParoleCase }) {
  const isDobUnknown = isParoleUnknownDate(caseDetail.dob);
  const facts = [
    { label: "Gender", value: caseDetail.gender },
    {
      label: "Age",
      value: isDobUnknown ? PAROLE_UNKNOWN_TEXT : calculateAge(caseDetail.dob),
    },
    {
      label: "DOB",
      value: isDobUnknown ? PAROLE_UNKNOWN_TEXT : formatDate(caseDetail.dob),
    },
  ];

  return (
    <div>
      <SubsectionTitle>Personal Details</SubsectionTitle>
      <PersonalDetailsFields>
        <FactRow>
          {facts.map((fact) => (
            <UsIdFactStack key={fact.label}>
              <UsIdFactLabel>{fact.label}</UsIdFactLabel>
              <UsIdFactValue>{fact.value}</UsIdFactValue>
            </UsIdFactStack>
          ))}
        </FactRow>
        <UsIdInstantOffensesSection
          offenses={caseDetail.offenseHistory.offenses}
        />
      </PersonalDetailsFields>
    </div>
  );
}

export function UsIdParoleSidebar({
  caseDetail,
  config,
}: ParoleGeneralInfoProps) {
  const tools = config.riskAssessmentConfig?.tools ?? [];

  return (
    <>
      <IdentityBlock>
        <PersonName>{caseDetail.name}</PersonName>
        <IdentityDetails>
          <IdentityDetail>{formatDocId(caseDetail.displayId)}</IdentityDetail>
          <IdentityDetail>{caseDetail.custodyLevel}</IdentityDetail>
          <IdentityDetail>{caseDetail.currentFacility}</IdentityDetail>
        </IdentityDetails>
      </IdentityBlock>

      <FullWidthHr />

      <UsIdPersonalDetails caseDetail={caseDetail} />

      {tools.length > 0 && (
        <>
          <Hr />
          <AssessmentsSidebarSection
            riskAssessments={caseDetail.riskAssessments}
            tools={tools}
          />
        </>
      )}

      <FullWidthHr />

      <div>
        <SubsectionTitle>Report Status</SubsectionTitle>
        <StackedFacts>
          <ReportStatusRow>
            <UsIdFactLabel>Report Type</UsIdFactLabel>
            <UsIdFactValue>{caseDetail.hearingType}</UsIdFactValue>
          </ReportStatusRow>
          <ReportStatusRow>
            <UsIdFactLabel>Parole Board Hearing</UsIdFactLabel>
            <UsIdFactValue>
              {caseDetail.hearingDate
                ? formatMonth(caseDetail.hearingDate)
                : "Not scheduled"}
            </UsIdFactValue>
          </ReportStatusRow>
        </StackedFacts>
      </div>
    </>
  );
}
