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

import { z } from "zod";

export const sectionsSchema = z.array(
  z.object({
    title: z.string(),
    requiredInformation: z.string(),
  }),
);

export type Sections = z.infer<typeof sectionsSchema>;

export const US_ID_SECTIONS: Sections = [
  {
    title: "Basic Information",
    requiredInformation: `
      1. What is the client's expected release date?
      2. Does the client have a parole board hearing scheduled?
         a. If yes:
            - What is the date of the hearing?
            - What support or resources do they need to prepare for it?
      3. Does the client have a birth certificate?
         a. If no:
            - What steps, if any, have they already taken to obtain them?
            - Do they need assistance to complete the process?
      4. Does the client have a social security card?
         a. If no:
            - What steps, if any, have they already taken to obtain them?
            - Do they need assistance to complete the process?
      5. Regardless of having physical possession of a social security card, does the client know their social security number, if they have one?
      6. Does the client have a government-issued ID?
         a. If no:
            - What steps, if any, have they already taken to obtain them?
            - Do they need assistance to complete the process?
      7. Did the client have a driver's license issued by the DMV within the past 10 years?
         a. If yes:
            - Has the license been suspended or revoked?
              i. If yes:
                 - Was it suspended or revoked?
                 - When was it suspended or revoked?
                 - What county ordered it suspended or revoked?
                 - Why was the suspension or revocation ordered?
              ii. If no:
                  - When does the license expire?
      8. Is the client a veteran?
         a. If yes:
            - Was the client's character of discharge Honorable Discharge, General Discharge under Honorable Conditions, or Other Than Honorable Discharge?
      9. Does the client have registration requirements for arson and/or a sex offense?
      10. Does the client have to stay away from a certain area, or stay a certain distance away from a certain area?
          a. If yes:
             - What will the client do to make sure they comply?
      11. Does the client plan to transfer their parole?
          a. If so:
             - What are their reasons for doing so?
      12. Was the client's conviction drug-related?
    `,
  },
  {
    title: "Immediate Needs",
    requiredInformation: `
      1. Upon release, will the client have access to sufficient food?
         a. If no:
            - Do they need a referral to a food bank?
      2. Upon release, will the client have access to weather-appropriate clothing?
         a. If no:
            - Do they need a referral to a clothing closet or other community resource that provides clothing?
      3. Determine if the client has transportation arranged for their release day.
         a. If yes:
            - What are the details of the transportation (e.g., who is picking them up, what time, what is the destination)?
         b. If no:
            - What is their plan?
            - Do they need assistance arranging transportation or a voucher for public transit?
      4. Ask if the client needs help applying for or reactivating public benefits.
         a. If yes:
            - What benefits do they need support for, if they know?
            - Have they ever received these benefits before?
            - What specific help do they need with the application or reactivation process?
    `,
  },
  {
    title: "Housing",
    requiredInformation: `
      1. Does the client have a short-term plan for a safe and confirmed place to go immediately upon release?
         a. If yes, what is the nature of that housing?
            i. If with family or friends:
               - Who will be living there?
               - Has the client discussed this stay with them?
               - What are the rules or expectations for living there?
               - How long have they agreed the client can stay?
               - Is there a housing agreement (eg. lease) that has a time limit on how long a guest can stay?
            ii. If in a transitional housing program or shelter:
                - Has the client been accepted into a program?
                - What is the name of the program/shelter?
                - Does the client understand the program's rules and requirements?
            iii. If in client's own rented or owned home:
                 - Will anyone else be living there? If so, who?
         b. If no:
            - What are their primary concerns about securing immediate shelter?
            - Would they like a referral to an emergency shelter or crisis center?
      2. If the short term housing plan falls through, what is the client's back-up “Plan B” short term housing plan?
      3. Would the client like emergency shelter options, just in case?
      4. What is the client's plan for income or monthly budget to pay for housing in the short term?
      5. Where is the client planning to live long-term after release?
      6. If different than their short-term plan, what steps is the client planning to take to successfully transition from their short term to long term housing?
      7. What obstacles stand in the client's way of achieving their long term housing plan?
      8. Is the client concerned about their criminal record impacting their ability to find housing?
      9. Does the client report having any disabilities that require specific housing accommodations?
         a. If yes:
            - What are the comprehensive details regarding the accommodations required?
      10. Does the client have no-contact orders that affect where they can live?
          a. If yes:
             - What are the details of the order?
      11. Does the client require LGBTQIA-safe housing?
      12. Does the client require housing that will allow them to live with their children?
    `,
  },
  {
    title: "Employment",
    requiredInformation: `
      1. Does the client plan to work after release?
         a. If yes:
            - How many hours per week does the client seek to work?
            - What jobs would the client ideally like to have after release?
            - Do any of these jobs require specific occupational licenses, education, training, etc.?
            - Does the client have previous work experience in this field?
            - What job(s) would the client be willing to take while looking to get their ideal job?
            - What barriers, if any, does the client anticipate in their ideal career based on having a criminal record?
            - Does the client have a resume?
              i. If no, would they like help creating one?
            - Does the client have a professional email address for job applications?
         b. If no (from the context of not having a professional email for job applications, branching to other plans):
            - Is the client planning to apply for disability benefits (SSI/SSDI)?
            - Is the client planning to be a full-time student or homemaker?
      2. What is the client's past work experience?
      3. Does the client still have a good relationship with any prior employers?
         a. If yes:
            - What are the name(s) of those prior employers?
      4. Did the client work any jobs during incarceration?
         a. If yes:
            - Which job(s)?
            - For how long did they hold each job?
            - How many hours a week did they work each job?
      5. Does the client have good relationships with any prior bosses who could write a letter of recommendation or act as a reference?
         a. If yes:
            - What is the comprehensive list of names of those bosses? (Make sure to collect a full list of names.)
      6. What are the client's biggest perceived strengths as related to employment?
      7. What are the client's biggest perceived challenges as related to securing and maintaining employment?
      8. Prompt ideas:
         - Make sure to gather information about the client's work history as comprehensively as possible for the 10 years prior to their current incarceration or for their full work history, whichever is shorter.
         - Make sure to establish their places of employment, roles, and responsibilities.
         - Encourage the client to identify and report skills developed and responsibilities held even in informal work.
         - If possible, draw encouraging connections between past work skills or responsibilities and the career the client has indicated they are interested in.
    `,
  },
  {
    title: "Education",
    requiredInformation: `
      1. What is the highest grade level or education the client has completed?
      2. Has the client completed any educational or vocational programming while incarcerated?
         a. If yes:
            - What programming? (Make sure to collect a comprehensive list.)
            - Has the client received their GED, college credits, or any other kind of diploma or credentials while incarcerated?
            - What work-related skills has the client learned from this programming?
      3. Is the client currently enrolled in any courses or programs?
         a. If yes:
            - Which one(s)? (Make sure to collect a comprehensive list.)
      4. Does the client have any degrees or certifications?
         a. If yes:
            - Which one(s)? (Make sure to collect a comprehensive list.)
            - Where and when did the individual secure each degree or certification?
      5. Is the client interested in pursuing further education or vocational training after release?
         a. If yes:
            - What field of study or trade is the client interested in?
            - Has the client researched any schools or programs? If yes, which?
            - What are the client's goals for their continued education?
            - How many hours per week are they planning to attend school?
            - Would the client like information on how to apply for financial aid (FAFSA or Dream Act)?
            - Is the client aware of programs that support formerly incarcerated students?
    `,
  },
  {
    title: "Financial",
    requiredInformation: `
      1. Will the client have any financial resources upon release?
         a. If yes:
            - Approximately how much will they have?
            - What is their plan for managing these initial funds?
      2. Does the client have any court-ordered financial obligations (restitution, fines, fees)?
         a. If yes:
            - What is the total amount owed and to which agencies?
            - What are the payment terms?
            - Have they explored options for setting up a payment plan?
      3. Does the client have child support obligations?
         a. If yes:
            - What is the monthly amount and any arrears owed?
            - Are they in contact with the state child support services agency?
            - Do they need assistance requesting a modification based on their current circumstances?
      4. Does the client have a bank account?
         a. If yes, is it in good standing?
         b. If they do not have an account or have a negative banking history:
            - Are they interested in information on opening a new account?
      5. Is the client interested in financial literacy support?
         a. If yes:
            - What specific topics are they most interested in learning about (e.g., creating a budget, building credit, managing debt)?
    `,
  },
  {
    title: "Family Relationships",
    requiredInformation: `
      1. What is the client's primary family?
      2. What are their names and relationships to the client?
      3. What makes each of them a positive support?
      4. What are the client's hopes and any concerns about their relationships with family after release?
      5. Is the client planning to reunify with their family?
      6. What practical steps do they plan to take to nurture these relationships?
      7. What specific challenges do they anticipate, and how do they plan to navigate them?
      8. Are they interested in resources like family counseling or mediation?
      9. Does the client have children?
         a. If yes:
            - What is the current nature and frequency of their contact?
            - Is the client ready to and planning to reunify with their children?
            - What are their immediate goals regarding their relationship with their children and their role as a parent?
      10. Are there any court-ordered restrictions on contact or visitation that may affect the client's ability to be involved with their children or other family members?
          a. If yes:
             - What are the order(s)?
             - Who is protected in each order?
             - When does each order begin and end?
             - Which court made each of the orders (court name and county)?
    `,
  },
  {
    title: "Social Connections",
    requiredInformation: `
      1. What is the nature of the client's friendships and social network?
      2. Do they feel their current social circle will be supportive of their reentry goals?
      3. If they have concerns about negative influences, how do they plan to set boundaries or create distance?
      4. Is the client interested in developing new, positive social connections?
         a. If yes:
            - What are they looking for in these new connections (e.g., shared hobbies, sobriety support, faith-based community, mentorship)?
      5. Are there other people who it will take some time for the client to have a relationship with again, but with whom they hope to rebuild a relationship?
         a. If yes:
            - Who?
    `,
  },
  {
    title: "Leisure and Recreation",
    requiredInformation: `
      1. What are the client's hobbies and interests?
      2. What positive and pro-social activities do they enjoy?
      3. Are these activities accessible and affordable in the community they are returning to?
      4. How do they plan to integrate these activities into their routine?
    `,
  },
  {
    title: "Alcohol and Drugs",
    requiredInformation: `
      1. Does the client have a history with substance abuse?
         a. If yes:
            - What does their recovery journey look like so far?
            - Have they ever participated in a substance abuse treatment program while incarcerated or prior to incarceration?
              i. If yes:
                 - Which ones?
                 - What was helpful or unhelpful about prior experiences with treatment programs?
            - Is the client interested in starting or continuing treatment support after release?
              i. If yes:
                 - What type of support do they feel would be most effective for them now (e.g., group meetings like AA/NA, individual counseling, medication-assisted treatment, residential treatment, or something else)?
    `,
  },
  {
    title: "Health and Wellness",
    requiredInformation: `
      1. Does the client have any current medical conditions that require ongoing treatment or medication?
         a. If yes:
            - What are the conditions and prescribed medications?
            - Do they have a 30-day supply of medication upon release?
            - Do they have a plan to see a doctor and get prescriptions filled?
              i. If yes:
                 - What are the details of that plan?
                 - Which doctor?
                 - At what pharmacy will they get their prescriptions filled?
                 - How will they travel to the doctor and pharmacy?
      2. Does the client have a plan for securing health care insurance upon release?
         a. If yes:
            - Is the coverage already active in the county they are releasing to?
            - Does the client have their insurance card or number?
         b. If no:
            - Do they need assistance with the enrollment or transfer process?
      3. Does the client have a history of mental health conditions?
         a. If yes:
            - Are they currently receiving treatment or medication?
            - What is their plan for continuity of care upon release?
            - Are they interested in connecting with a counselor or therapist to help with the stress of reentry and to process past trauma?
    `,
  },
  {
    title: "Legal",
    requiredInformation: `
      1. Is the client interested in post-conviction legal remedies?
         a. If yes:
            - Are they interested in learning more about cleaning up their criminal record (e.g., expungement)?
            - Are they aware of the eligibility requirements?
      2. Does the client have any pending legal cases?
         a. If yes:
            - What are the charges?
            - In which court?
            - Do they have legal representation?
      3. Does the client have any active detainers, warrants, holds from other jurisdictions?
         a. If yes:
            - What is the issuing agency for each?
            - What is the reason for the hold for each?
            - Does the client have legal representation or a plan to resolve them?
      4. Is the client a US citizen?
         a. If no:
            - Is the client aware of how their conviction may impact their immigration status?
            - What are their specific concerns?
            - Have they spoken with an immigration attorney?
    `,
  },
];

export const SECTION_TITLES = US_ID_SECTIONS.map((section) => section.title);

export const ROLE = `
Role: You are a social worker conducting a structured intake assessment with a new client who is currently in a prison facility and preparing for their release.
`;

export const TONE = `
Your Tone: Warm, trauma-informed, and professional. Use plain language that is understandable at a 4th-grade reading level.
`;
