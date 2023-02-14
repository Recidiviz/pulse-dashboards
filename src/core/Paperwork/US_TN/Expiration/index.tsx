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

import { WebFormFieldProps } from "../../WebFormField";

export const UsTnExpirationFormFieldBaseProps = {
  pattern: "[^~`]+$",
  errorMessage: "Cannot contain ~ or ` characters",
};

export const UsTnExpirationFormFields: WebFormFieldProps[] = [
  {
    name: "expirationDate",
    label: "Expiration date",
  },
  {
    name: "convictionCounties",
    label: "Counties",
  },
  {
    name: "docketNumbers",
    label: "Case number(s)",
  },
  {
    name: "currentOffenses",
    label: "Charges",
  },
  {
    name: "sexOffenseInformation",
    label: "Sex offense history",
    textarea: true,
  },
  {
    name: "alcoholDrugInformation",
    label: "Alcohol use / drug history",
    textarea: true,
  },
  {
    name: "employmentInformation",
    label: "Employment history",
    textarea: true,
  },
  {
    name: "feeHistory",
    label: "Fee history",
    textarea: true,
  },
  {
    name: "specialConditions",
    label: "Special conditions",
    textarea: true,
  },
  {
    name: "revocationHearings",
    label: "Revocation hearings",
    textarea: true,
  },
  {
    name: "newOffenses",
    label: "New misdemeanor or felony offenses while on supervision",
    textarea: true,
  },
  {
    name: "historyOfPriorViolenceEtc",
    label: "History of prior violence, escape, bond jumping, etc.",
    textarea: true,
  },
  {
    name: "transferHistory",
    label: "Transfer information",
    textarea: true,
  },
  {
    name: "medicalPsychologicalHistory",
    label: "Medical or psychological history",
    textarea: true,
  },
  {
    name: "victimInformation",
    label: "Victim's name and any concerns for future contact",
    textarea: true,
  },
  { name: "gangAffiliation", label: "Gang affiliation" },
  {
    name: "votersRightsInformation",
    label: "Voter rights restoration",
  },
  { name: "address", label: "Last Known Address" },
  {
    name: "additionalNotes",
    label: "Additional notes (Optional)",
    textarea: true,
  },
];
