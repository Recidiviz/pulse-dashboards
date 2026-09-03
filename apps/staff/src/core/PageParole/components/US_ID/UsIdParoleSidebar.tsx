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

import { AssessmentsSidebarSection } from "../AssessmentsSidebarSection";
import {
  FullWidthHr,
  ParoleGeneralInfoProps,
  ParoleNameHeading,
  ParolePersonalDetails,
} from "../ParoleGeneralInfo";
import {
  FactLabel,
  formatDate,
  Hr,
  StackedFactRow,
  StackedFacts,
  SubsectionTitle,
} from "../shared";
import { UsIdInstantOffensesSection } from "./UsIdInstantOffensesSection";

export function UsIdParoleSidebar({
  caseDetail,
  config,
}: ParoleGeneralInfoProps) {
  const tools = config.riskAssessmentConfig?.tools ?? [];

  return (
    <>
      <div>
        <ParoleNameHeading name={caseDetail.name} docId={caseDetail.docId} />
        <FactLabel>{caseDetail.custodyLevel}</FactLabel>
        <FactLabel>{caseDetail.currentFacility}</FactLabel>
      </div>

      <FullWidthHr />

      <ParolePersonalDetails caseDetail={caseDetail} />

      <UsIdInstantOffensesSection
        offenses={caseDetail.offenseHistory.offenses}
      />

      {tools.length > 0 && (
        <>
          <Hr />
          <AssessmentsSidebarSection
            riskAssessments={caseDetail.riskAssessments}
            tools={tools}
          />
        </>
      )}

      <Hr />

      <div>
        <SubsectionTitle>Hearing Details</SubsectionTitle>
        <StackedFacts>
          <StackedFactRow>
            <div>Hearing Type</div>
            <FactLabel>{caseDetail.hearingType}</FactLabel>
          </StackedFactRow>
          <StackedFactRow>
            <div>Parole Board Hearing</div>
            <FactLabel>
              {caseDetail.hearingDate
                ? formatDate(caseDetail.hearingDate)
                : "Not scheduled"}
            </FactLabel>
          </StackedFactRow>
          {caseDetail.reportAuthor && (
            <StackedFactRow>
              <div>Report Author</div>
              <FactLabel>{caseDetail.reportAuthor}</FactLabel>
            </StackedFactRow>
          )}
        </StackedFacts>
      </div>
    </>
  );
}
