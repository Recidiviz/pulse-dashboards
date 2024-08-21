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

import { differenceInDays } from "date-fns";
import { mapValues, max } from "lodash";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { Resident } from "../../Resident";
import { UsMeAnnualReclassificationOpportunity } from "../UsMe/UsMeAnnualReclassificationOpportunity/UsMeAnnualReclassificationOpportunity";
import { FormBase } from "./FormBase";

type UnionOverrideKeys<T, U> = Omit<T, keyof U> & U;

export type UsMeAnnualReclassificationReviewData = UnionOverrideKeys<
  Pick<
    Resident,
    | "admissionDate"
    | "custodyLevel"
    | "externalId"
    | "assignedStaffFullName"
    | "facilityId"
    | "displayName"
    | "releaseDate"
    | "sccpEligibilityDate"
    | "unitId"
  > & {
    // Checkboxes
    isAnnualReclass: boolean;
    isSemiannualReclass: boolean;
    isWithProbation: boolean;
    // formInformation.currentOffense (formatted)
    currentOffenses1: string;
    currentOffenses2: string;
    currentOffenses3: string;
    currentOffenses4: string;
    currentOffenses5: string;

    // formInformation.workAssignment (formatted)
    workAssignment1: string;
    workAssignment2: string;
    workAssignment3: string;
    workAssignment4: string;

    // formInformation.programEnrollment (formatted)
    programCompleted1: string;
    programCompleted2: string;
    programCompleted3: string;
    programCompleted4: string;
    programCompleted5: string;
    programCompleted6: string;
    programCompleted7: string;
    programCompleted8: string;
    programCompleted9: string;
    programCompleted10: string;

    // formInformation.casePlanGoal (formatted)
    casePlanGoal1: string;
    casePlanGoal2: string;
    casePlanGoal3: string;
    casePlanGoal4: string;
    casePlanGoal5: string;
    casePlanGoal6: string;
    casePlanGoal7: string;
    casePlanGoal8: string;
    casePlanGoal9: string;
    casePlanGoal10: string;

    // formInformation.furlough (formatted)
    furloughs1: string;
    furloughs2: string;
    furloughs3: string;

    // formInformation.escapeHistory (formatted)
    escapeHistory1: string;
    escapeHistory2: string;
    escapeHistory3: string;

    // CALCULATED
    vNum: string;
    numOfPrograms: string;
    numOfFurloughs: string;
    todaysDate: string;
  },
  // OVERRIDES
  {
    admissionDate: string;
    arrivalDate: string;
    latestClassificationDate: string;
    releaseDate: string;
    sccpEligibilityDate: string;
    sentenceIncludesProbation: string;
  }
>;

const generateLines = (
  prefix: string,
  numOfLines: number,
  lines: string[] | undefined,
) => {
  const generatedLines: Record<string, string> = {};

  for (let i = 0; i < numOfLines; i++) {
    const currentKey = `${prefix}${i + 1}`;
    generatedLines[currentKey] = lines && lines.length > i ? lines[i] : "";
  }

  return generatedLines;
};

export class UsMeAnnualReclassificationReviewForm extends FormBase<
  UsMeAnnualReclassificationReviewData,
  UsMeAnnualReclassificationOpportunity
> {
  navigateToFormText = "Generate paperwork";
  allowRevert = false;

  get formContents(): OpportunityFormComponentName {
    return "AnnualClassificationReview";
  }

  get formType(): string {
    return "UsMeAnnualReclassificationReviewForm";
  }

  prefilledDataTransformer(): Partial<UsMeAnnualReclassificationReviewData> {
    if (!this.opportunity.record) return {};
    const { formInformation, eligibleCriteria, ineligibleCriteria } =
      this.opportunity.record;

    const usMeIncarcerationPastRelevantClassificationDate =
      eligibleCriteria.usMeIncarcerationPastRelevantClassificationDate ??
      ineligibleCriteria.usMeIncarcerationPastRelevantClassificationDate;

    const {
      admissionDate,
      assignedStaffFullName,
      custodyLevel,
      externalId,
      facilityId,
      displayName,
      releaseDate,
      sccpEligibilityDate,
      unitId,
    } = this.person;

    /**
     * Date information transformed into US_ME date formats used on MDOC website.
     */
    const dateInputs = mapValues(
      {
        arrivalDate: formInformation.arrivalDate,
        releaseDate,
        admissionDate,
        todaysDate: new Date(),
        sccpEligibilityDate,
        latestClassificationDate:
          usMeIncarcerationPastRelevantClassificationDate?.latestClassificationDate,
      },
      (date) =>
        date && date instanceof Date
          ? ((() => {
              const retString = date.toLocaleDateString("en-US");
              return retString === "Invalid Date" ? "" : retString;
            }) as unknown as string)
          : "",
    );

    /**
     * Form information values are split by ` @@@ ` to get the lists per key.
     */
    const parsedFormInformation = mapValues(
      {
        programEnrollment: formInformation.programEnrollment,
        furloughs: formInformation.furloughs,
        workAssignments: formInformation.workAssignments,
        casePlanGoals: formInformation.casePlanGoals,
        disciplinaryReports: formInformation.disciplinaryReports,
        currentOffenses: formInformation.currentOffenses,
        escapeHistory: formInformation.escapeHistory10Years,
      },
      (value) => value?.split(" @@@ "),
    );

    // Only includes completed programs. Does not show the in-progress programs.
    // NOTE: Consider a component in sidebar to show "Active" enrollments.
    parsedFormInformation.programEnrollment =
      parsedFormInformation.programEnrollment
        ?.filter((program) => program.includes("Completed Successfully - "))
        ?.map((program) => program.replace("Completed Successfully - ", ""));

    /**
     * Number of days since previous violation
     */
    const vNum =
      formInformation.disciplinaryReports !== undefined
        ? differenceInDays(
            new Date(),
            max(
              (
                formInformation.disciplinaryReports?.match(
                  /\b\d{4}-\d{2}-\d{2}\b/g,
                ) || []
              ).map((date) => new Date(date)),
            ) ?? new Date(),
          ).toString()
        : "N/A";

    const numOfFurloughs =
      parsedFormInformation.furloughs?.length?.toString() ?? "N/A";
    const numOfPrograms =
      parsedFormInformation.programEnrollment?.length?.toString() ?? "N/A";

    // CHECKBOXES
    const reclassType =
      usMeIncarcerationPastRelevantClassificationDate?.reclassType;
    const isAnnualReclass = reclassType === "ANNUAL";
    const isSemiannualReclass = reclassType === "SEMIANNUAL";
    const isWithProbation = formInformation.sentenceIncludesProbation === "YES";

    return {
      assignedStaffFullName,
      custodyLevel,
      externalId,
      facilityId,
      displayName,
      unitId,

      // DATE INFORMATION
      ...dateInputs,

      // FORM INFORMATION
      isAnnualReclass,
      isSemiannualReclass,
      isWithProbation,

      ...generateLines(
        "currentOffenses",
        5,
        parsedFormInformation.currentOffenses,
      ),
      ...generateLines(
        "programEnrollment",
        10,
        parsedFormInformation.workAssignments,
      ),
      ...generateLines(
        "workAssignments",
        4,
        parsedFormInformation.workAssignments,
      ),
      ...generateLines("furloughs", 3, parsedFormInformation.furloughs),
      ...generateLines(
        "casePlanGoals",
        10,
        parsedFormInformation.casePlanGoals,
      ),
      ...generateLines(
        "disciplinaryReports",
        4,
        parsedFormInformation.disciplinaryReports,
      ),
      ...generateLines("escapeHistory", 3, parsedFormInformation.escapeHistory),

      // CALCULATED FIELDS
      vNum,
      numOfFurloughs,
      numOfPrograms,
    };
  }
}
