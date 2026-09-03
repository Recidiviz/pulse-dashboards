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
import { AttachmentsSection } from "./AttachmentsSection";
import { CommunitySupervisionPlanSection } from "./CommunitySupervisionPlanSection";
import { ConductHistorySection } from "./ConductHistorySection";
import {
  DOWNLOAD_REPORT_BUTTON_LABEL,
  DownloadReportCard,
} from "./DownloadReportCard";
import { OffenseHistorySection } from "./OffenseHistorySection";
import { ProgramParticipationSection } from "./ProgramParticipationSection";
import { RiskAndNeedsAssessmentSection } from "./RiskAndNeedsAssessmentSection";
import { RiskAssessmentSection } from "./RiskAssessmentSection";
import { DEFAULT_CONDUCT_HISTORY_YEARS } from "./shared";

/*
  Maps a tenant's paroleConfig.sections entries to a render function for that
  section, so ParoleCaseProfile composes its MainColumn from config instead
  of a hardcoded per-tenant JSX list. Each entry is a thin wrapper that picks
  the fields a section component actually needs off of ParoleCase -- rather
  than widening every section component to a single generic `caseDetail`
  prop -- so each component's own signature keeps documenting exactly what
  it reads. Every entry takes the tenant's full ParoleConfig as a second
  argument (even though only riskAssessment currently reads it) so callers
  can invoke every section the same way.
*/
export const ParoleSectionComponents = {
  offenseHistory: (caseDetail: ParoleCase, config: ParoleConfig) => (
    <OffenseHistorySection
      offenseHistory={caseDetail.offenseHistory}
      title={config.offenseSectionTitle ?? "Current Offenses"}
    />
  ),
  riskAssessment: (caseDetail: ParoleCase, config: ParoleConfig) => (
    <RiskAssessmentSection
      riskAssessments={caseDetail.riskAssessments}
      riskAssessmentConfig={config.riskAssessmentConfig}
    />
  ),
  riskAndNeedsAssessment: (caseDetail: ParoleCase) => (
    <RiskAndNeedsAssessmentSection
      riskAndNeedsFactors={caseDetail.riskAndNeedsFactors}
    />
  ),
  programParticipation: (caseDetail: ParoleCase) => (
    <ProgramParticipationSection
      docPrograms={caseDetail.docPrograms}
      edovoPrograms={caseDetail.edovoPrograms}
    />
  ),
  conductHistory: (caseDetail: ParoleCase, config: ParoleConfig) => {
    const ConductHistoryChildren = config.conductHistoryChildren;
    return (
      <ConductHistorySection
        conductHistory={caseDetail.conductHistory}
        conductClassificationColors={config.conductClassificationColors}
        visibleYears={
          config.conductHistoryVisibleYears ?? DEFAULT_CONDUCT_HISTORY_YEARS
        }
        title={config.conductHistoryTitle ?? "Institutional Conduct History"}
      >
        {ConductHistoryChildren && (
          <ConductHistoryChildren caseDetail={caseDetail} config={config} />
        )}
      </ConductHistorySection>
    );
  },
  attachments: (caseDetail: ParoleCase) => (
    <AttachmentsSection
      parolePlan={caseDetail.parolePlan}
      attachments={caseDetail.attachments}
    />
  ),
  communitySupervisionPlan: (caseDetail: ParoleCase) => (
    <CommunitySupervisionPlanSection
      communitySupervisionPlan={caseDetail.communitySupervisionPlan}
    />
  ),
  downloadReport: (caseDetail: ParoleCase) => (
    <DownloadReportCard docId={caseDetail.docId} />
  ),
};

export type ParoleSectionName = keyof typeof ParoleSectionComponents;

export const PAROLE_SECTION_LABELS: Record<ParoleSectionName, string> = {
  offenseHistory: "Offense & Criminal History",
  riskAssessment: "Risk Score Trajectory",
  riskAndNeedsAssessment: "Latest Risk and Needs Assessment",
  programParticipation: "Program Participation",
  conductHistory: "Institutional Conduct History",
  attachments: "Attachments",
  communitySupervisionPlan: "Community Supervision Plan",
  downloadReport: DOWNLOAD_REPORT_BUTTON_LABEL,
};

export const NON_NAV_PAROLE_SECTIONS: ReadonlySet<ParoleSectionName> = new Set([
  "downloadReport",
]);
