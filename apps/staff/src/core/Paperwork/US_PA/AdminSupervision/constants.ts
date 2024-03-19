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
 *
 * This file contains constants and strings for the PA Admin supervision form.
 */
import { UsPaAdminSupervisionDraftData } from "../../../../WorkflowsStore/Opportunity/UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionReferralRecord";

export const FORM_US_PA_ADMIN_SUPERVISION_FORM_FONT_FAMILY =
  "Calibri, Arial, sans-serif";

export const INSTRUCTIONS = `Instructions: Review current offenses and criminal history for crimes which would disqualify reentrant for administrative parole. `;
export const INSTRUCTIONS_RED = `Any conviction (and/or delinquent adjudication for offenses designated with an asterisk *) will preclude assignment to Administrative Parole.`;

/**
 * Labels and field names for the client details section.
 */
export const ROW_INFO: {
  label: string;
  name: Extract<keyof UsPaAdminSupervisionDraftData, string>;
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
};

export const INJURY_OFFENSE_LABEL_INFO: LabelInfo[] = [
  { label: "18 Pa. C.S. Ch. 25 relating to Crim. Homicide", rowSpan: 1 },
  { label: "18 Pa. C.S. Ch. 27 rel. to Assault", rowSpan: 1 },
  { label: "18 Pa. C.S. Ch. 29 rel. to Kidnapping", rowSpan: 1 },
  { label: "18 Pa. C.S. Ch. 31 rel. to Sexual Assault", rowSpan: 1 },
  { label: "18 Pa. C.S. Ch. 33 rel. to Arson", rowSpan: 1 },
  { label: "18 Pa. C.S. Ch. 37 rel. to Robbery", rowSpan: 1 },
  {
    label: "18 Pa. C.S. Ch. 49 rel. to Victim/Witness Intimidation",
    rowSpan: 2,
  },
  {
    label:
      "30 Pa. C.S. 5502.1 Relating to Homicide by watercraft under influence of alcohol or controlled substance",
    rowSpan: 3,
  },
  {
    label:
      "Former 75 Pa. C.s. 3731 relating to DUI/Controlled Substance in cases involving bodily injury",
    rowSpan: 3,
  },
  { label: "75 Pa.C.S. 3732 Relating to Homicide by Vehicle", rowSpan: 1 },
  {
    label: "75 Pa.C.S. 3735 Relating to Homicide by Vehicle while DUI",
    rowSpan: 2,
  },
  {
    label: "75 Pa.C.s. 3735.1 Relating to Agg Assault by Vehicle while DUI",
    rowSpan: 3,
  },
  {
    label:
      "75 Pa.C.S. 3742 Relating to accidents involving death or personal injury",
    rowSpan: 2,
  },
  {
    label: "An attempt or conspiracy to commit a personal injury crime*",
    rowSpan: 2,
  },
  { label: "Named in a PFA Order (or history of PFAs)", rowSpan: 1 },
];

export const OTHER_OFFENSE_LABEL_INFO: LabelInfo[] = [
  { label: "18 Pa. C.S. 4302 Incest*", rowSpan: 1 },
  { label: "18 Pa. C.S. 5901 Open Lewdness*", rowSpan: 1 },
  { label: "18 Pa. C.S. 5902(b) Prostitution", rowSpan: 1 },
  {
    label:
      "18 Pa. C.S. 5903(4)(5)(6) obscene/sexual material/performance where the victim is minor",
    rowSpan: 2,
  },
  { label: "18 Pa. C.S. Ch. 76 Internet Child Pornography*", rowSpan: 1 },
  { label: "42 Pa. C.S. 9795.1 Megan’s Law Registration", rowSpan: 1 },
  { label: "18 Pa. C.S. 6312 Sexual Abuse of Children", rowSpan: 1 },
  { label: "18 Pa. C.S. 6318 Unlawful Contact with Minor*", rowSpan: 1 },
  { label: "18 Pa. C.S. 6320 Sexual Abuse of Children*", rowSpan: 1 },
  { label: "42 Pa. C.S. 9712 Firearm Enhancement", rowSpan: 1 },
  { label: "18 Pa. C.S. Firearms or Dangerous Articles", rowSpan: 1 },
  {
    label:
      "35 P.s. 780-113 13(a)(14)(30)(37) controlled substance Law AND was sentenced under 18 PA. C.S. 7508(a)(1)(iii), (2)(iii), (3)(iii), (4)(iii), (7)(iii), or (8)(iii) (relating to drug trafficking sentencing)",
    rowSpan: 5,
  },
  { label: "204 PA Code 303.10(a) Deadly Weapon Enhancement", rowSpan: 2 },
  { label: "Designated as sexually violent predator", rowSpan: 1 },
  // The following are filler rows to match the PA form layout.
  { label: "", rowSpan: 1 },
  { label: "", rowSpan: 1 },
  { label: "", rowSpan: 1 },
  { label: "", rowSpan: 1 },
  { label: "", rowSpan: 1 },
];

export const GRID_ROW_COUNT = 27;
