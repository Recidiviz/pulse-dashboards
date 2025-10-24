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

import { IntakeStateConfig } from "~@reentry/intake-agent/intake_configs/types";
import { Sections } from "~@reentry/prisma/types";

export const ROLE = `
Role: You are a social worker conducting a structured intake assessment with a new client who is currently in a prison facility and preparing for their release.
`;

// NOTE: when making changes to these sections, please also update the version number in US_UT_CONFIG below.
export const US_UT_SECTIONS: Sections = [
  {
    title: "Employment",
    description:
      "We'll discuss your current work situation and employment plans for after your release.",
    requiredInformation: `
      1. If the client is currently employed
          a. If yes:
              - What type of work they are doing
              - How many hours per week they are working
              - How they like their job and anyone they work with
          b. If no, and they are looking for work:
              - Were they working before entering the facility
              - What type of work were they doing before entering the facility
              - What type of work they are looking for after they are released
              - How many hours per week they are looking to work
              - Will they be returning the job they had before entering the facility
              - optional: Do they have any specific goals or aspirations for the work they are looking for
          c. If no, and they are not looking for work:
              - Are they receiving any social security or disability benefits
              - Or are they planning to be a homemaker
              - Or are they planning to go to school
    `,
  },
  {
    title: "Education",
    description:
      "Let's talk about your educational background and any plans you have for continuing your education.",
    requiredInformation: `
      1. If they are planning to go to school after release
          a. If yes:
              - What type of school they are planning to attend
              - What type of program they are planning to enroll in
              - How many hours per week they are planning to attend school
              - optional: Do they have any specific goals or aspirations for their education
      2. The client's highest level of education completed (such as high school, GED, college)
      3. If they have any degrees or certifications
      4. If they are currently enrolled in any courses or programs in the facility
    `,
  },
  {
    title: "Financial",
    description:
      "We'll review your financial situation and discuss your financial goals and plans.",
    requiredInformation: `
      1. Does the client plan to apply for any financial assistance after release
          a. If yes:
              - What type of financial assistance they are planning to apply for, such as food stamps or unemployment benefits
      2. If they have any specific goals for their finances
    `,
  },
  {
    title: "Family and Marital Relationships",
    description:
      "Let's discuss your family relationships and the support system you have available.",
    requiredInformation: `
      1. Does the client have a partner, spouse, or long-term partner
      2. Do they have strong, positive relationships with their parents
      3. Do they have strong, positive relationships with their other family members
    `,
  },
  {
    title: "Accommodation",
    description:
      "We'll talk about your housing situation before entering the facility and your plans for housing after release.",
    requiredInformation: `
      1. Do they have a place to stay immediately after release
      2. Where do they plan to live long-term after release, and is it the same as the place they lived before or the place they plan to stay immediately after release
      3. What are their goals related to housing after release
    `,
  },
  {
    title: "Leisure and Recreation",
    description:
      "Let's explore your hobbies, interests, and how you like to spend your free time.",
    requiredInformation: `
      1. What were their hobbies and interests before entering the facility
      2. Do you have any hobbies or activities that they enjoy doing while living in the facility
      3. Do they have any hobbies or interests that they would like to pursue after release
    `,
  },
  {
    title: "Companions",
    description:
      "We'll discuss your social connections and plans for maintaining positive relationships.",
    requiredInformation: `
      1. Do you have any close friends or companions that you plan to spend time with after release
      2. What they imagine their social life will look like after release
    `,
  },
  {
    title: "Alcohol and Drug Use",
    description:
      "This section covers substance use history and any support you might need for recovery.",
    requiredInformation: `
      1. Will you require any support or resources related to alcohol or drug use after release
        a. If yes:
            - What type of support they think would be helpful (like counseling, support groups, medical assistance)
            - Have they received treatment or support for substance use before
        b. If no:
            - Confirm they feel confident managing without additional support
      2. Ask this question even if the client seems reluctant - it's important for their safety and planning
    `,
  },
];

export const SECTION_TITLES = US_UT_SECTIONS.map((section) => section.title);

export const US_UT_CONFIG: IntakeStateConfig = {
  version: "v1",
  sections: US_UT_SECTIONS,
  sectionTitles: SECTION_TITLES,
  role: ROLE,
};
