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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import {
  isParoleUnknownDate,
  PAROLE_UNKNOWN_TEXT,
  ParoleCase,
} from "~datatypes";

import { formatDocId } from "../../../../ParoleStore/utils";
import { AssessmentsSidebarSection } from "../AssessmentsSidebarSection";
import {
  ParoleFactLabel,
  ParoleFactStack,
  ParoleIdentityBlock,
  ParoleIdentityDetail,
  ParoleIdentityDetails,
  ParolePersonName,
  ParoleSidebarTitle,
  ParoleSmallFactValue,
} from "../ParoleCaseProfileStyles";
import { FullWidthHr, ParoleGeneralInfoProps } from "../ParoleGeneralInfo";
import {
  calculateAge,
  FactRow,
  formatDate,
  formatMonth,
  Hr,
  StackedFactRow,
  StackedFacts,
} from "../shared";
import { UsIdInstantOffensesSection } from "./UsIdInstantOffensesSection";

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
      <ParoleSidebarTitle>Personal Details</ParoleSidebarTitle>
      <PersonalDetailsFields>
        <FactRow>
          {facts.map((fact) => (
            <ParoleFactStack key={fact.label}>
              <ParoleFactLabel>{fact.label}</ParoleFactLabel>
              <ParoleSmallFactValue>{fact.value}</ParoleSmallFactValue>
            </ParoleFactStack>
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
      <ParoleIdentityBlock>
        <ParolePersonName>{caseDetail.name}</ParolePersonName>
        <ParoleIdentityDetails>
          <ParoleIdentityDetail>
            {formatDocId(caseDetail.displayId)}
          </ParoleIdentityDetail>
          <ParoleIdentityDetail>{caseDetail.custodyLevel}</ParoleIdentityDetail>
          <ParoleIdentityDetail>
            {caseDetail.currentFacility}
          </ParoleIdentityDetail>
        </ParoleIdentityDetails>
      </ParoleIdentityBlock>

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
        <ParoleSidebarTitle>Report Status</ParoleSidebarTitle>
        <StackedFacts>
          <ReportStatusRow>
            <ParoleFactLabel>Report Type</ParoleFactLabel>
            <ParoleSmallFactValue>
              {caseDetail.hearingType}
            </ParoleSmallFactValue>
          </ReportStatusRow>
          <ReportStatusRow>
            <ParoleFactLabel>Parole Board Hearing</ParoleFactLabel>
            <ParoleSmallFactValue>
              {caseDetail.hearingDate
                ? formatMonth(caseDetail.hearingDate)
                : "Not scheduled"}
            </ParoleSmallFactValue>
          </ReportStatusRow>
        </StackedFacts>
      </div>
    </>
  );
}
