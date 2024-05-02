/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2024 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatWorkflowsDate } from "../../../utils";
import { usMiSecurityClassificationCommitteeReviewOpportunity } from "../UsMi/UsMiSecurityClassificationCommitteeReviewOpportunity";
import { FormBase } from "./FormBase";

export type UsMiSCCReviewDraftData = {
  // Data-populated fields
  prisonerNumber: string;
  prisonerName: string;
  ERD: string;
  AMX: string;
  facility: string;
  lock: string;
  OPT: boolean;
  STG1: boolean;
  STG2: boolean;
  adminSeg: boolean;
  punSeg: boolean;
  tempSeg: boolean;
  adminSegDate: string;
  punSegDate: string;
  tempSegDate: string;
  bondableOffensesWithin6Months: string;
  nonbondableOffensesWithin1Year: string;
  adSegDate1: string;
  adSegDate2: string;
  adSegDate3: string;
  adSegDate4: string;
  adSegReason1: string;
  adSegReason2: string;
  adSegReason3: string;
  adSegReason4: string;

  // General info fields
  reviewType: string;
  segReason: string;

  // Resident history fields
  reportsSinceReview: string;
  segNature: string;
  DD: boolean;
  CMO: boolean;
  ADD: boolean;
  NA: boolean;
  lastWardenInterview: boolean;
  lastADDInterview: boolean;

  // Team evaluation fields
  IISPNA: boolean;
  IISP1: boolean;
  IISP2: boolean;
  IISP3: boolean;
  IISP4: boolean;
  IISP5: boolean;
  IISP6: boolean;
  amOfficer: string;
  pmOfficer: string;
  never1: boolean;
  never2: boolean;
  never3: boolean;
  never4: boolean;
  rarely1: boolean;
  rarely2: boolean;
  rarely3: boolean;
  rarely4: boolean;
  sometimes1: boolean;
  sometimes2: boolean;
  sometimes3: boolean;
  sometimes4: boolean;
  regularly1: boolean;
  regularly2: boolean;
  regularly3: boolean;
  regularly4: boolean;
  good1: boolean;
  good2: boolean;
  adequate1: boolean;
  adequate2: boolean;
  poor1: boolean;
  poor2: boolean;
  pcName: string;

  // SCC fields
  participated: boolean;
  whyNot: string;
  sccStop: boolean;
  comment: string;
  misconductFree: boolean;
  IISP: boolean;
  other: boolean;
  otherText: string;
  potential: string;
  continue: boolean;
  reclassify: boolean;
  transfer: boolean;
  protection: boolean;
  reason: string;
  staffName1: string;
  staffName2: string;
  QMHP: string;

  // Miscellaneous footer fields
  wardenApproval: boolean;
  wardenInterview: boolean;
  addInterview: boolean;
  residentDist: boolean;
  counselorDist: boolean;
  recordDist: boolean;
  centralDist: boolean;
  addDist: boolean;
};

export class UsMiSCCReviewForm extends FormBase<
  UsMiSCCReviewDraftData,
  usMiSecurityClassificationCommitteeReviewOpportunity
> {
  navigateToFormText = "Automate 283 Form";

  // eslint-disable-next-line class-methods-use-this
  get formContents(): OpportunityFormComponentName {
    return "FormUsMiSCCReview";
  }

  prefilledDataTransformer(): Partial<UsMiSCCReviewDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const { externalId: prisonerNumber } = this.person;

    const {
      minReleaseDate,
      maxReleaseDate,
      facility,
      lock,
      OPT,
      STG,
      segregationType,
      segregationClassificationDate,
      bondableOffensesWithin6Months,
      nonbondableOffensesWithin1Year,
      adSegStaysAndReasonsWithin3Years,
      prisonerName,
    } = this.opportunity.record.formInformation;

    // Parse the string array representing prior RH stays - each entry has the format:
    // "(startDate,reason1,reason2,etc,)"
    adSegStaysAndReasonsWithin3Years?.sort().reverse();
    const adSegStays = adSegStaysAndReasonsWithin3Years?.map((segStr) => {
      segStr = segStr.replace("(", "").replace(")", "");
      const splitVals = segStr.split(/,(.*)/, 2);
      return { date: splitVals[0], reasons: splitVals[1] };
    });

    const adminSeg = segregationType === "ADMINISTRATIVE_SOLITARY_CONFINEMENT";
    const punSeg = segregationType === "DISCIPLINARY_SOLITARY_CONFINEMENT";
    const tempSeg = segregationType === "TEMPORARY_SOLITARY_CONFINEMENT";

    const formattedSegDate = segregationClassificationDate
      ? formatWorkflowsDate(segregationClassificationDate)
      : "";

    return {
      prisonerName,
      prisonerNumber,
      ERD: minReleaseDate ? formatWorkflowsDate(minReleaseDate) : "",
      AMX: maxReleaseDate ? formatWorkflowsDate(maxReleaseDate) : "",
      facility,
      lock,
      OPT,
      STG1: STG === "1",
      STG2: STG === "2",
      adminSeg: segregationType === "ADMINISTRATIVE_SOLITARY_CONFINEMENT",
      punSeg: segregationType === "DISCIPLINARY_SOLITARY_CONFINEMENT",
      tempSeg: segregationType === "TEMPORARY_SOLITARY_CONFINEMENT",
      adminSegDate: adminSeg ? formattedSegDate : "",
      punSegDate: punSeg ? formattedSegDate : "",
      tempSegDate: tempSeg ? formattedSegDate : "",
      bondableOffensesWithin6Months: bondableOffensesWithin6Months ?? "",
      nonbondableOffensesWithin1Year: nonbondableOffensesWithin1Year ?? "",
      adSegDate1: adSegStays?.at(0)?.date,
      adSegReason1: adSegStays?.at(0)?.reasons,
      adSegDate2: adSegStays?.at(1)?.date,
      adSegReason2: adSegStays?.at(1)?.reasons,
      adSegDate3: adSegStays?.at(2)?.date,
      adSegReason3: adSegStays?.at(2)?.reasons,
      adSegDate4: adSegStays?.at(3)?.date,
      adSegReason4: adSegStays?.at(3)?.reasons,
    };
  }
}
