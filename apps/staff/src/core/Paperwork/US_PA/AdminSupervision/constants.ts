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

import { UsPaAdminSupervisionDraftData } from "../../../../WorkflowsStore/Opportunity/UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionReferralRecord";

export type FormDataType = UsPaAdminSupervisionDraftData;

export const FORM_US_PA_ADMIN_SUPERVISION_FORM_FONT_FAMILY =
  "Calibri, Arial, sans-serif";

/**
 * Labels and field names for the client details section.
 */
export const ROW_INFO: {
  label: string;
  name: Extract<keyof FormDataType, string>;
}[] = [
  { label: "Reentrant Name (Last, First)", name: "reentrantName" },
  { label: "Parole No.:", name: "paroleNumber" },
  { label: "Date of Review:", name: "dateOfReview" },
  {
    label: "Current Grade of Supervision",
    name: "currentGradeOfSupervisionLevel",
  },
];

export type LabelInfo = {
  label: string;
  rowSpan: number;
  field?: keyof FormDataType;
};

export const INJURY_OFFENSE_LABEL_INFO: LabelInfo[] = [
  {
    label: "18 Pa. C.S. Ch. 25 relating to Crim. Homicide",
    rowSpan: 1,
    field: "offense18_25",
  },
  {
    label: "18 Pa. C.S. Ch. 27 rel. to Assault",
    rowSpan: 1,
    field: "offense18_27",
  },
  {
    label: "18 Pa. C.S. Ch. 29 rel. to Kidnapping",
    rowSpan: 1,
    field: "offense18_29",
  },
  {
    label: "18 Pa. C.S. Ch. 31 rel. to Sexual Assault",
    rowSpan: 1,
    field: "offense18_31",
  },
  {
    label: "18 Pa. C.S. Ch. 33 rel. to Arson",
    rowSpan: 1,
    field: "offense18_33",
  },
  {
    label: "18 Pa. C.S. Ch. 37 rel. to Robbery",
    rowSpan: 1,
    field: "offense18_37",
  },
  {
    label: "18 Pa. C.S. Ch. 49 rel. to Victim/Witness Intimidation",
    rowSpan: 2,
    field: "offense18_49",
  },
  {
    label: `30 Pa. C.S. 5502.1 Relating to Homicide by  watercraft under influence of alcohol or controlled substance or\n30 Pa. C.S. 5502.2 Relating to Homicide by  watercraft or\n30 Pa. C.S. 5502.3 Relating to Aggravated Assault by watercraft under influence of alcohol or controlled substance or\n30 Pa. C.S. 5502.4 Relating to Aggravated Assault  by watercraft`,
    rowSpan: 10,
    field: "offense30_5502",
  },
  {
    label:
      "Former 75 Pa. C.s. 3731 relating to DUI/Controlled Substance in cases involving bodily injury",
    rowSpan: 3,
    field: "offense75_3731",
  },
  {
    label: "75 Pa.C.S. 3732 Relating to Homicide by Vehicle",
    rowSpan: 1,
    field: "offense75_3732",
  },
  {
    label: "75 Pa.C.S. 3735 Relating to Homicide by Vehicle while DUI",
    rowSpan: 2,
    field: "offense75_3735",
  },
  {
    label: "75 Pa.C.s. 3735.1 Relating to Agg Assault by Vehicle while DUI",
    rowSpan: 3,
    field: "offense75_3735_1",
  },
  {
    label:
      "75 Pa.C.S. 3742 Relating to accidents involving death or personal injury",
    rowSpan: 2,
    field: "offense75_3742",
  },
  {
    label:
      "75 Pa.C.S Ch. 38 Relating to driving after imbibing  alcohol or utilizing drugs in cases of bodily injury.",
    rowSpan: 3,
    field: "offense75_38",
  },
  {
    label: "Named in a PFA Order (or history of PFAs)",
    rowSpan: 1,
    field: "offensePFAOrder",
  },
];

export const OTHER_OFFENSE_LABEL_INFO: LabelInfo[] = [
  { label: "18 Pa. C.S. 4302 Incest", rowSpan: 1, field: "offense18_4302" },
  {
    label: "18 Pa. C.S. 5901 Open Lewdness",
    rowSpan: 1,
    field: "offense18_5901",
  },
  {
    label: "18 Pa. C.S. 5902(b) Prostitution",
    rowSpan: 1,
    field: "offense18_5902b",
  },
  {
    label:
      "18 Pa. C.S. 5903(4)(5)(6) obscene/sexual material/performance where the victim is minor",
    rowSpan: 2,
    field: "offense18_5903",
  },
  {
    label: "18 Pa. C.S. Ch. 76 Internet Child Pornography",
    rowSpan: 1,
    field: "offense18_76",
  },
  {
    label: "42 Pa. C.S. §§ 9799.14, 9799.55 Megan’s Law Registration",
    rowSpan: 2,
    field: "offense42_9799",
  },
  {
    label: "18 Pa. C.S. 6312 Sexual Abuse of Children",
    rowSpan: 1,
    field: "offense18_6312",
  },
  {
    label: "18 Pa. C.S. 6318 Unlawful Contact with Minor",
    rowSpan: 1,
    field: "offense18_6318",
  },
  {
    label: "18 Pa. C.S. 6320 Sexual Abuse of Children",
    rowSpan: 1,
    field: "offense18_6320",
  },
  {
    label:
      "Any crime of violence defined in 42 Pa.C.S. §  9714(g), or any attempt, conspiracy or solicitation  to commit a crime of violence defined in 42  Pa.C.S. § 9714(g), including any equivalent crime committed in another jurisdiction.",
    rowSpan: 6,
    field: "offenseConspiracyToCommitCrime",
  },
  {
    label: "18 Pa. C.S. Firearms or Dangerous Articles",
    rowSpan: 1,
    field: "offenseFirearms",
  },
  {
    label:
      "35 P.s. 780-113 13(a)(14)(30)(37) controlled substance Law AND was sentenced under 18 PA. C.S. 7508(a)(1)(iii), (2)(iii), (3)(iii), (4)(iii), (7)(iii), or (8)(iii) (relating to drug trafficking sentencing)",
    rowSpan: 5,
    field: "offenseControlledSubstance",
  },
  {
    label: "204 PA Code 303.10(a) Deadly Weapon Enhancement",
    rowSpan: 2,
    field: "offense204_303",
  },
  {
    label: "Designated as sexually violent predator",
    rowSpan: 1,
    field: "offenseSexuallyViolentPredator",
  },
  {
    label: "42 Pa. C.S. 9712 Firearm Enhancement",
    rowSpan: 1,
    field: "offense42_9712",
  },
  {
    label: "An attempt or conspiracy to commit a personal injury crime",
    rowSpan: 2,
    field: "offensePersonalInjury",
  },
  {
    label: "Enhanced Supervision Level within the past 12  months",
    rowSpan: 2,
    field: "enhancedSupervisionLevelPast12Months",
  },
  {
    label: "Maximum Supervision Level within the past 12  months",
    rowSpan: 2,
    field: "maximumSupervisionLevelPast12Months",
  },
];

export const CRITERIA_LABELS: LabelInfo[] = [
  {
    label: "Incurred a high sanction within the past year",
    rowSpan: 1,
    field: "criteriaHighSanction",
  },
  {
    label: "Fulfilled treatment requirements",
    rowSpan: 1,
    field: "criteriaFulfilledTreatmentRequirements",
  },
  {
    label: "Fulfilled special conditions",
    rowSpan: 1,
    field: "criteriaFulfilledSpecialConditions",
  },
  {
    label: "Making efforts to reduce financial obligations",
    rowSpan: 1,
    field: "criteriaFinancialEfforts",
  },
];

export const GRID_ROW_COUNT = 33;

export const GRAY_BACKGROUND = "#353535";
export const BLUE_BACKGROUND = "#d8e6fc";

export const strings = {
  instructions: `Instructions: Review current offenses and criminal history for crimes which would disqualify the reentrant for administrative parole. Any conviction and/or delinquent adjudication for offenses listed below will preclude assignment to Administrative Parole.`,
  continueHeader: `If any "YES" is checked above, then the reentrant is not eligible for Administrative Parole. If "NONE", continue with the below questionnaire.`,
  dispositionHeader: `Are there any unreported dispositions in the reentrant's criminal history for any of the above listed personal injury crimes/other offenses? (Note date/offense below)`,
  eligibilityHeader: `Eligible for Administrative Parole?`,
  dispositionNotes: `List unreported disposition information:`,
  agentSignature: `Agent Signature`,
  agentName: `Agent Name (Printed)`,
  footer: `DC-P 402 | rvsd. 04.2025`,
  addendumFooter: `DC-P 402A | rvsd. 01.2024`,
} as const;

export const worksheetSectionsCopy: {
  sectionNumber: number;
  headerText: string;
  checklist: { label: string; field: keyof FormDataType }[];
  footerText?: string;
  footerAddendum?: string[];
}[] = [
  {
    sectionNumber: 1,
    headerText: `Use this sheet if the PA rap sheet, out-of-state criminal history, and/or "Offense History and Pattern" section of the ICSA shows a drug offense for which the reentrant was charged as an adult and:`,
    checklist: [
      {
        label: `The reentrant was found guilty on a PA drug charge (continue to section 2) or`,
        field: "guiltyPADrugCharge",
      },
      {
        label: `No disposition was reported on a PA drug charge (continue to section 2) or`,
        field: "noDispositionPADrugCharge",
      },
      {
        label: `The reentrant was found guilty on an out-of-state drug charge (skip to section 4) or`,
        field: "guiltyOOSDrugCharge",
      },
      {
        label: `No disposition was reported on an out-of-state drug charge (skip to section 4) or`,
        field: "noDispositionOOSDrugCharge",
      },
    ],
    footerText: `If none of these boxes are checked, then drug charges do not preclude the reentrant's eligibility.`,
  },
  {
    sectionNumber: 2,
    headerText: `For in-state offenses, the AOPC UJS Portal shows that the reentrant was charged with:`,
    checklist: [
      {
        label: `35 P.S. 780-113 (14) - Delivery by practitioner (continue to section 3)`,
        field: "charge780_11314",
      },
      {
        label: `35 P.S. 780-113 (30) - Possession with intent to deliver (continue to section 3)`,
        field: "charge780_11330",
      },
      {
        label: `35 P.S. 780-113 (37) - Possession> 30 Doses related to steroids (continue to section 3)`,
        field: "charge780_11337",
      },
    ],
    footerText: `If none of these boxes are checked, then the PA drug charges do not preclude the reentrant's eligibility.`,
    footerAddendum: [
      `If one or more boxes are checked, continue to section 3.`,
      `If there are out-of-state drug charges, then skip to section 4.`,
    ],
  },
  {
    sectionNumber: 3,
    headerText: `The reentrant is ineligible for administrative parole if the disposition shows that the reentrant was found guilty on one of the drug offenses in section 2 and at least one of the following sentencing enhancements were included in the disposition:`,
    checklist: [
      {
        label: `18PA. C.S. 7508(a)1 (iii) - marijuana ≥ 50 Ibs or 51 plants; min 5 years, $50,000`,
        field: "offense7508_a1",
      },
      {
        label: `18PA. C.S. 7508(a)2(iii) - narcotic ≥ 100 grams; min 5 years, $25,000`,
        field: "offense7508_a2",
      },
      {
        label: `18PA. C.S. 7508(a)3(iii) - cocoa leaves ≥ 100 grams; min 4 years, $25,000`,
        field: "offense7508_a3",
      },
      {
        label: `18PA. C.S. 7508(a)4(iii) - methamphetamine ≥ 100 grams; min 5 years, $50,000`,
        field: "offense7508_a4",
      },
      {
        label: `18PA. C.S. 7508(a)7(iii) - heroin ≥ 50 grams; min 5 years, $25,000`,
        field: "offense7508_a7",
      },
      {
        label: `18PA. C.S. 7508(a)8(iii) - MDA, MDMA, MMDA ≥ 1,000 tablets or 300 grams; max 15 years, $250,000`,
        field: "offense7508_a8",
      },
      {
        label: `61PA. C.S. 4103(7) - Fentanyl or a mixture containing Fentanyl ≥ 10 grams.`,
        field: "offense4103_7",
      },
      {
        label: `61PA. C.S. 4103(8) - Carfentanil or a mixture containing carfentanil ≥ 1 gram.`,
        field: "offense4103_8",
      },
    ],
    footerText: `If none of these boxes are checked, then the PA drug charges do not preclude the reentrant's eligibility. Continue to section 4 if the reentrant also has out-of-state drug charges.`,
  },
  {
    sectionNumber: 4,
    headerText: `For out-of-state drug offenses in which the reentrant was found guilty or the disposition was unreported, the reentrant shall not be placed on administrative supervision unless:`,
    checklist: [
      {
        label: `ICOTS records are reviewed to gather all available information about the offense(s) in question; and`,
        field: "reviewICOTSRecords",
      },
      {
        label: `The records clearly show that the drug offense(s) is (are) not delivery-related; or`,
        field: "notDeliveryRelated",
      },
      {
        label: `Unclear records are resolved according to procedure.`,
        field: "unclearRecords",
      },
    ],
  },
];
