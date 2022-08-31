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
import moment from "moment";

import { formatAsCurrency, formatWorkflowsDate } from "../../../utils";
import type { Client } from "../../../WorkflowsStore";
import {
  CompliantReportingReferralRecord,
  TransformedCompliantReportingReferral,
} from "../../../WorkflowsStore";

function formatSentenceLength(
  startDate: string,
  sentenceLengthDays: string
): string {
  if (!sentenceLengthDays) return "";

  const start = moment.utc(startDate);
  const end = start.clone().add(sentenceLengthDays, "days");
  const diff = moment.duration(start.diff(end)).abs();

  return diff.humanize();
}

export const transform = (
  client: Client,
  data: CompliantReportingReferralRecord
): Partial<TransformedCompliantReportingReferral> => {
  let allDockets;
  try {
    allDockets = (JSON.parse(data.allDockets) as string[]).join(", ");
  } catch {
    allDockets = data.allDockets;
  }

  return {
    ...data,
    allDockets,
    clientFullName: client.displayName,
    dateToday: formatWorkflowsDate(new Date()),
    telephoneNumber: client.formattedPhoneNumber,
    specialConditionsCounselingAngerManagementComplete: !!data.specialConditionsCounselingAngerManagementCompleteDate,
    specialConditionsCounselingMentalHealthComplete: !!data.specialConditionsCounselingMentalHealthCompleteDate,

    currentOffenses: data.currentOffenses || [],
    restitutionMonthlyPaymentTo:
      data.restitutionMonthlyPaymentTo?.join("; ") ?? "",
    isParole: client.supervisionType === "Parole",
    isProbation:
      client.supervisionType === "Probation" ||
      client.supervisionType === "Determinate Release Probation" ||
      client.supervisionType === "Misdemeanor Probation",
    isIsc: client.supervisionType === "ISC",
    is4035313: client.supervisionType === "Diversion",

    poFullName: `${data.poFirstName} ${data.poLastName}`,
    sentenceLengthDaysText: formatSentenceLength(
      data.sentenceStartDate,
      data.sentenceLengthDays
    ),
    specialConditionsAlcDrugTreatmentIsInpatient:
      data.specialConditionsAlcDrugTreatmentInOut === "INPATIENT",
    specialConditionsAlcDrugTreatmentIsOutpatient:
      data.specialConditionsAlcDrugTreatmentInOut === "OUTPATIENT",

    supervisionFeeArrearagedAmount: formatAsCurrency(
      data.supervisionFeeArrearagedAmount
    ),
    supervisionFeeAssessed: formatAsCurrency(data.supervisionFeeAssessed),

    currentOffenses0: data.currentOffenses[0] || "",
    currentOffenses1: data.currentOffenses[1] || "",
    currentOffenses2: data.currentOffenses[2] || "",
    currentOffenses3: data.currentOffenses[3] || "",
    currentOffenses4: data.currentOffenses[4] || "",
  };
};
