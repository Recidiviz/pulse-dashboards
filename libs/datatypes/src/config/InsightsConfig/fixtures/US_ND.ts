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

export const US_ND: InsightsConfig = {
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
  caseloadCategories: [],
  clientEvents: [
    { displayName: "Violations", name: "violations" },
    { displayName: "Sanctions", name: "violation_responses" },
  ],
  docLabel: "DOCR",
  exclusionReasonDescription: "TODO EXCLUSION REASON",
  learnMoreUrl:
    "https://drive.google.com/file/d/1gWA2aFu0VtL9c9ysv3PuhWjVjj7jYPNc/view?usp=sharing",
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
        "All transitions to incarceration (state prison or county jail) from supervision in the given time period, regardless of whether the final decision was a revocation or sanction admission.\n\n<br />\nDenominator is the average daily caseload for the agent over the given time period.",
      topXPct: null,
    },
    {
      name: "absconsions_bench_warrants",
      outcomeType: "ADVERSE",
      titleDisplayName: "Absconder Rate",
      bodyDisplayName: "absconder rate",
      eventName: "absconsions",
      eventNameSingular: "absconsion",
      eventNamePastTense: "absconded",
      descriptionMarkdown:
        "All reported absconsions from supervision in the given time period.\n\n<br />\nDenominator is the average daily caseload for the agent over the given time period.",
      topXPct: null,
    },
  ],
  noneAreOutliersLabel: "are outliers",
  officerHasNoEligibleClientsLabel: "No outstanding opportunities for now.",
  officerHasNoOutlierMetricsLabel:
    "Great news! No outlying metrics this month.",
  outliersHover: "TODO HOVER TOOLTIP",
  slightlyWorseThanRateLabel: "Slightly worse than statewide rate",
  supervisionDistrictLabel: "region",
  supervisionDistrictManagerLabel: "program manager",
  supervisionJiiLabel: "client",
  supervisionOfficerLabel: "officer",
  supervisionSupervisorLabel: "lead officer",
  supervisionUnitLabel: "office",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "No outstanding opportunities for now.",
  supervisorHasNoOutlierOfficersLabel:
    "Great news! No officers are outliers on any metrics this month.",
  vitalsMetrics: [
    {
      metricId: "timely_risk_assessment",
      titleDisplayName: "Timely Risk Assessment",
      bodyDisplayName: "Assessment",
    },
    {
      metricId: "timely_contact",
      titleDisplayName: "Timely Contact",
      bodyDisplayName: "Contact",
    },
  ],
  vitalsMetricsMethodologyUrl:
    "https://drive.google.com/file/d/1gWA2aFu0VtL9c9ysv3PuhWjVjj7jYPNc/view?usp=sharing",
  worseThanRateLabel: "Far above the statewide rate",
};
