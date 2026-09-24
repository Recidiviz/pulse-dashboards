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

import type { ParoleConfig } from "../../../models/types";
import { SectionCardHeader } from "../../../SectionCard";
import { PaddedSectionCardBody } from "../PaddedSectionCardBody";
import { SectionCard, SectionStack } from "../shared";
import { UsIdDisciplinaryReportsSection } from "./UsIdDisciplinaryReportsSection";
import { UsIdHealthAndAssessmentsSection } from "./UsIdHealthAndAssessmentsSection";
import { UsIdProgrammingSection } from "./UsIdProgrammingSection";

/**
 * US_ID's Institutional History card. The V1 design folds what were four
 * separate cards into this one, as subsections.
 *
 * Case Notes joins the subsections below in its own ticket (OBT-50423).
 *
 * @param caseDetail - The case whose institutional record to show.
 * @param config - Idaho's paroleConfig, for its conduct classification colors
 *   and risk assessment tool set.
 */
export function UsIdInstitutionalHistorySection({
  caseDetail,
  config,
}: {
  caseDetail: ParoleCase;
  config: ParoleConfig;
}) {
  return (
    <SectionCard>
      <SectionCardHeader>Institutional History</SectionCardHeader>
      <PaddedSectionCardBody>
        <SectionStack>
          <UsIdProgrammingSection
            docPrograms={caseDetail.docPrograms}
            edovoPrograms={caseDetail.edovoPrograms}
          />
          <UsIdDisciplinaryReportsSection
            conductHistory={caseDetail.conductHistory}
            conductClassificationColors={
              config.conductHistoryConfig.classificationColors
            }
          />
          <UsIdHealthAndAssessmentsSection
            riskAssessments={caseDetail.riskAssessments}
            riskAndNeedsFactors={caseDetail.riskAndNeedsFactors}
            tools={config.riskAssessmentConfig?.tools ?? []}
          />
        </SectionStack>
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
