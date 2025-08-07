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

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatDate } from "../../../utils/formatStrings";
import { UsMoWorkReleaseOpportunity } from "../UsMo/UsMoWorkReleaseOpportunity/UsMoWorkReleaseOpportunity";
import { UsMoWorkReleaseDraftData } from "../UsMo/UsMoWorkReleaseOpportunity/UsMoWorkReleaseReferralRecord";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

function formatList<T>(items: T[], formatFn: (item: T) => string): string {
  return items.length > 0 ? items.map(formatFn).join("\n") : "None Noted";
}

export class UsMoWorkReleaseForm extends FormBase<
  UsMoWorkReleaseDraftData,
  UsMoWorkReleaseOpportunity
> {
  navigateToFormText = "Generate Paperwork";

  allowRevert = false;

  get formContents(): OpportunityFormComponentName {
    return "FormUsMoWorkRelease";
  }

  get formType(): string {
    return "UsMoWorkReleaseForm";
  }

  prefilledDataTransformer: PrefilledDataTransformer<UsMoWorkReleaseDraftData> =
    () => {
      const {
        record: { formInformation },
        person,
      } = this.opportunity;

      const { metadata } = person;
      if (metadata.stateCode !== "US_MO") {
        return {};
      }

      const out: Partial<UsMoWorkReleaseDraftData> = {
        institution: person.facilityId,
        date: formatDate(new Date()),
        offenderName: person.displayName,
        docId: person.displayId,
        housingUnit: person.unitId,
        scoreM: metadata.medicalScore?.toString() ?? "",
        scoreMH: metadata.mentalHealthScore?.toString() ?? "",
        scoreP: metadata.publicRiskScore?.toString() ?? "",
        scoreI: metadata.institutionalRiskScore?.toString() ?? "",
        scoreE: metadata.educationScore?.toString() ?? "",
        scoreC: (person.custodyLevel ?? "").replace("C-", ""),
        sentence: formatList(
          metadata.activeSentences,
          (s) => `* ${s.offense} - ${s.sentenceLengthYears}`,
        ),
        // releaseDatesType: formInformation.releaseDate.releaseDateType,
        // detailsReleaseDates: formatDate(
        //   formInformation.releaseDate.releaseDate,
        // ),
        detainer: "",
        completedPrograms: formatList(
          metadata.completedPrograms,
          (p) =>
            `* ${p.program} - ${p.status} - ${formatDate(p.completionDate)}`,
        ),
        incarcerationAdjustmentRecord: formatList(
          formInformation.historyViolationsLast24Months,
          (v) => `* ${formatDate(v.violationDate)} - ${v.violationCode}`,
        ),
        substanceUseHistory: "",
        organizedCrimeInvolvement: metadata.gangAffiliation ?? "",
        historyOfViolence: formatList(
          formInformation.historyViolentOffenses,
          (v) => `* ${formatDate(v.offenseDate)} - ${v.offense}`,
        ),
        escapeAbscond: formatList(
          formInformation.historyEscapesAbsconsions,
          (e) => `* ${formatDate(e.eventDate)} - ${e.eventType}`,
        ),
        summary: "",
        additionalInformationNotPreviouslyAddressed: `${person.displayName} is recommended for ${
          this.opportunity.type === "usMoWorkRelease"
            ? "Supervised Work Release"
            : "Outside Clearance"
        }`,
      };
      return out;
    };
}
