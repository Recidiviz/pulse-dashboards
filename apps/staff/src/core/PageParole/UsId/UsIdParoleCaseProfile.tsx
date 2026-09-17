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

import { ParoleCase } from "~datatypes";

import type { ParoleConfig } from "../../models/types";
import { CaseProfileSidebar } from "../components/CaseProfileSidebar";
import { ConductHistorySection } from "../components/ConductHistorySection";
import { DownloadReportCard } from "../components/DownloadReportCard";
import { ProgramParticipationSection } from "../components/ProgramParticipationSection";
import { ReportHeader } from "../components/ReportHeader";
import { RiskAssessmentSection } from "../components/RiskAssessmentSection";
import { SectionAnchor } from "../components/SectionAnchor";
import {
  DEFAULT_CONDUCT_HISTORY_YEARS,
  PAROLE_SECTION_IDS,
} from "../components/shared";
import { UsIdInstitutionalBehaviorSections } from "../components/US_ID/UsIdInstitutionalBehaviorSections";
import { UsIdOffenseHistorySection } from "../components/US_ID/UsIdOffenseHistorySection";
import { UsIdParoleSidebar } from "../components/US_ID/UsIdParoleSidebar";
import { ParoleCaseProfileLayout } from "../ParoleCaseProfile/ParoleCaseProfileLayout";

const CONDUCT_HISTORY_TITLE = "Institutional & Community Behavior";

/**
 * Quick-nav entries, in the order the sections render below. Every id here
 * must also appear on a SectionAnchor, or the entry scrolls nowhere.
 */
const SECTION_NAV = [
  { id: PAROLE_SECTION_IDS.offenseHistory, label: "Criminal & Parole History" },
  { id: PAROLE_SECTION_IDS.riskAssessment, label: "Risk Score Trajectory" },
  {
    id: PAROLE_SECTION_IDS.programParticipation,
    label: "Program Participation",
  },
  { id: PAROLE_SECTION_IDS.conductHistory, label: CONDUCT_HISTORY_TITLE },
];

/**
 * Idaho's Parole case profile. Unlike Colorado's, it offers a PDF download,
 * so it renders the download card and the report header.
 *
 * @param caseDetail - The case to show.
 * @param config - Idaho's paroleConfig, for its conduct classification colors
 *   and risk assessment tool set.
 */
export function UsIdParoleCaseProfile({
  caseDetail,
  config,
}: {
  caseDetail: ParoleCase;
  config: ParoleConfig;
}) {
  return (
    <ParoleCaseProfileLayout
      sidebar={
        <CaseProfileSidebar caseDetail={caseDetail} sections={SECTION_NAV}>
          <UsIdParoleSidebar caseDetail={caseDetail} config={config} />
        </CaseProfileSidebar>
      }
      beforeReport={<DownloadReportCard docId={caseDetail.docId} />}
    >
      <ReportHeader name={caseDetail.name} displayId={caseDetail.displayId} />

      <SectionAnchor id={PAROLE_SECTION_IDS.offenseHistory}>
        <UsIdOffenseHistorySection caseDetail={caseDetail} />
      </SectionAnchor>

      <SectionAnchor id={PAROLE_SECTION_IDS.riskAssessment}>
        <RiskAssessmentSection
          riskAssessments={caseDetail.riskAssessments}
          riskAssessmentConfig={config.riskAssessmentConfig}
        />
      </SectionAnchor>

      <SectionAnchor id={PAROLE_SECTION_IDS.programParticipation}>
        <ProgramParticipationSection
          docPrograms={caseDetail.docPrograms}
          edovoPrograms={caseDetail.edovoPrograms}
        />
      </SectionAnchor>

      <SectionAnchor id={PAROLE_SECTION_IDS.conductHistory}>
        <ConductHistorySection
          conductHistory={caseDetail.conductHistory}
          conductClassificationColors={
            config.conductHistoryConfig.classificationColors
          }
          visibleYears={
            config.conductHistoryConfig.visibleYears ??
            DEFAULT_CONDUCT_HISTORY_YEARS
          }
          title={CONDUCT_HISTORY_TITLE}
        >
          <UsIdInstitutionalBehaviorSections
            caseDetail={caseDetail}
            config={config}
          />
        </ConductHistorySection>
      </SectionAnchor>
    </ParoleCaseProfileLayout>
  );
}
