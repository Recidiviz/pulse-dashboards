import type { Client } from "../../../PracticesStore/Client";
import {
  CompliantReportingReferralRecord,
  TransformedCompliantReportingReferral,
} from "../../../PracticesStore/CompliantReportingReferralRecord";

export const transform = (
  client: Client,
  data: CompliantReportingReferralRecord
): Partial<TransformedCompliantReportingReferral> => {
  return {
    ...data,
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

    clientFullName: `${data.clientFirstName} ${data.clientLastName}`,
    poFullName: `${data.poFirstName} ${data.poLastName}`,
    sentenceLengthDaysText: data.sentenceLengthDays
      ? `${data.sentenceLengthDays} days`
      : "",
    specialConditionsAlcDrugTreatmentIsInpatient:
      data.specialConditionsAlcDrugTreatmentInOut === "INPATIENT",
    specialConditionsAlcDrugTreatmentIsOutpatient:
      data.specialConditionsAlcDrugTreatmentInOut === "OUTPATIENT",
  };
};
