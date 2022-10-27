import { transform } from "../../../core/Paperwork/US_TN/Transformer";
import { CompliantReportingDraftData } from "../CompliantReportingReferralRecord";
import { FormBase } from "./FormBase";

export class CompliantReportingForm extends FormBase<CompliantReportingDraftData> {
  navigateToFormText = "Auto-fill referral";

  get printText(): string {
    if (this.client.formIsPrinting) {
      return "Printing PDF...";
    }

    if (this.opportunity.updates?.completed) {
      return "Reprint PDF";
    }

    return "Print PDF";
  }

  prefilledDataTransformer(): Partial<CompliantReportingDraftData> {
    return transform(this.client, this.opportunity.record ?? {});
  }
}
