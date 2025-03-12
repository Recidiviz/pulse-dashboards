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
import _ from "lodash";
import moment from "moment";

import {
  formatAsCurrency,
  formatDate,
  formatWorkflowsDate,
} from "../../../../utils";
import type {
  Client,
  CompliantReportingReferralRecord,
  CompliantReportingTransformedETLFormInput,
} from "../../../../WorkflowsStore";

function formatSentenceLength(
  startDate?: Date,
  sentenceLengthDays?: number,
): string {
  if (!sentenceLengthDays || !startDate) return "";

  const start = moment.utc(startDate);
  const end = start.clone().add(sentenceLengthDays, "days");
  const diff = moment.duration(start.diff(end)).abs();

  return diff.humanize();
}

export const transform = (
  client: Client,
  record: CompliantReportingReferralRecord,
): CompliantReportingTransformedETLFormInput => {
  const { formInformation } = record;

  return {
    docketNumbers: formInformation.docketNumbers?.join(", ") ?? "",
    sentenceStartDate: formatDate(
      formInformation.sentenceStartDate,
      "yyyy-MM-dd",
    ),
    expirationDate: formatDate(formInformation.expirationDate, "yyyy-MM-dd"),
    clientFullName: client.displayName,
    dateToday: formatWorkflowsDate(new Date()),
    telephoneNumber: client.phoneNumber ?? "",
    restitutionMonthlyPaymentTo:
      formInformation.restitutionMonthlyPaymentTo?.join("; ") ?? "",
    isParole: client.supervisionType === "Parole",
    isProbation:
      client.supervisionType === "Probation" ||
      client.supervisionType === "Determinate Release Probation" ||
      client.supervisionType === "Misdemeanor Probation",
    isIsc: client.supervisionType === "ISC",
    is4035313: client.supervisionType === "Diversion",
    physicalAddress: client.address ?? "",

    poFullName: client.assignedStaffFullName,
    sentenceLengthDaysText: formatSentenceLength(
      formInformation.sentenceStartDate,
      formInformation.sentenceLengthDays,
    ),
    supervisionFeeArrearagedAmount:
      formInformation.supervisionFeeArrearagedAmount
        ? formatAsCurrency(formInformation.supervisionFeeArrearagedAmount)
        : "",
    supervisionFeeAssessed: formInformation.supervisionFeeAssessed
      ? formatAsCurrency(formInformation.supervisionFeeAssessed)
      : "",
    supervisionFeeArrearaged: !!formInformation.supervisionFeeArrearaged,
    supervisionFeeWaived: formInformation.supervisionFeeWaived
      ? "Fees Waived"
      : "",

    currentOffenses0: formInformation.currentOffenses?.[0] || "",
    currentOffenses1: formInformation.currentOffenses?.[1] || "",
    currentOffenses2: formInformation.currentOffenses?.[2] || "",
    currentOffenses3: formInformation.currentOffenses?.[3] || "",
    currentOffenses4: formInformation.currentOffenses?.[4] || "",

    supervisionFeeExemptionType: _.uniq(
      formInformation.currentExemptionsAndExpiration?.map(
        (exemptionInfo) => exemptionInfo.exemptionReason,
      ),
    ).join(", "),
    supervisionFeeExemptionExpirDate: _.uniq(
      formInformation.currentExemptionsAndExpiration?.map(
        (exemptionInfo) => exemptionInfo.endDate,
      ),
    )
      .filter((d): d is Date => !!d)
      .map((d) => formatDate(d, "yyyy-MM-dd"))
      .join(", "),
    judicialDistrict: formInformation.judicialDistrict?.length
      ? _.uniq(formInformation.judicialDistrict).join(", ")
      : "Unknown",
    driversLicense: formInformation.driversLicense ?? "",
    restitutionAmt: formInformation.restitutionAmt
      ? formInformation.restitutionAmt.toString()
      : "",
    restitutionMonthlyPayment: formInformation.restitutionMonthlyPayment
      ? formInformation.restitutionMonthlyPayment.toString()
      : "",
    courtCostsPaid: !!formInformation.courtCostsPaid,
    tdocId: record.externalId,
    specialConditionsAlcDrugScreenDate: formatDate(
      record.eligibleCriteria.usTnPassedDrugScreenCheck.latestDrugTestIsNegative
        .latestDrugScreenDate,
      "yyyy-MM-dd",
    ),
    convictionCounty: record.metadata.convictionCounties.join(", "),
    courtName: "Circuit Court",
  };
};
