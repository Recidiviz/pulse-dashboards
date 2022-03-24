import {
  CompliantReportingReferralRecord,
  TransformedCompliantReportingReferral,
} from "../../../PracticesStore/CompliantReportingReferralRecord";

export const transform = (
  data: CompliantReportingReferralRecord
): TransformedCompliantReportingReferral => {
  return {
    ...data,
    clientFullName: `${data.clientFirstName} ${data.clientLastName}`,
    poFullName: `${data.poFirstName} ${data.poLastName}`,
    offenseType: JSON.parse(data.offenseType),
  };
};
