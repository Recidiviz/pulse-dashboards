import { transform } from "../../../core/Paperwork/US_TN/CompliantReporting/Transformer";
import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatDate } from "../../../utils";
import {
  CompliantReportingDraftData,
  CompliantReportingOpportunity,
} from "../UsTn";
import { FormBase } from "./FormBase";

export class CompliantReportingForm extends FormBase<
  CompliantReportingDraftData,
  CompliantReportingOpportunity
> {
  navigateToFormText = "Auto-fill referral";

  // eslint-disable-next-line class-methods-use-this
  get formContents(): OpportunityFormComponentName {
    return "WorkflowsCompliantReportingForm";
  }

  get downloadText(): string {
    if (this.formIsDownloading) {
      return "Downloading PDF...";
    }

    if (this.opportunity.updates?.completed) {
      return "Re-download PDF";
    }

    return "Download PDF";
  }

  prefilledDataTransformer(): Partial<CompliantReportingDraftData> {
    return transform(
      this.person,
      {
        ...this.opportunity.record,
        sentenceStartDate: formatDate(
          this.opportunity.record?.formInformation.sentenceStartDate,
          "yyyy-MM-dd"
        ),
        supervisionFeeExemptionType: (
          this.opportunity.record?.eligibleCriteria.usTnFinesFeesEligible
            ?.hasPermanentFinesFeesExemption?.currentExemptions ?? []
        ).join(", "),
        currentOffenses:
          this.opportunity.record?.formInformation.currentOffenses,
      } ?? {}
    );
  }
}
