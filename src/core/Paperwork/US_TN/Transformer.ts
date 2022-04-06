import type { Client } from "../../../PracticesStore/Client";
import {
  CompliantReportingReferralRecord,
  TransformedCompliantReportingReferral,
} from "../../../PracticesStore/CompliantReportingReferralRecord";
import { formatAsCurrency } from "../../../utils";

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
    sentenceLengthDaysText: data.sentenceLengthDays
      ? `${data.sentenceLengthDays} days`
      : "",
    specialConditionsAlcDrugTreatmentIsInpatient:
      data.specialConditionsAlcDrugTreatmentInOut === "INPATIENT",
    specialConditionsAlcDrugTreatmentIsOutpatient:
      data.specialConditionsAlcDrugTreatmentInOut === "OUTPATIENT",

    supervisionFeeArrearagedAmount: formatAsCurrency(
      data.supervisionFeeArrearagedAmount
    ),
    supervisionFeeAssessed: formatAsCurrency(data.supervisionFeeAssessed),
  };
};
