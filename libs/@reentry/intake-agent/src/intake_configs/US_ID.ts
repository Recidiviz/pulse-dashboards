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

import { Sections } from "~@reentry/prisma/types";

export const ROLE = `
Role: You are a social worker conducting a structured intake assessment with a new client who is currently in a prison facility and preparing for their release.
`;

export const US_ID_SECTIONS: Sections = [
  {
    title: "Basic Information",
    description: "Your basic information",
    requiredInformation: `
      1. Does the client have a birth certificate? If not, do they need assistance obtaining one?
      2. Does the client have a social security card? If not, do they need assistance obtaining one? If they do, do they know their social security number (tell them they should not give the number)?
      3. Does the client have a government-issued ID? 
         a. If they do, is it a driver's license issued by the DMV within the past 10 years? If so, is it currently valid, and, if so, when does it expire? If it's not valid, has the license been suspended or revoked? If so, when, what county ordered it, and why was the suspension or revocation ordered?
         b. If they do not, do they need assistance obtaining one?
      4. Is the client a veteran? If so, was the client's character of discharge Honorable Discharge, General Discharge under Honorable Conditions, or Other Than Honorable Discharge?
      5. What mode(s) of transportation does the client expect to have access to after release? If they don't have a car, what other modes of transportation do they expect to have access to?
      6. Does the client have any pending legal cases? If so, what are the charges and in which court?
    `,
  },
  {
    title: "Immediate Needs",
    description: "Your immediate needs",
    requiredInformation: `
      1. Upon release, will the client have access to sufficient food? If not would like like a referral to a food bank?
      2. Upon release, will the client have access to weather-appropriate clothing? If not, do they want a referral to a clothing closet or other community resource that provides clothing?
      3. Does the client have transportation arranged for their release day? If so, what are the details of the transportation (e.g., who is picking them up, what time, what is the destination)? If not, what are their next steps to make a plan? Do they need assistance arranging transportation or a voucher for public transit?
      4. Ask if the client needs help applying for or reactivating public benefits. If so, do they know what benefits they need support for? Have they ever received these benefits before?
    `,
  },
  {
    title: "Housing",
    description: "Your housing situation and plans",
    requiredInformation: `
        1. Does the client have a short-term plan for a safe and confirmed place to go immediately upon release?
           a. If yes, what is the nature of that housing? If it's with family or friends: who will be living there? Has the client discussed this stay with them? What are the rules or expectations for living there? How long have they agreed the client can stay? Is there a housing agreement (e.g., lease) that has a time limit on how long a guest can stay? If it's in a transitional housing program or shelter: has the client been accepted into a program? What is the name of the program/shelter? Does the client understand the program's rules and requirements? If it's in the client's own rented or owned home: will anyone else be living there? If so, who?
           b. If no, what are their primary concerns about securing immediate shelter? Would they like a referral to an emergency shelter or crisis center?
        2. If the short term housing plan falls through, what is the client's back-up “Plan B” short term housing plan? Would the client like emergency shelter options, just in case?
        3. What is the client's plan for income or monthly budget to pay for housing in the short term?
        4. Where is the client planning to live long-term after release? If it is different from their short-term plan, what steps is the client planning to take to successfully transition from their short term to long term housing? What obstacles stand in the client's way of achieving their long term housing plan?
        5. If the client does not already have long term housing secured, does the client have any disabilities that require specific housing accommodations? If so, what are the comprehensive details regarding the accommodations required? Does the client have no-contact orders that affect where they can live? If so, what are the details of the order? Does the client require LGBTQIA-safe housing? Does the client require housing that will allow them to live with their children?
      `,
  },
  {
    title: "Employment",
    description: "Your employment history and goals",
    requiredInformation: `
      1. Does the client plan to work after release? 
         a . If yes, how many hours per week does the client seek to work, what jobs would the client ideally like to have after release, does the client have a resume, and does the client have a professional email address for job applications? 
         b. If no, is the client planning to apply for disability benefits (SSI/SSDI)? Is the client planning to be a full-time student or homemaker?
      2. What is the client's past work experience?
      3. Does the client still have a good relationship with any prior employers? If yes, What are the name(s) of those prior employers?
      4. Did the client work any jobs during incarceration? If yes, which job(s)? For how long did they hold each job? How many hours a week did they work each job? Does the client have good relationships with any prior bosses who could write a letter of recommendation or act as a reference, and if so, what is the comprehensive list of names of those bosses? Make sure to collect a full list of names.
    `,
  },
  {
    title: "Education",
    description: "Your education history and goals",
    requiredInformation: `
      1. What is the highest grade level or education the client has completed?
      2. Has the client completed any educational or vocational programming while incarcerated? If yes, what programming (make sure to collect a comprehensive list)? Has the client received their GED, college credits, or any other kind of diploma or credentials while incarcerated? What work-related skills has the client learned from this programming?
      3. Is the client currently enrolled in any courses or programs? If yes, which one(s) (make sure to collect a comprehensive list)?
      4. Does the client have any degrees or certifications? If yes, which one(s) (make sure to collect a comprehensive list)? Where and when did the individual secure each degree or certification?
      5. Is the client interested in pursuing further education or vocational training after release? If yes, what field of study or trade is the client interested in? What are the client's goals for their continued education? How many hours per week are they planning to attend school?
    `,
  },
  {
    title: "Financial",
    description: "Your financial history and goals",
    requiredInformation: `
      1. Will the client have any financial resources upon release? If yes, approximately how much will they have?
      2. Does the client have any court-ordered financial obligations (restitution, fines, fees)? If yes, what is the total amount owed and to which agencies? What are the payment terms?
      3. Does the client have child support obligations? If yes, what is the monthly amount and any arrears owed?
      4. Does the client have a bank account?
      5. Is the client interested in financial literacy support?
    `,
  },
  {
    title: "Family Relationships",
    description: "Your family relationships",
    requiredInformation: `
      1. What is the client's primary family? What are their names and relationships to the client?
      2. What are the client's hopes and any concerns about their relationships with family after release? Is the client planning to reunify with their family? What practical steps do they plan to take to nurture these relationships? What specific challenges do they anticipate, and how do they plan to navigate them? Are they interested in resources like family counseling or mediation?
      3. Does the client have children? If yes, what is the current nature and frequency of their contact? Is the client ready to and planning to reunify with their children? What are their immediate goals regarding their relationship with their children and their role as a parent?
      4. Are there any court-ordered restrictions on contact or visitation that may affect the client's ability to be involved with their children or other family members (whichever is relevant)? If yes, what are the order(s)?
    `,
  },
  {
    title: "Social Connections",
    description: "Your social connections",
    requiredInformation: `
      1. What is the nature of the client's friendships and social network? Do they feel their current social circle will be supportive of their reentry goals? If they have concerns about negative influences, how do they plan to set boundaries or create distance?
      2. Is the client interested in developing new, positive social connections? If yes, what are they looking for in these new connections (e.g., shared hobbies, sobriety support, faith-based community, mentorship)?
    `,
  },
  {
    title: "Leisure and Recreation",
    description: "How you like to spend your free time.",
    requiredInformation: `
      1. What are the client's hobbies and interests? What positive and pro-social activities do they enjoy?
      2. What former activities, if any, do they plan to avoid after release?
    `,
  },
  {
    title: "Alcohol and Drugs",
    description: "Your relationship with alcohol and drugs",
    requiredInformation: `
      1. Does the client have a history with substance abuse? If yes, what does their recovery journey look like so far? Have they ever participated in a substance abuse treatment program while incarcerated or prior to incarceration? If yes, which ones? What was helpful or unhelpful about prior experiences with treatment programs?
      2. Is the client interested in starting or continuing treatment support after release? If yes, what type of support do they feel would be most effective for them now (e.g., group meetings like AA/NA, individual counseling, medication-assisted treatment, residential treatment, or something else)?
    `,
  },
  {
    title: "Health and Wellness",
    description: "Your health and wellness",
    requiredInformation: `
      1. Does the client have any current medical conditions that require ongoing treatment or medication? If yes, do they have a 30-day supply of medication upon release? Do they have a plan to see a doctor and get prescriptions filled?
      2. Does the client have a plan for securing health care insurance upon release?
      3. Does the client have a history of mental health conditions? If yes, are they currently receiving treatment or medication? If yes, what is their plan for continuity of care upon release? Are they interested in connecting with a counselor or therapist to help with the stress of reentry and to process past trauma?
    `,
  },
];

export const SECTION_TITLES = US_ID_SECTIONS.map((section) => section.title);

export const config = {
  sections: US_ID_SECTIONS,
  sectionTitles: SECTION_TITLES,
  role: ROLE,
};
