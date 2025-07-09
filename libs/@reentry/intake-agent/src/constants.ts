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

export type SectionType = {
  title: string;
  requiredInformation: string;
};

export const LSIR_SECTIONS: SectionType[] = [
  {
    title: "Employment",
    requiredInformation: `
      1. If the client is currently employed
         a. If yes:
            - What type of work they are doing
            - How many hours per week they are working
            - How they like their job and anyone they work with
      2. If the client is planning to work after release
          a. If yes:
              - What type of work they want to pursue
              - Were they working before entering the facility
              - What type of work were they doing before entering the facility
              - What type of work they are looking for after they are released
              - How many hours per week they are looking to work
              - Will they be returning the job they had before entering the facility
              - Do they have any specific goals or aspirations for the work they are looking for
          b. If no:
            - Are they receiving any social security or disability benefits
            - Or are they planning to be a homemaker
            - Or are they planning to go to school
    `,
  },
  {
    title: "Education",
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
    requiredInformation: `
      1. Does the client plan to apply for any financial assistance after release
         a. If yes:
            - What type of financial assistance they are planning to apply for, such as food stamps or unemployment benefits
      2. If they have any specific goals for their finances
    `,
  },
  {
    title: "Family and Marital Relationships",
    requiredInformation: `
      1. Does the client have a partner, spouse, or long-term partner.
      2. Do they have strong, positive relationships with their parents
      3. Do they have strong, positive relationships with their other family members
    `,
  },
  {
    title: "Accommodation",
    requiredInformation: `
      1. Where did they live before entering the facility
      2. Do they have a place to stay immediately after release
      3. Where do they plan to live long-term after release, and is it the same as the place they lived before or the place they plan to stay immediately after release
      4. What are their goals related to housing after release
    `,
  },
  {
    title: "Leisure and Recreation",
    requiredInformation: `
      1. What were their hobbies and interests before entering the facility
      2. Do you have any hobbies or activities that they enjoy doing in the facility
      3. Do they have any hobbies or interests that they would like to pursue after release
    `,
  },
  {
    title: "Companions",
    requiredInformation: `
      1. Do you have any close friends or companions that you plan to spend time with after release
      2. What they imagine their social life will look like after release
    `,
  },
  {
    title: "Alcohol and Drug Use",
    requiredInformation: `
      1. Will you require any support or resources related to alcohol or drug use after release
    `,
  },
];

export const SECTION_TITLES = LSIR_SECTIONS.map((section) => section.title);

export const ROLE = `
Role: You are a social worker conducting a structured intake assessment with a new client who is currently in a prison facility and preparing for their release.
`;

export const TONE = `
Your Tone: Warm, trauma-informed, and professional. Use plain language that is understandable at a 4th-grade reading level.
`;
