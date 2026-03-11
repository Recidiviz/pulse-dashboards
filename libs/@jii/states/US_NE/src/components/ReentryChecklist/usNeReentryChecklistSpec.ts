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

export type UsNeDocumentType =
  | "Medicaid Card"
  | "Birth Certificate"
  | "Driver's License"
  | "State ID"
  | "Social Security Card";

export type UsNeReentryChecklistItem = {
  id: string;
  documentTypes?: UsNeDocumentType[];
  // onlyVerifiedIfTrue uses the verified/controlled state only if the document exists.
  // e.g. "I have X or have applied for it."
  onlyVerifiableIfTrue?: boolean;
};

export type UsNeReentryChecklistSection = {
  id: string;
  items: UsNeReentryChecklistItem[];
};

export type UsNeReentryChecklistLayout = {
  sections: UsNeReentryChecklistSection[];
};

export const usNeReentryChecklistSpec: UsNeReentryChecklistLayout = {
  sections: [
    {
      id: "early",
      items: [
        {
          id: "birth-certificate",
          documentTypes: ["Birth Certificate"],
          onlyVerifiableIfTrue: true,
        },
        {
          id: "applied-medicaid",
          documentTypes: ["Medicaid Card"],
          onlyVerifiableIfTrue: true,
        },
        { id: "ged-diploma" },
        { id: "job-training" },
        { id: "skills-career-interests" },
        { id: "parenting-programs" },
        { id: "five-keys-interest" },
      ],
    },
    {
      id: "3-years",
      items: [
        { id: "career-programs" },
        { id: "mental-health-assessment" },
        { id: "parenting-programs-2yr" },
        { id: "clinical-program" },
      ],
    },
    {
      id: "6-months",
      items: [
        { id: "job-opportunities" },
        { id: "resume-portfolio" },
        { id: "safe-housing" },
        { id: "backup-housing" },
        { id: "reentry-circle" },
      ],
    },
    {
      id: "120-days",
      items: [
        { id: "social-security-card", documentTypes: ["Social Security Card"] },
        {
          id: "state-id-license",
          documentTypes: ["Driver's License", "State ID"],
        },
        { id: "birth-certificate-120", documentTypes: ["Birth Certificate"] },
        { id: "medicaid-120", documentTypes: ["Medicaid Card"] },
        { id: "medical-checkup" },
        { id: "continuation-care-plan" },
        { id: "medication-supply" },
        { id: "treatment-aftercare" },
        { id: "barriers-plan" },
        { id: "budget-plan" },
        { id: "legal-obligations" },
        { id: "parole-expectations" },
        { id: "supportive-person" },
        { id: "peer-support" },
        { id: "success-plan" },
        { id: "community-help" },
        { id: "transportation-plan" },
      ],
    },
  ],
};
