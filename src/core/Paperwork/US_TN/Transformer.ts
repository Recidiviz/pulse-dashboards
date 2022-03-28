import {
  CompliantReportingReferralRecord,
  TransformedCompliantReportingReferral,
} from "../../../PracticesStore/CompliantReportingReferralRecord";

export const transform = (
  data: CompliantReportingReferralRecord
): Partial<TransformedCompliantReportingReferral> => {
  return {
    ...data,
    specialConditionsCounselingAngerManagementComplete: !!data.specialConditionsCounselingAngerManagementCompleteDate,
    specialConditionsCounselingMentalHealthComplete: !!data.specialConditionsCounselingMentalHealthCompleteDate,

    currentOffenses: data.currentOffenses || [],
    restitutionMonthlyPaymentTo:
      data.restitutionMonthlyPaymentTo?.join("; ") ?? "",

    clientFullName: `${data.clientFirstName} ${data.clientLastName}`,
    poFullName: `${data.poFirstName} ${data.poLastName}`,
    sentenceLengthDaysText: `${data.sentenceLengthDays} days`,
    specialConditionsAlcDrugTreatmentIsInpatient:
      data.specialConditionsAlcDrugTreatmentInOut === "INPATIENT",
    specialConditionsAlcDrugTreatmentIsOutpatient:
      data.specialConditionsAlcDrugTreatmentInOut === "OUTPATIENT",
  };
};
