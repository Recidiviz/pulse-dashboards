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

export const CATEGORY_SUBCATEGORY_MAP: Record<string, string[]> = {
  Housing: [
    "Emergency housing and shelters",
    "Transitional housing",
    "Sober living and recovery program",
    "Rental assistance",
    "Subsidized housing or vouchers",
    "Youth housing",
  ],
  Employment: [
    "Second-chance employer",
    "Temporary staffing agency",
    "Job readiness training",
    "Job certification and licensing",
  ],
  "Basic Needs": [
    "Food assistance",
    "Hygiene products",
    "Second hand clothing",
    "State ID, Driver's License",
    "Financial assistance",
  ],
  "Mental Health": [
    "Therapy and counseling",
    "Psychiatric care",
    "Trauma-informed care",
    "Crisis intervention services",
    "Anger management",
    "Domestic violence treatment",
    "Youth mental health services",
  ],
  "Substance Use": [
    "Detoxification centers",
    "Inpatient drug treatment programs",
    "Intensive outpatient programs",
    "Medication-assisted treatment",
    "Substance use support",
    "Youth substance use support",
  ],
  "Physical Health": [
    "HIV/AIDS and Hepatitis C services",
    "Medicaid enrollment assistance",
    "Community clinic",
    "Urgent care",
    "Prescription assistance",
    "Emergency dental care",
    "Youth health care",
    "Primary care",
    "Veterans health care",
  ],
  "Legal Aid & Rights Restoration": [
    "Criminal record expungement",
    "Child support assistance",
    "Voting rights restoration",
    "Legal aid",
    "Youth legal aid",
  ],
  "Education & Vocational Training": [
    "GED preparation and testing",
    "Vocational trade school programs",
    "College re-entry programs",
    "Literacy programs",
    "Digital literacy programs",
    "Financial literacy programs",
  ],
  "Family Reconnection & Parenting": [
    "Family therapy or counseling",
    "Parenting skills classes",
    "Family services",
    "Family reunification services",
    "Child protective services",
  ],
  "Peer Support & Community Integration": [
    "Mentorship programs",
    "Faith-based support",
    "Reentry support groups",
    "Community center",
    "Volunteer opportunities",
    "Civic engagement",
    "Youth community programs",
  ],
};

export const RADIUS_OPTIONS: number[] = [1, 5, 10, 25, 50, 100, 200];
