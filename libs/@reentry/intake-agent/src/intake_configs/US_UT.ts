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

/**
 * [READ ME]: when making changes to these sections, please also update the version number in US_UT_CONFIG below.
 */
export const US_UT_SECTIONS: Sections = [
  {
    title: "Employment",
    description: "Your employment history and goals",
    requiredInformation: `
      1. If the client is currently employed
          a. If yes:
              i. What type of work they are doing
              ii. How many hours per week they are working
              iii. How they like their job and anyone they work with
      2. If the client is planning to work after release
          a. If yes:
              i. Were they working before entering the facility
              ii. What type of work were they doing before entering the facility
              iii. What type of work they are looking for after they are released
              iv. How many hours per week they are looking to work
              v. Will they be returning the job they had before entering the facility
              vi. Do they have any specific goals or aspirations for the work they are looking for
          b. If no:
              i. Are they receiving any social security or disability benefits
              ii. Or are they planning to be a homemaker
              iii. Or are they planning to go to school
    `,
  },
  {
    title: "Education",
    description: "Your education history and goals",
    requiredInformation: `
      1. If they are planning to go to school after release
          a. If yes:
            i. What type of school they are planning to attend
            ii. What type of program they are planning to enroll in
            iii. How many hours per week they are planning to attend school
            iv. Do they have any specific goals or aspirations for their education
      2. The client's highest level of education completed (such as high school, GED, college)
      3. If they have any degrees or certifications
      4. If they are currently enrolled in any courses or programs in the facility
    `,
  },
  {
    title: "Financial",
    description: "Your financial history and goals",
    requiredInformation: `
      1. Does the client plan to apply for any financial assistance after release
          a. If yes:
             i. What type of financial assistance they are planning to apply for, such as food stamps or unemployment benefits
      2. If they have any specific goals for their finances
    `,
  },
  {
    title: "Family and Marital Relationships",
    description: "Your family relationships",
    requiredInformation: `
      1. Does the client have a partner, spouse, or long-term partner
      2. Do they have strong, positive relationships with their parents
      3. Do they have strong, positive relationships with their other family members
    `,
  },
  {
    title: "Housing",
    description: "Your short term housing plan and long term goals",
    requiredInformation: `
      1. Where did they live before entering the facility
      2. Do they have a place to stay immediately after release
      3. Where do they plan to live long-term after release, and is it the same as the place they lived before or the place they plan to stay immediately after release
      4. What are their goals related to housing after release
    `,
  },
  {
    title: "Leisure and Recreation",
    description: "How you like to spend your free time",
    requiredInformation: `
      1. What were their hobbies and interests before entering the facility
      2. Do they have any hobbies or activities that they enjoy doing in the facility
      3. Do they have any hobbies or interests that they would like to pursue after release
    `,
  },
  {
    title: "Companions",
    description: "The status of your friendships and community",
    requiredInformation: `
      1. Do they have any close friends or companions that they plan to spend time with after release
      2. What they imagine their social life will look like after release
    `,
  },
  {
    title: "Alcohol and Drug Use",
    description: "Your relationship with alcohol and drugs",
    requiredInformation: `
      1. Will they require any support or resources related to alcohol or drug use after release
    `,
  },
];

export const SECTION_TITLES = US_UT_SECTIONS.map((section) => section.title);

export const US_UT_CONFIG: IntakeStateConfig = {
  version: "v0.11",
  sections: US_UT_SECTIONS,
  sectionTitles: SECTION_TITLES,
  role: ROLE,
};
