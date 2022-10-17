// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { WebFormFieldWrapperProps } from "../../WebFormField";

export const LSUFormFieldBaseProps = {
  pattern: "^[^~{}]+$",
  errorMessage: "Cannot contain ~ { or } characters",
};

export const LSUFormFields: WebFormFieldWrapperProps[] = [
  {
    name: "chargeDescriptions",
    label: "Crime(s)",
    helpText: {
      persistent: true,
      validationMsg: true,
      children: "Include interlock requirement for DUI cases",
    },
  },
  {
    name: "contactInformation",
    label: "Home Address/Phone/E-mail Address",
    textarea: true,
  },
  {
    name: "assessmentInformation",
    label: "Assessment Score and Date",
    textarea: true,
  },
  { name: "employmentInformation", label: "Employment", textarea: true },
  { name: "substanceTest", label: "Last Substance Test Result & Date" },
  { name: "courtFinesAndRestitution", label: "Court fines and Restitution" },
  { name: "costOfSupervision", label: "Cost of Supervision" },
  {
    name: "iletsReviewDate",
    label: "ILETS Review Date",
    helpText: {
      persistent: true,
      validationMsg: true,
      children: "Note any protection orders or NCOs",
    },
  },
  {
    name: "courtOrderDate",
    label: "Date Court Order/Parole Contract last reviewed with client",
  },
  { name: "treatmentCompletionDate", label: "Treatment Completion Date" },
  {
    name: "specialConditionsCompletedDates",
    label: "Special Conditions Completed Date(s)",
  },
  { name: "pendingSpecialConditions", label: "Pending Special Conditions" },
  {
    name: "currentClientGoals",
    label: "Current Client Goal(s)",
    textarea: true,
  },
  { name: "clientSummary", label: "Client Summary/Other Information" },
];
