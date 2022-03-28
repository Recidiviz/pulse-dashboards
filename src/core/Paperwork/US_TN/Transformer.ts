import {
  CompliantReportingReferralRecord,
  TransformedCompliantReportingReferral,
} from "../../../PracticesStore/CompliantReportingReferralRecord";

export const transform = (
  data: CompliantReportingReferralRecord
): Partial<TransformedCompliantReportingReferral> => {
  return {
    ...data,
    specialConditionsCounselingAngerManagementComplete: data.specialConditionsCounselingAngerManagementCompleteDate
      ? "1"
      : "0",
    specialConditionsCounselingMentalHealthComplete: data.specialConditionsCounselingMentalHealthCompleteDate
      ? "1"
      : "0",
    restitutionMonthlyPaymentTo: JSON.parse(
      data.restitutionMonthlyPaymentTo || "[]"
    ).join(" "),
    clientFullName: `${data.clientFirstName} ${data.clientLastName}`,
    poFullName: `${data.poFirstName} ${data.poLastName}`,
    offenseType: JSON.parse(data.offenseType),
    sentenceLengthDaysText: `${data.sentenceLengthDays} days`,
    specialConditionsAlcDrugTreatmentIsInpatient:
      data.specialConditionsAlcDrugTreatmentInOut === "INPATIENT" ? "1" : "0",
    specialConditionsAlcDrugTreatmentIsOutpatient:
      data.specialConditionsAlcDrugTreatmentInOut === "OUTPATIENT" ? "1" : "0",
  };
};
