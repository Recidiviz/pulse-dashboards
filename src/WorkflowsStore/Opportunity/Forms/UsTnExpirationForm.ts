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
import {
  UsTnExpirationDraftData,
  UsTnExpirationReferralRecord,
} from "../UsTnExpirationReferralRecord";
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

      const { formInformation: form, criteria: criterion } = this.opportunity
        .record as UsTnExpirationReferralRecord;

      const { person } = this.opportunity;

      return {
        expirationDate: formatFormValueDateMMDDYYYYY(
          criterion.supervisionPastFullTermCompletionDateOrUpcoming60Day
            .eligibleDate
        ),
        currentOffenses: displayList(form.offenses),
        convictionCounties: displayList(form.convictionCounties),
        docketNumbers: displayList(form.docketNumbers),
        sexOffenseInformation: defaultFormValueJoiner(
          `${displayString(form.latestPse?.contactType)} ${
            form.latestPse
              ? `on ${formatFormValueDateMMDDYYYYY(form.latestPse.contactDate)}`
              : ""
          }`,
          displayList(form.sexOffenses, "Offenses:")
        ),
        address: person.address,
        employmentInformation: defaultFormValueJoiner(
          displayString(
            form.latestEmp?.contactType,
            "Latest EMP contact code:"
          ),
          displayString(form.latestEmp?.contactComment)
        ),
        feeHistory: defaultFormValueJoiner(
          displayString(
            form.latestFee?.contactType,
            "Latest fee conatct code:"
          ),
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
          `${displayString(form.latestSpe?.contactType)} ${
            form.latestSpe
              ? `on ${formatFormValueDateMMDDYYYYY(form.latestSpe.contactDate)}`
              : ""
          }`,
          displayString(form.latestSpe?.contactComment)
        ),
        votersRightsInformation: form.latestVrr
          ? voterRightsText(form.latestVrr.contactType.toUpperCase())
          : "",
      };
    };
}
