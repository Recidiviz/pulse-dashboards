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
import { DefaultParoleGeneralInfo } from "../components/ParoleGeneralInfo";
import { SectionAnchor } from "../components/SectionAnchor";
import {
  DEFAULT_CONDUCT_HISTORY_YEARS,
  PAROLE_SECTION_IDS,
} from "../components/shared";
import { UsCoCommunitySupervisionPlanSection } from "../components/US_CO/UsCoCommunitySupervisionPlanSection";
import { UsCoConductHistorySection } from "../components/US_CO/UsCoConductHistorySection";
import { UsCoOffenseHistorySection } from "../components/US_CO/UsCoOffenseHistorySection";
import { UsCoOlderDisciplinariesSection } from "../components/US_CO/UsCoOlderDisciplinariesSection";
import { UsCoProgramParticipationSection } from "../components/US_CO/UsCoProgramParticipationSection";
import { UsCoRiskAndNeedsAssessmentSection } from "../components/US_CO/UsCoRiskAndNeedsAssessmentSection";
import { UsCoRiskAssessmentSection } from "../components/US_CO/UsCoRiskAssessmentSection";
import { ParoleCaseProfileLayout } from "../ParoleCaseProfile/ParoleCaseProfileLayout";

/**
 * Quick-nav entries, in the order the sections render below. Every id here
 * must also appear on a SectionAnchor, or the entry scrolls nowhere.
 *
 * TODO(OBT-43104): Add "alerts" once the CO-only Alerts section is built.
 */
const SECTION_NAV = [
  {
    id: PAROLE_SECTION_IDS.offenseHistory,
    label: "Offense & Criminal History",
  },
  { id: PAROLE_SECTION_IDS.riskAssessment, label: "Risk Score Trajectory" },
  {
    id: PAROLE_SECTION_IDS.riskAndNeedsAssessment,
    label: "Latest Risk and Needs Assessment",
  },
  {
    id: PAROLE_SECTION_IDS.programParticipation,
    label: "Program Participation",
  },
  {
    id: PAROLE_SECTION_IDS.conductHistory,
    label: "Institutional Conduct History",
  },
  {
    id: PAROLE_SECTION_IDS.communitySupervisionPlan,
    label: "Community Supervision Plan",
  },
];

/**
 * Colorado's Parole case profile. Read-only: the Parole Board reviews it and
 * never edits it.
 *
 * @param caseDetail - The case to show.
 * @param config - Colorado's paroleConfig, for its conduct classification
 *   colors and risk assessment tool set.
 */
export function UsCoParoleCaseProfile({
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
          <DefaultParoleGeneralInfo caseDetail={caseDetail} config={config} />
        </CaseProfileSidebar>
      }
    >
      <SectionAnchor id={PAROLE_SECTION_IDS.offenseHistory}>
        <UsCoOffenseHistorySection caseDetail={caseDetail} />
      </SectionAnchor>

      <SectionAnchor id={PAROLE_SECTION_IDS.riskAssessment}>
        <UsCoRiskAssessmentSection
          riskAssessments={caseDetail.riskAssessments}
          riskAssessmentConfig={config.riskAssessmentConfig}
        />
      </SectionAnchor>

      <SectionAnchor id={PAROLE_SECTION_IDS.riskAndNeedsAssessment}>
        <UsCoRiskAndNeedsAssessmentSection
          riskAndNeedsFactors={caseDetail.riskAndNeedsFactors}
        />
      </SectionAnchor>

      <SectionAnchor id={PAROLE_SECTION_IDS.programParticipation}>
        <UsCoProgramParticipationSection
          docPrograms={caseDetail.docPrograms}
          edovoPrograms={caseDetail.edovoPrograms}
        />
      </SectionAnchor>

      <SectionAnchor id={PAROLE_SECTION_IDS.conductHistory}>
        <UsCoConductHistorySection
          conductHistory={caseDetail.conductHistory}
          conductClassificationColors={
            config.conductHistoryConfig.classificationColors
          }
          visibleYears={
            config.conductHistoryConfig.visibleYears ??
            DEFAULT_CONDUCT_HISTORY_YEARS
          }
          title="Institutional Conduct History"
        >
          <UsCoOlderDisciplinariesSection
            caseDetail={caseDetail}
            config={config}
          />
        </UsCoConductHistorySection>
      </SectionAnchor>

      <SectionAnchor id={PAROLE_SECTION_IDS.communitySupervisionPlan}>
        <UsCoCommunitySupervisionPlanSection
          communitySupervisionPlan={caseDetail.communitySupervisionPlan}
        />
      </SectionAnchor>
    </ParoleCaseProfileLayout>
  );
}
