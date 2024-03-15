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
