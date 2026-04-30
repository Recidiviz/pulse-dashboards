// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

// See the reference list in the backend here.
// apps/@reentry/backend/app/services/resources/__init__.py

import type { components } from "~@reentry/openapi-types";

type ResourceCategory = components["schemas"]["ResourceCategory"];
type ResourceSubcategory = components["schemas"]["ResourceSubcategory"];

export const CATEGORY_SUBCATEGORY_MAP: Record<
  ResourceCategory,
  ResourceSubcategory[]
> = {
  "Basic Needs": [
    "Financial assistance",
    "Food assistance",
    "Hygiene products",
    "Second hand clothing",
    "State ID, Driver's License",
  ],
  "Education & Vocational Training": [
    "College re-entry programs",
    "Digital literacy programs",
    "Financial literacy programs",
    "GED preparation and testing",
    "Literacy programs",
    "Vocational trade school programs",
  ],
  Employment: [
    "Job certification and licensing",
    "Job readiness training",
    "Second-chance employer",
    "Temporary staffing agency",
  ],
  "Family Reconnection & Parenting": [
    "Child protective services",
    "Family reunification services",
    "Family services",
    "Family therapy or counseling",
    "Parenting skills classes",
  ],
  Housing: [
    "Emergency housing and shelters",
    "Rental assistance",
    "Sober living and recovery program",
    "Subsidized housing or vouchers",
    "Transitional housing",
    "Youth housing",
  ],
  "Legal Aid & Rights Restoration": [
    "Child support assistance",
    "Criminal record expungement",
    "Legal aid",
    "Voting rights restoration",
    "Youth legal aid",
  ],
  "Mental Health": [
    "Anger management",
    "Crisis intervention services",
    "Domestic violence treatment",
    "Psychiatric care",
    "Therapy and counseling",
    "Trauma-informed care",
    "Youth mental health services",
  ],
  "Peer Support & Community Integration": [
    "Civic engagement",
    "Community center",
    "Faith-based support",
    "Mentorship programs",
    "Reentry support groups",
    "Volunteer opportunities",
    "Youth community programs",
  ],
  "Physical Health": [
    "Community clinic",
    "Emergency dental care",
    "HIV/AIDS and Hepatitis C services",
    "Medicaid enrollment assistance",
    "Prescription assistance",
    "Primary care",
    "Urgent care",
    "Veterans health care",
    "Youth health care",
  ],
  "Substance Use": [
    "Detoxification centers",
    "Inpatient drug treatment programs",
    "Intensive outpatient programs",
    "Medication-assisted treatment",
    "Substance use support",
    "Youth substance use support",
  ],
};

export const RADIUS_OPTIONS = [1, 5, 10, 25, 50, 100, 200] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];
