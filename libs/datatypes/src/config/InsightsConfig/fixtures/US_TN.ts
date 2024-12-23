// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { InsightsConfig } from "../schema";

export const US_TN: InsightsConfig = {
  actionStrategyCopy: {
    ACTION_STRATEGY_60_PERC_OUTLIERS: {
      prompt: "How might I work with my team to improve these metrics?",
      body: "Try setting positive, collective goals with your team:\n1. After some investigation, arrange a meeting with your team to engage in a comprehensive discussion about their strengths, challenges, and metrics.\n2. Prepare a well-structured agenda and establish clear objectives for the meeting. Additionally, come prepared with inquiries for your staff, as well as be open to addressing any questions they may have.\n3. Collaborate as a team to brainstorm innovative approaches for overcoming challenges and improving upon any outliers in the metrics.\n4. Establish SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals together with your team for future endeavors and devise a plan to effectively monitor their progress. Ensure that these goals are communicated and easily accessible to all team members.\n5. Foster an environment of open communication and actively encourage the implementation of the strategies and plans that have been established for moving forward.\n\nSee more details on this and other action strategies [here](https://www.recidiviz.org).",
    },
    ACTION_STRATEGY_OUTLIER: {
      prompt: "How might I investigate what is driving this metric?",
      body: "Try conducting case reviews and direct observations:\n1. Gather additional information on how agents do their work to inform how you approach the staff member, where there are gaps in client or staff resources, and where additional agent training could help.\n2. Conduct case reviews to ascertain whether outlying agents are consistently following agency policy and practice expectations; using the strategies and techniques that have been identified as most effective in meeting agency goals (e.g., evidence-based practices); and delivering services in the manner intended. Consider using cases listed in the tool for the agent's 3 self-assessments/case management reviews this quarter.\n4. Conduct direct observations of in-person staff/client meetings to determine the quality of interactions with clients and how agents are building rapport and using strategies that promote behavior change.\n\nSee this and other action strategies [here](https://www.recidiviz.org)",
    },
    ACTION_STRATEGY_OUTLIER_3_MONTHS: {
      prompt: "How might I discuss this with the agent in a constructive way?",
      body: "First, investigate: Conduct further case reviews or direct observations along with using the Lantern Insights tool to make sure that you understand the agent's caseload, trends, and approach. Other strategies to better investigate behind the metrics are here.\nAfter investigating, try having a positive meeting 1:1 with the agent:\n1. Establish a meeting atmosphere that fosters open communication. Ensure that your agent comprehends the purpose behind this coaching conversation - improving future client outcomes.\n2. Customize the discussion to cater to the individual needs and growth of the agent you are engaging with.\n3. Utilize positive reinforcement and subtle prompts to demonstrate attentive listening.\n4. Collaborate on generating ideas to reduce outlier metrics and improve overall performance of the officer.\n5. If needed, schedule regular meetings and formulate objectives with clear timeframe expectations to track the progress of the agent or tackle persistent challenges and issues. Consider using cases listed in the tool for the outlying agent's 3 self-assessments/case management reviews this quarter.\n\nSee this and other action strategies [here](https://www.recidiviz.org).",
    },
    ACTION_STRATEGY_OUTLIER_ABSCONSION: {
      prompt:
        "What strategies could an agent take to reduce their absconder warrant rate?",
      body: "Try prioritizing rapport-building activities between the agent and the client:\n1. Suggest to this agent that they should prioritize:\n    - accommodating client work schedules for meetings\n    - building rapport with clients early-on\n    - building relationships with community-based providers to connect with struggling clients.\n 2. Implement unit-wide strategies to encourage client engagement, such as:\n    - early meaningful contact with all new clients\n    - clear explanations of absconding and reengagement to new clients during their orientation and beyond\n    - rewarding agents building positive rapport (supportive communication, some amounts of small talk) with clients.\n\nSee more details on this and other action strategies [here](https://www.recidiviz.org).",
    },
    ACTION_STRATEGY_OUTLIER_NEW_OFFICER: {
      prompt:
        "How might I help an outlying or new agent learn from other agents on my team?",
      body: "Try pairing agents up to shadow each other on a regular basis:\n1. Identify agents who have a track record of following agency policy, have a growth mindset for their clients, and have a positive rapport with clients.\n 2. Offer outlying agents and/or new agents the opportunity for on-the-job shadowing to learn different approaches, skills, and response techniques when interacting with clients.\n 3. Reinforce the notion among your staff that this presents a valuable opportunity for learning and growth.\n\nSee more details on this and other action strategies [here](https://www.recidiviz.org).",
    },
  },
  atOrAboveRateLabel: "At or above statewide rate",
  atOrBelowRateLabel: "At or below statewide rate",
  caseloadCategories: [
    { id: "SEX_OFFENSE", displayName: "Sex Offense Caseload" },
    { id: "NOT_SEX_OFFENSE", displayName: "General + Other Caseloads" },
  ],
  clientEvents: [
    { displayName: "Violations", name: "violations" },
    { displayName: "Sanctions", name: "violation_responses" },
  ],
  docLabel: "TDOC",
  exclusionReasonDescription:
    "We've excluded officers from this list with particularly large or small average daily caseloads (larger than 175 or smaller than 10). We also excluded officers who didn’t have a caseload of at least 10 clients for at least 75% of the observation period.",
  learnMoreUrl:
    "https://drive.google.com/file/d/1WCNEeftLeTf-c7bcKXKYteg5HykrRba1/view",
  metrics: [
    {
      name: "incarceration_starts",
      outcomeType: "ADVERSE",
      titleDisplayName: "Incarceration Rate",
      bodyDisplayName: "incarceration rate",
      eventName: "all incarcerations",
      eventNameSingular: "incarceration",
      eventNamePastTense: "were incarcerated",
      descriptionMarkdown:
        "The numerator is transitions to incarceration from supervision in the given time period (12 months), regardless of whether the final decision was a revocation or sanction admission. Any returns to incarceration for weekend confinement are excluded.  This includes supervision plan updates to IN CUSTODY or DETAINER status. Returns to incarceration entered as SPLIT confinement are also included - some of these will be results of pre-determined sentencing decisions rather than the result of supervision violations.\n\n<br />\nDenominator is the average daily caseload for the officer over the given time period, including people on both active and admin supervision levels.",
      topXPct: null,
      listTableText: undefined,
    },
    {
      name: "absconsions_bench_warrants",
      outcomeType: "ADVERSE",
      titleDisplayName: "Absconsion Rate",
      bodyDisplayName: "absconsion rate",
      eventName: "absconsions",
      eventNameSingular: "absconsion",
      eventNamePastTense: "absconded",
      descriptionMarkdown:
        'All reported absconsions, as captured in the data we receive by supervision levels "9AB", "ZAB", "ZAC", "ZAP" or supervision type "ABS" for absconsions, in a given time period.\n\n<br />\nDenominator is the average daily caseload for the officer over the given time period, including people on both active and admin supervision levels.',
      topXPct: null,
      listTableText: undefined,
    },
    {
      name: "incarceration_starts_technical_violation",
      outcomeType: "ADVERSE",
      titleDisplayName: "Technical Incarceration Rate",
      bodyDisplayName: "technical incarceration rate",
      eventName: "technical incarcerations",
      eventNameSingular: "technical incarceration",
      eventNamePastTense: "had a technical incarceration",
      descriptionMarkdown:
        "Transitions to incarceration from supervision due to technical violations, regardless of whether the final decision was a revocation or sanction admission. It is considered a technical incarceration only if the most serious violation type across all violations in the prior 24 months was a technical violation. We use this logic even if someone’s return to prison is labeled a “new admission”, as long as they were previously on supervision. For incarceration transitions where we don’t find any associated violations, we infer violations and their type by looking at admission reasons implying a Technical or New Crime reason for returning to prison.\n\nThere are situations where we are unable to find a violation to match an incarceration we see in the data. For example, if there are no violations entered because of data entry reasons or because someone was previously in a CCC who did not use TOMIS, we will either not know the cause of the reincarceration or be associating the incarceration with an erroneous violation type.\n\n<br />\nDenominator is the average daily caseload for the officer over the given time period, including people on both active and admin supervision levels.",
      topXPct: null,
      listTableText: undefined,
    },
  ],
  noneAreOutliersLabel: "are outliers",
  officerHasNoEligibleClientsLabel:
    "No clients listed as currently eligible for an opportunity",
  officerHasNoOutlierMetricsLabel:
    "No metrics far from the statewide rate this month",
  outliersHover:
    "Has a rate on any metric significantly higher than peers - over 1 Interquartile Range above the statewide rate.",
  slightlyWorseThanRateLabel: "Slightly higher than statewide rate",
  supervisionDistrictLabel: "district",
  supervisionDistrictManagerLabel: "district director",
  supervisionJiiLabel: "client",
  supervisionOfficerLabel: "officer",
  supervisionSupervisorLabel: "manager",
  supervisionUnitLabel: "unit",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "No staff have clients listed as currently eligible for an opportunity",
  supervisorHasNoOutlierOfficersLabel:
    "No staff have metrics far from the statewide rate this month",
  worseThanRateLabel: "Much higher than statewide rate",
};
