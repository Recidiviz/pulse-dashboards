// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { UsTnExpirationDraftData } from "../UsTnExpirationReferralRecord";
import {
  defaultFormValueJoiner,
  displayList,
  displayString,
  formatFormValueDateMMDDYYYYY,
} from "../utils";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

function voterRightsText(code: string): string {
  if (code === "VRRE") {
    return "Form is available upon request";
  }
  if (code === "VRRI") {
    return "Person is ineligible for voter rights restoration";
  }
  return "";
}

export class UsTnExpirationForm extends FormBase<UsTnExpirationDraftData> {
  navigateToFormText = "Generate TEPE note";

  prefilledDataTransformer: PrefilledDataTransformer<UsTnExpirationDraftData> =
    () => {
      if (!this.opportunity.record) return {};

      const { formInformation: form, criteria: criterion } =
        this.opportunity.record;

      const { person } = this.opportunity;

      return {
        expirationDate: criterion.supervisionPastFullTermCompletionDate
          ?.eligibleDate
          ? formatFormValueDateMMDDYYYYY(
              criterion.supervisionPastFullTermCompletionDate?.eligibleDate
            )
          : "",
        currentOffenses: displayList(form.currentOffenses),
        convictionCounties: displayString(form.convictionCounties),
        docketNumbers: displayList(form.docketNumbers),
        sexOffenseInformation: defaultFormValueJoiner(
          `${displayString(form.latestPseCode)} ${
            form.latestPseDate
              ? `on ${formatFormValueDateMMDDYYYYY(form.latestPseDate)}`
              : ""
          }`,
          displayList(form.latestPseOffenses, "Offenses:")
        ),
        address: person.address,
        employmentInformation: defaultFormValueJoiner(
          displayString(form.latestEmpContactCode, "Latest EMP contact code:"),
          displayString(form.latestEmpComment)
        ),
        feeHistory: defaultFormValueJoiner(
          displayString(form.latestFeeContactCode, "Latest fee conatct code:"),
          person.currentBalance
            ? `Current balance: $${person.currentBalance}`
            : "",
          person.lastPaymentAmount
            ? `Latest payment: $${person.lastPaymentAmount} ${
                person.lastPaymentDate
                  ? `on ${formatFormValueDateMMDDYYYYY(
                      person.lastPaymentDate.toString()
                    )}`
                  : ""
              }`
            : ""
        ),
        specialConditions: defaultFormValueJoiner(
          displayList(person.probationSpecialConditions),
          person.paroleSpecialConditions
            ? person.paroleSpecialConditions.join(", ")
            : "",
          `${displayString(form.latestSpeContactCode)} ${
            form.latestSpeContactDate
              ? `on ${formatFormValueDateMMDDYYYYY(form.latestSpeContactDate)}`
              : ""
          }`,
          displayString(form.latestSpeContactComment)
        ),
        votersRightsInformation: form.vrrCode
          ? voterRightsText(form.vrrCode.toUpperCase())
          : "",
      };
    };
}
