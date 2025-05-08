// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { deleteField } from "firebase/firestore";
import { sortBy } from "lodash";
import moment from "moment";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { pluralize } from "../../../utils";
import { UNKNOWN } from "../../Client";
import {
  UsNdEarlyTerminationDraftData,
  UsNdEarlyTerminationOpportunity,
} from "../UsNd";
import { FormBase } from "./FormBase";

const ADDITIONAL_DEPOSITION_LINES_PREFIX = "additionalDepositionLines";
const FORM_DATE_FORMAT = "MMMM Do, YYYY";

export class EarlyTerminationForm extends FormBase<
  UsNdEarlyTerminationDraftData,
  UsNdEarlyTerminationOpportunity
> {
  navigateToFormText = "Auto-fill paperwork";

  get formContents(): OpportunityFormComponentName {
    if (this.opportunity.formVariant === "deferred") {
      return "WorkflowsEarlyTerminationDeferredForm";
    }
    return "WorkflowsEarlyTerminationForm";
  }

  get formType(): string {
    return "EarlyTerminationForm";
  }

  prefilledDataTransformer(): Partial<UsNdEarlyTerminationDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const { supervisionStartDate, displayName } = this.person;

    const {
      formInformation: {
        convictionCounty,
        judicialDistrictCode,
        criminalNumber,
        judgeName,
        priorCourtDate,
        sentenceLengthMonths,
        crimeNames,
        probationStartDate,
        probationExpirationDate,
        probationOfficerFullName,
        statesAttorneyPhoneNumber,
        statesAttorneyEmailAddress,
        statesAttorneyMailingAddress,
        statesAttorneyName,
      },
    } = this.opportunity.record;

    return {
      clientName: displayName,
      judgeName,
      convictionCounty: convictionCounty?.replaceAll("_", " ") ?? "",
      judicialDistrictCode: judicialDistrictCode?.replaceAll("_", " ") ?? "",
      priorCourtDate: moment(priorCourtDate).format(FORM_DATE_FORMAT),
      supervisionStartDate:
        moment(supervisionStartDate).format(FORM_DATE_FORMAT),
      probationStartDate: moment(probationStartDate).format(FORM_DATE_FORMAT),
      probationExpirationDate: moment(probationExpirationDate).format(
        FORM_DATE_FORMAT,
      ),
      sentenceLengthMonths: sentenceLengthMonths
        ? pluralize(sentenceLengthMonths, "month")
        : UNKNOWN,
      plaintiff: "State of North Dakota",
      crimeNames: crimeNames?.join(", ") ?? "",
      probationOfficerFullName,
      criminalNumber,
      statesAttorneyPhoneNumber,
      statesAttorneyEmailAddress,
      statesAttorneyMailingAddress,
      statesAttorneyName,
      priorCourtDay: moment(priorCourtDate).format("Do"),
      priorCourtMonth: moment(priorCourtDate).format("MMMM"),
      priorCourtYear: moment(priorCourtDate).format("YYYY"),
    };
  }

  get downloadText(): string {
    if (this.formIsDownloading) {
      return "Downloading .DOCX...";
    }

    if (this.opportunity?.updates?.completed) {
      return "Re-download .DOCX";
    }

    return "Download .DOCX";
  }

  get additionalDepositionLines(): string[] {
    const additionalDepositionLines = Object.keys(this.draftData).filter(
      (key: string) => key.startsWith(ADDITIONAL_DEPOSITION_LINES_PREFIX),
    );

    return sortBy(additionalDepositionLines, (key) =>
      Number(key.split(ADDITIONAL_DEPOSITION_LINES_PREFIX)[1]),
    );
  }

  addDepositionLine(): void {
    const key = `${ADDITIONAL_DEPOSITION_LINES_PREFIX}${+new Date()}`;
    this.updateDraftData(key, "");
  }

  removeDepositionLine(key: string): void {
    this.updateDraftData(key, deleteField());
  }
}
