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
import { compact } from "lodash";

import WorkflowsUsTnExpirationForm from "../../../core/WorkflowsUsTnExpirationForm";
import { SpecialConditionCode } from "../../../FirestoreStore";
import flags from "../../../flags";
import { ParsedSpecialConditionOrString } from "../../Client";
import { UsTnExpirationOpportunity } from "../UsTnExpirationOpportunity";
import {
  Contact,
  UsTnExpirationDraftData,
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

function contactTypes(voterRightsCode?: string): string {
  return ["TEPE", voterRightsCode].filter((v) => v).join(", ");
}

function formatSpecialConditions(
  latestSpe?: Contact,
  paroleSpecialConditions?: SpecialConditionCode[],
  probationSpecialConditions?: ParsedSpecialConditionOrString[]
): string[] {
  const specialConditionsText = [];
  if (latestSpe) {
    specialConditionsText.push(
      defaultFormValueJoiner(
        displayString(latestSpe.contactType, "Latest SPE code:"),
        displayString(latestSpe.contactComment, "Comment: ")
      )
    );
  }

  if (paroleSpecialConditions?.length) {
    const conditions = paroleSpecialConditions.map(
      ({ condition, conditionDescription }) =>
        `${condition} (${conditionDescription})`
    );
    specialConditionsText.push(
      `Board conditions to be monitored: ${displayList(conditions)}`
    );
  }

  if (probationSpecialConditions?.length) {
    const conditions = compact(
      probationSpecialConditions.map(
        (condition: ParsedSpecialConditionOrString) => {
          if (typeof condition === "string") {
            return condition;
          }
          return condition.conditions_on_date;
        }
      )
    );
    specialConditionsText.push(
      `Special conditions on current sentences: ${displayList(conditions)}`
    );
  }

  return specialConditionsText;
}

function formatOffenseList(offenses?: Contact[]): string | undefined {
  if (!offenses) return;

  return defaultFormValueJoiner(
    offenses
      .map((offense) =>
        defaultFormValueJoiner(
          `Contact code: ${
            offense.contactType
          } on ${formatFormValueDateMMDDYYYYY(offense.contactDate)}`,
          displayString(offense?.contactComment)
        )
      )
      .join("\n\n")
  );
}

export class UsTnExpirationForm extends FormBase<
  UsTnExpirationDraftData,
  UsTnExpirationOpportunity
> {
  navigateToFormText = "Generate TEPE note";

  formComponent = WorkflowsUsTnExpirationForm;

  prefilledDataTransformer: PrefilledDataTransformer<UsTnExpirationDraftData> =
    () => {
      if (!this.opportunity.record) return {};

      const { formInformation: form, eligibleCriteria: criterion } =
        this.opportunity.record;

      const { person } = this.opportunity;

      const prefilledFields: Partial<UsTnExpirationDraftData> = {
        contactTypes: contactTypes(form.latestVrr?.contactType.toUpperCase()),
        expirationDate: formatFormValueDateMMDDYYYYY(
          criterion.supervisionPastFullTermCompletionDateOrUpcoming1Day
            .eligibleDate
        ),
        currentOffenses: displayList(form.offenses),
        convictionCounties: displayList(form.convictionCounties),
        docketNumbers: displayList(form.docketNumbers),
        sexOffenseInformation: defaultFormValueJoiner(
          displayList(form.sexOffenses),
          form.latestPse
            ? `${displayString(
                form.latestPse.contactType
              )} on ${formatFormValueDateMMDDYYYYY(form.latestPse.contactDate)}`
            : ""
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
            "Latest fee contact code:"
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
          ...formatSpecialConditions(
            form.latestSpe,
            person.paroleSpecialConditions,
            person.formattedProbationSpecialConditions
          )
        ),
        votersRightsInformation: form.latestVrr
          ? voterRightsText(form.latestVrr.contactType.toUpperCase())
          : "",
        gangAffiliation: displayString(form.gangAffiliationId),
      };

      if (flags.enableTepeAdditionalFields) {
        prefilledFields.newOffenses = formatOffenseList(form.newOffenses);
        prefilledFields.alcoholDrugInformation = formatOffenseList(
          form.alcoholHistory
        );
      }

      return prefilledFields;
    };
}
