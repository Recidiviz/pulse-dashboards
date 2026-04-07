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

import { WebFormFieldProps } from "../../WebFormField";

export const LSUFormFieldBaseProps = {
  pattern: "^[^~{}]+$",
  errorMessage: "Cannot contain ~ { or } characters",
};

export const LSUFormFields: WebFormFieldProps[] = [
  {
    name: "chargeDescriptions",
    label: "Crime(s)",
    helpText: {
      persistent: true,
      validationMsg: true,
      children: "Include interlock requirement for DUI cases",
    },
    textarea: true,
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
  {
    name: "substanceTest",
    label: "Last Substance Test Result & Date",
    textarea: true,
  },
  {
    name: "courtFinesAndRestitution",
    label: "Court fines and Restitution",
    textarea: true,
  },
  { name: "costOfSupervision", label: "Cost of Supervision", textarea: true },
  {
    name: "iletsReviewDate",
    label: "ILETS Review Date [note any protection orders or NCOs]",
    textarea: true,
  },
  {
    name: "courtOrderDate",
    label: "Date Court Order/Parole Contract last reviewed with client",
    textarea: true,
  },
  {
    name: "treatmentCompletionDate",
    label: "Treatment Completion Date",
    textarea: true,
  },
  {
    name: "specialConditionsCompletedDates",
    label: "Special Conditions Completed Date(s)",
    textarea: true,
  },
  {
    name: "pendingSpecialConditions",
    label: "Pending Special Conditions",
    textarea: true,
  },
  {
    name: "currentClientGoals",
    label: "Current Client Goal(s)",
    textarea: true,
  },
  {
    name: "clientSummary",
    label: "Client Summary/Other Information",
    textarea: true,
  },
];
