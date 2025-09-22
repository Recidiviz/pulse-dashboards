// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { OpportunityProfileModuleName } from "../../../../../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

export class UsMoWorkReleaseConfiguration extends ApiOpportunityConfiguration {
  get markSubmittedOnFormDownload(): boolean {
    return false;
  }

  get skipFormPreview(): boolean {
    return true;
  }

  get indefiniteSnoozeSectionSubheading(): string {
    return "";
  }

  get maxSnoozeDaysByDenialReason() {
    return {
      ...super.maxSnoozeDaysByDenialReason,
      // indefiniteDenialReasons will filter out entries that don't appear in denialReasons,
      // so we can always set these even though they don't exist for Outside Clearance
      OFFENSE: undefined,
      ABUSE: undefined,
    };
  }

  get sidebarComponents(): OpportunityProfileModuleName[] {
    return [
      "UsMoIncarceration",
      "UsMoResidentDates",
      "UsMoAssessmentScores",
      "UsMoSentences",
      "UsMoGangInvolvement",
      "UsMoViolations",
      "UsMoEscapes",
      "UsMoSolitary",
      "UsMoProgramParticipation",
      "UsMoOffenseHistory",
    ];
  }
}
