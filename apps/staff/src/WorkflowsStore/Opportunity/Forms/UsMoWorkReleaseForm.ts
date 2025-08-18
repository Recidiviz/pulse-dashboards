// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { usMoFormatSentenceLength } from "~datatypes";

import {
  fillAndSavePDF,
  PDFFillerFunc,
} from "../../../core/Paperwork/PDFFormFiller";
import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatDate } from "../../../utils/formatStrings";
import { UsMoWorkReleaseOpportunity } from "../UsMo/UsMoWorkReleaseOpportunity/UsMoWorkReleaseOpportunity";
import { UsMoWorkReleaseDraftData } from "../UsMo/UsMoWorkReleaseOpportunity/UsMoWorkReleaseReferralRecord";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

function formatList<T>(items: T[], formatFn: (item: T) => string): string {
  return items.length > 0
    ? items
        .map(formatFn)
        // .map((item) => `* ${item}`)
        .join("; ")
    : "None Noted";
}

const fillerFunc: PDFFillerFunc<UsMoWorkReleaseDraftData> = async (
  formData,
  set,
  form,
  doc,
) => {
  set("form1[0].MainSF[0].OffenderSF[0].Institution[0]", formData.institution); // PDFDropdown
  set("form1[0].MainSF[0].OffenderSF[0].Date[0]", formData.date); // PDFTextField
  set(
    "form1[0].MainSF[0].OffenderSF[0].OffenderName[0]",
    formData.offenderName,
  ); // PDFTextField
  set("form1[0].MainSF[0].OffenderSF[0].DOCID[0]", formData.docId); // PDFTextField
  set("form1[0].MainSF[0].OffenderSF[0].HousingUnit[0]", formData.housingUnit); // PDFTextField
  set("form1[0].MainSF[0].RcaSF[0].Medical[0]", formData.scoreM); // PDFTextField
  set("form1[0].MainSF[0].RcaSF[0].MH[0]", formData.scoreMH); // PDFTextField
  set("form1[0].MainSF[0].RcaSF[0].P[0]", formData.scoreP); // PDFTextField
  set("form1[0].MainSF[0].RcaSF[0].I[0]", formData.scoreI); // PDFTextField
  set("form1[0].MainSF[0].RcaSF[0].E[0]", formData.scoreE); // PDFTextField
  set("form1[0].MainSF[0].RcaSF[0].C[0]", formData.scoreC); // PDFTextField
  set("form1[0].MainSF[0].SentenceSF[0].Sentence[0]", formData.sentence); // PDFTextField
  set(
    "form1[0].MainSF[0].HeadingReleaseDatesSF[0].ReleaseDates[0]",
    formData.releaseDatesType,
  ); // PDFDropdown
  set(
    "form1[0].MainSF[0].DetailsSF[0].DetailsReleaseDates[0]",
    formData.detailsReleaseDates,
  ); // PDFTextField
  set("form1[0].MainSF[0].DetainerSF[0].Detainer[0]", formData.detainer); // PDFTextField
  set(
    "form1[0].MainSF[0].CompletedProgramsSF[0].CompletedPrograms[0]",
    formData.completedPrograms,
  ); // PDFTextField
  set(
    "form1[0].MainSF[0].IncarcerationSF[0].IncarcerationAdjustmentRecord[0]",
    formData.incarcerationAdjustmentRecord,
  ); // PDFTextField
  set(
    "form1[0].MainSF[0].SubstanceUseSF[0].SubstanceUseHistory[0]",
    formData.substanceUseHistory,
  ); // PDFTextField
  set(
    "form1[0].MainSF[0].OrganizedCrimeSF[0].OrganizedCrimeInvolvement[0]",
    formData.organizedCrimeInvolvement,
  ); // PDFTextField
  set(
    "form1[0].MainSF[0].HistOfViolenceSF[0].HistoryOfViolence[0]",
    formData.historyOfViolence,
  ); // PDFTextField
  // TODO(#8881) Check if we're populating the fields this references yet
  // set(
  //   "form1[0].MainSF[0].HeadingOffenseAndOtherCriteriaSF[0].None[0]",
  //   !(
  //     formData.historyOfChildAbuse ||
  //     formData.historyOfSexualAbuse ||
  //     formData.otherOffense
  //   ),
  // ); // PDFCheckBox
  set(
    "form1[0].MainSF[0].HeadingOffenseAndOtherCriteriaSF[0].OffenseSF[0].HistoryOfChildAbuse[0]",
    formData.historyOfChildAbuse,
  ); // PDFCheckBox
  set(
    "form1[0].MainSF[0].HeadingOffenseAndOtherCriteriaSF[0].OffenseSF[0].HistoryOfSexualAbuse[0]",
    formData.historyOfSexualAbuse,
  ); // PDFCheckBox
  set(
    "form1[0].MainSF[0].HeadingOffenseAndOtherCriteriaSF[0].OffenseSF[0].Other[0]",
    formData.otherOffense,
  ); // PDFCheckBox
  set(
    "form1[0].MainSF[0].HeadingOffenseAndOtherCriteriaSF[0].OffenseSF[0].OtherTextfield[0]",
    formData.otherOffense,
  ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].OtherCommentsSF[0].OtherAdditionalComments[0]",
  //   formData,
  // ); // PDFTextField
  set(
    "form1[0].MainSF[0].EscapeObscondSF[0].EscapeObscond[0]",
    formData.escapeAbscond,
  ); // PDFTextField
  set("form1[0].MainSF[0].SummarySF[0].Summary[0]", formData.summary); // PDFTextField
  set(
    "form1[0].MainSF[0].AdditionalInforSF[0].AdditionalInforNotPrevAddressed[0]",
    formData.additionalInformationNotPreviouslyAddressed,
  ); // PDFTextField
  set(
    "form1[0].MainSF[0].WorkReleaseOutsideAssignSF[0].WorkReleaseOutsideAssignmentInfor[0]",
    formData.workReleaseOutsideAssignmentInformation,
  ); // PDFTextField

  /////////
  // Additional fields not currently filled, but left here to preserve their widget names

  // set("form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].Welding[0]", formData); // PDFCheckBox
  // set(
  //   "form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].Computer[0]",
  //   formData,
  // ); // PDFCheckBox
  // set(
  //   "form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].Drafting[0]",
  //   formData,
  // ); // PDFCheckBox
  // set(
  //   "form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].Clerking[0]",
  //   formData,
  // ); // PDFCheckBox
  // set(
  //   "form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].Mechanic[0]",
  //   formData,
  // ); // PDFCheckBox
  // set(
  //   "form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].Autobody[0]",
  //   formData,
  // ); // PDFCheckBox
  // set(
  //   "form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].Landscaping[0]",
  //   formData,
  // ); // PDFCheckBox
  // set(
  //   "form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].Maintenance[0]",
  //   formData,
  // ); // PDFCheckBox
  // set(
  //   "form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].FoodService[0]",
  //   formData,
  // ); // PDFCheckBox
  // set("form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].Janitor[0]", formData); // PDFCheckBox
  // set("form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].Other[0]", formData); // PDFCheckBox
  // set("form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].Other[1]", formData); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].StaffCompleteDate[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].CompletedByStaffMembersSignature[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].PreIncarcerationWorkExperSF[0].CompletedByStaffMemberNamePrinted[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].FUMdesigneeApprovalSF[0].DaysOfProbationWhenSucessfullyCompleted[0]",
  //   formData,
  // ); // PDFTextField
  // set("form1[0].MainSF[0].FUMdesigneeApprovalSF[0].Comments[0]", formData); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].FUMdesigneeApprovalSF[0].FUMDesigneeSignature[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].FUMdesigneeApprovalSF[0].FUMDesigneeDate[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].ChiefOfCustApprovalSF[0].DaysOfProbationWhenSucessfullyCompleted[0]",
  //   formData,
  // ); // PDFTextField
  // set("form1[0].MainSF[0].ChiefOfCustApprovalSF[0].Comments[0]", formData); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].ChiefOfCustApprovalSF[0].ChiefOfCustDesigneeSignature[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].ChiefOfCustApprovalSF[0].ChiefOfCustDesigneeDate[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].AssistantWardendesigneeApprovalSF[0].DaysOfProbationWhenSucessfullyCompleted[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].AssistantWardendesigneeApprovalSF[0].Comments[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].AssistantWardendesigneeApprovalSF[0].AssistantWardenDesigneeSignature[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].AssistantWardendesigneeApprovalSF[0].AssistantWardenDesigneeDate[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].DeputyWardenApprovalSF[0].DaysOfProbationWhenSucessfullyCompleted[0]",
  //   formData,
  // ); // PDFTextField
  // set("form1[0].MainSF[0].DeputyWardenApprovalSF[0].Comments[0]", formData); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].DeputyWardenApprovalSF[0].DeputyWardenDesigneeSignature[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].DeputyWardenApprovalSF[0].DeputyWardenDesigneeDate[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].DeputyWardenOptionalApprovalSF[0].DaysOfProbationWhenSucessfullyCompleted[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].DeputyWardenOptionalApprovalSF[0].Comments[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].DeputyWardenOptionalApprovalSF[0].DeputyWardenDesigneeSignature[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].DeputyWardenOptionalApprovalSF[0].DeputyWardenDesigneeDate[0]",
  //   formData,
  // ); // PDFTextField
  // set(
  //   "form1[0].MainSF[0].CAOApprovalSF[0].DaysOfProbationWhenSucessfullyCompleted[0]",
  //   formData,
  // ); // PDFTextField
  // set("form1[0].MainSF[0].CAOApprovalSF[0].Comments[0]", formData); // PDFTextField
  // set("form1[0].MainSF[0].CAOApprovalSF[0].CAOSignature[0]", formData); // PDFTextField
  // set("form1[0].MainSF[0].CAOApprovalSF[0].CAODesigneeDate[0]", formData); // PDFTextField
  // set("form1[0].Main2SF[0].OffenderSF[0].OffenderName[0]", formData); // PDFTextField
  // set("form1[0].Main2SF[0].OffenderSF[0].HousingUnit[0]", formData); // PDFTextField
  // set("form1[0].Main2SF[0].OffenderSF[0].DOCID[0]", formData); // PDFTextField
  // set("form1[0].Main2SF[0].OffenderSF[0].CAODesigneeDate[0]", formData); // PDFTextField
  // set("radio", formData); // PDFCheckBox
  try {
    form.flatten();
  } catch (error) {
    console.error("Error flattening form:", error);
  }
};

export class UsMoWorkReleaseForm extends FormBase<
  UsMoWorkReleaseDraftData,
  UsMoWorkReleaseOpportunity
> {
  navigateToFormText = "Generate Paperwork";

  allowRevert = false;

  get formContents(): OpportunityFormComponentName {
    return "FormUsMoWorkRelease";
  }

  get formType(): string {
    return "UsMoWorkReleaseForm";
  }

  prefilledDataTransformer: PrefilledDataTransformer<UsMoWorkReleaseDraftData> =
    () => {
      const {
        record: { formInformation },
        person,
      } = this.opportunity;

      const { metadata } = person;
      if (metadata.stateCode !== "US_MO") {
        return {};
      }

      const out: Partial<UsMoWorkReleaseDraftData> = {
        institution: person.facilityId,
        date: formatDate(new Date()),
        offenderName: person.displayName,
        docId: person.displayId,
        housingUnit: person.unitId,
        scoreM: metadata.medicalScore?.toString() ?? "",
        scoreMH: metadata.mentalHealthScore?.toString() ?? "",
        scoreP: metadata.publicRiskScore?.toString() ?? "",
        scoreI: metadata.institutionalRiskScore?.toString() ?? "",
        scoreE: metadata.educationScore?.toString() ?? "",
        scoreC: (person.custodyLevel ?? "").replace("C-", ""),
        sentence: formatList(metadata.latestCycleSentences, (s) => {
          return `${s.offense} - ${usMoFormatSentenceLength(s)}`;
        }),
        // releaseDatesType: formInformation.releaseDate.releaseDateType,
        // detailsReleaseDates: formatDate(
        //   formInformation.releaseDate.releaseDate,
        // ),
        detainer: "",
        completedPrograms: formatList(
          metadata.latestCycleCompletedPrograms,
          (p) => `${p.program} - ${p.status} - ${formatDate(p.completionDate)}`,
        ),
        incarcerationAdjustmentRecord: formatList(
          formInformation.historyViolationsLast24Months,
          (v) => `${formatDate(v.violationDate)} - ${v.violationCode}`,
        ),
        substanceUseHistory: "",
        organizedCrimeInvolvement: metadata.gangAffiliation ?? "",
        escapeAbscond: formatList(
          formInformation.historyEscapesAbsconsions,
          (e) =>
            `${formatDate(e.eventDate)} - ${
              e.eventType === "WARRANT_ISSUED"
                ? "Absconsion Warrant Issued"
                : e.eventType
            }`,
        ),
        summary: "",
        additionalInformationNotPreviouslyAddressed: `${person.displayName} is recommended for ${
          this.opportunity.type === "usMoWorkRelease"
            ? "Supervised Work Release"
            : "Outside Clearance"
        }`,
      };
      return out;
    };

  async fillAndSaveFile(): Promise<void> {
    const oppName = this.opportunity.config.label;

    await fillAndSavePDF(
      `${this.person.displayName} - ${oppName} Screening Form.pdf`,
      "US_MO",
      "work_release_template.pdf",
      fillerFunc,
      this.formData,
      this.rootStore.getTokenSilently,
    );
  }
}
