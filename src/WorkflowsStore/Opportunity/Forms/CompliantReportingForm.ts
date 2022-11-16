import { transform } from "../../../core/Paperwork/US_TN/Transformer";
import { CompliantReportingOpportunity } from "../CompliantReportingOpportunity";
import { CompliantReportingDraftData } from "../CompliantReportingReferralRecord";
import { FormBase } from "./FormBase";

export class CompliantReportingForm extends FormBase<
  CompliantReportingDraftData,
  CompliantReportingOpportunity
> {
  navigateToFormText = "Auto-fill referral";

  get printText(): string {
    if (this.formIsPrinting) {
      return "Printing PDF...";
    }

    if (this.opportunity.updates?.completed) {
      return "Reprint PDF";
    }

    return "Print PDF";
  }

  prefilledDataTransformer(): Partial<CompliantReportingDraftData> {
    return transform(this.person, this.opportunity.record ?? {});
  }
}
