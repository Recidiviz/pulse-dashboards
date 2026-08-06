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

import { AttachmentsSection } from "./AttachmentsSection";
import { ConductHistorySection } from "./ConductHistorySection";
import { OffenseHistorySection } from "./OffenseHistorySection";
import { ProgramParticipationSection } from "./ProgramParticipationSection";
import { RiskAssessmentSection } from "./RiskAssessmentSection";

/*
  Maps a tenant's paroleConfig.sections entries to a render function for that
  section, so ParoleCaseProfile composes its MainColumn from config instead
  of a hardcoded per-tenant JSX list. Each entry is a thin wrapper that picks
  the fields a section component actually needs off of ParoleCase -- rather
  than widening every section component to a single generic `caseDetail`
  prop -- so each component's own signature keeps documenting exactly what
  it reads.
*/
export const ParoleSectionComponents = {
  offenseHistory: (caseDetail: ParoleCase) => (
    <OffenseHistorySection offenseHistory={caseDetail.offenseHistory} />
  ),
  riskAssessment: (caseDetail: ParoleCase) => (
    <RiskAssessmentSection
      riskAssessments={caseDetail.riskAssessments}
      riskOverviewHistory={caseDetail.riskOverviewHistory}
    />
  ),
  programParticipation: (caseDetail: ParoleCase) => (
    <ProgramParticipationSection
      docPrograms={caseDetail.docPrograms}
      edovoPrograms={caseDetail.edovoPrograms}
    />
  ),
  conductHistory: (caseDetail: ParoleCase) => (
    <ConductHistorySection conductHistory={caseDetail.conductHistory} />
  ),
  attachments: (caseDetail: ParoleCase) => (
    <AttachmentsSection
      parolePlan={caseDetail.parolePlan}
      attachments={caseDetail.attachments}
    />
  ),
};

export type ParoleSectionName = keyof typeof ParoleSectionComponents;

export const PAROLE_SECTION_LABELS: Record<ParoleSectionName, string> = {
  offenseHistory: "Offense & Criminal History",
  riskAssessment: "Risk Score Trajectory",
  programParticipation: "Program Participation",
  conductHistory: "Institutional Conduct History",
  attachments: "Attachments",
};
