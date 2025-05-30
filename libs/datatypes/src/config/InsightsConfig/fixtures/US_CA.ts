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

import { InsightsConfig } from "../schema";

export const US_CA: InsightsConfig = {
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
  atOrBelowRateLabel: "At or above statewide rate",
  caseloadCategories: [],
  clientEvents: [],
  docLabel: "CDCR",
  exclusionReasonDescription:
    "We've excluded agents from this list with particularly large or small average caseloads (larger than 175 or smaller than 10). We also excluded agents who didn’t have a caseload of at least 10 clients for at least 75% of the observation period. ",
  learnMoreUrl:
    "https://drive.google.com/file/d/1QgvOj8FCMYu3gMSNazlNr_7_OZmuQ3Jc/view?usp=sharing",
  metrics: [
    {
      name: "absconsions_bench_warrants",
      outcomeType: "ADVERSE",
      titleDisplayName: "Absconding Rate",
      bodyDisplayName: "absconding rate",
      eventName: "abscondings",
      eventNameSingular: "absconding",
      eventNamePastTense: "absconded",
      descriptionMarkdown:
        "All reported abscondings, as captured in the data we receive for all supervision levels except for CATEGORY D, DEPORTED and PENDING DEPORT, in a given time period.\n<br />\nDenominator is the average daily caseload for the agent over the given time period, including people on both active and admin supervision levels.",
      topXPct: null,
    },
    {
      name: "treatment_starts",
      outcomeType: "FAVORABLE",
      titleDisplayName: "Program Start Rate",
      bodyDisplayName: "program start rate",
      eventName: "program starts",
      eventNameSingular: "program start",
      eventNamePastTense: "had a program start",
      descriptionMarkdown:
        "All reported program starts that exist in PVDTS, as captured in the data we receive for all supervision levels except for CATEGORY D, DEPORTED and PENDING DEPORT, in a given time period.\n<br />\nDenominator is the average daily caseload for the agent over the given time period, including people on both active and admin supervision levels.",
      topXPct: 10,
    },
  ],
  noneAreOutliersLabel: "are outliers on any metrics",
  officerHasNoEligibleClientsLabel: "Officer has no eligible clients",
  officerHasNoOutlierMetricsLabel: "Officer has no outlier metrics",
  outliersHover:
    "Has a rate on any metric significantly higher or lower than peers - over 1 Interquartile Range above or below the statewide rate.",
  slightlyWorseThanRateLabel: "Slightly worse than statewide rate",
  supervisionDistrictLabel: "district",
  supervisionDistrictManagerLabel: "deputy regional administrator",
  supervisionJiiLabel: "client",
  supervisionOfficerLabel: "agent",
  supervisionSupervisorLabel: "supervisor",
  supervisionUnitLabel: "unit",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "Supervisor has no officers with eligible clients",
  supervisorHasNoOutlierOfficersLabel: "Supervisor has no outlier officers",
  vitalsMetrics: [],
  vitalsMetricsMethodologyUrl: "https://www.recidiviz.org/",
  worseThanRateLabel: "Far worse than statewide rate",
};
