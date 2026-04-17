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

import type { ResourceBankResponse } from "../../app/hooks/resourceBank.types";

export const mockResourceBank: ResourceBankResponse = {
  resources_by_sections: [
    {
      title: "Housing Stability",
      resources: [
        {
          id: "res-housing-001",
          name: "City Emergency Shelter",
          category: "Housing",
          subcategory: "Emergency housing and shelters",
          phone: "555-100-0001",
          address: "100 Main St, Springfield",
          description: "Emergency and transitional housing for adults.",
          origin: "GOOGLE",
          travel_distance_miles: 3.2,
        },
        {
          id: "res-housing-002",
          name: "Statewide Housing Voucher Program",
          category: "Housing",
          subcategory: "Subsidized housing or vouchers",
          phone: "555-100-0002",
          website: "https://example.gov/housing",
          description: "State-administered housing voucher program.",
          origin: "PARTNER",
        },
        {
          id: "res-housing-003",
          name: "National Reentry Housing Network",
          category: "Housing",
          subcategory: "Transitional housing",
          description:
            "Online directory of reentry-friendly transitional housing.",
          website: "https://example.org/reentry-housing",
          origin: "PARTNER",
        },
        {
          id: "res-housing-004",
          name: "Rural Rental Assistance Initiative",
          category: "Housing",
          subcategory: "Rental assistance",
          address: "999 Far Rd, Outskirts",
          description: "Rental assistance for clients in rural counties.",
          origin: "GOOGLE",
          travel_distance_miles: 67.4, // > 50 edge case
        },
      ],
    },
    {
      title: "Employment Readiness",
      resources: [
        {
          id: "res-employment-001",
          name: "Second Chance Staffing",
          category: "Employment",
          subcategory: "Second-chance employer",
          phone: "555-200-0001",
          address: "200 Work Ave, Springfield",
          description: "Employer network committed to fair-chance hiring.",
          origin: "GOOGLE",
          travel_distance_miles: 5.0,
        },
        {
          id: "res-employment-002",
          name: "Online Trade Certification Portal",
          category: "Employment",
          subcategory: "Job certification and licensing",
          website: "https://example.org/job-skills",
          description:
            "Free online certification courses for in-demand trades.",
          origin: "PARTNER",
        },
      ],
    },
    {
      title: "Financial Stability",
      resources: [
        {
          id: "res-financial-001",
          name: "County SNAP & Cash Aid Office",
          category: "Basic Needs",
          subcategory: "Financial assistance",
          phone: "555-400-0001",
          address: "400 Civic Plaza, Springfield",
          description: "Apply in person for SNAP, cash aid, and Medicaid.",
          origin: "GOOGLE",
          travel_distance_miles: 1.8,
        },
        {
          id: "res-financial-002",
          name: "Community Financial Counseling",
          category: "Basic Needs",
          subcategory: "Financial assistance",
          phone: "555-400-0002",
          address: "410 Elm St, Springfield",
          description:
            "Free one-on-one budgeting workshops and credit coaching.",
          origin: "GOOGLE",
          travel_distance_miles: 2.4,
        },
      ],
    },
    {
      title: "Healthcare Access",
      resources: [
        {
          id: "res-health-001",
          name: "Community Health Clinic",
          category: "Physical Health",
          subcategory: "Primary care",
          phone: "555-500-0001",
          address: "500 Wellness Blvd, Springfield",
          description:
            "Sliding-scale primary care, dental, and vision services.",
          origin: "GOOGLE",
          travel_distance_miles: 2.1,
        },
        {
          id: "res-health-002",
          name: "Medicaid Enrollment Portal",
          category: "Physical Health",
          subcategory: "Medicaid enrollment assistance",
          website: "https://example.gov/medicaid",
          description: "Online Medicaid application for eligible residents.",
          origin: "PARTNER",
        },
      ],
    },
  ],
};
