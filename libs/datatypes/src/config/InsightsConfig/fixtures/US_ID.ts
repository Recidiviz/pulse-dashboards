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

import { VITALS_METRIC_IDS } from "../../../metrics/utils/constants";
import { InsightsConfig } from "../schema";

export const US_ID: InsightsConfig = {
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
  clientEvents: [],
  docLabel: "IDOC",
  exclusionReasonDescription:
    "We've excluded officers from this list who have particularly large or small average caseloads (larger than 175 or smaller than 10). We've also excluded officers who didn't have a caseload of at least 10 clients for at least 75% of the observation period. Lastly, we exclude P&P specialists, as events that occur while clients are assigned to them are attributed to the previous officer.",
  learnMoreUrl:
    "https://drive.google.com/file/d/1alpje96AHyWsRxKwtIPwQE7UYFS3Ob0h/view",
  metrics: [
    {
      name: "incarceration_starts",
      outcomeType: "ADVERSE",
      titleDisplayName: "Incarceration Rate",
      bodyDisplayName: "incarceration rate",
      eventName: "incarcerations",
      eventNameSingular: "incarceration",
      eventNamePastTense: "were incarcerated",
      descriptionMarkdown:
        "The numerator represents the number of transitions to incarceration from supervision in the given time period, regardless of whether the final decision was a revocation or sanction admission. A client is considered to be in a period of incarceration if their location during that time is within a correctional facility or county jail, or if their supervision level at the time indicates an ICE detainer or federal custody. We exclude incarcerations for which the most serious violation was an absconsion, because we count absconsion violations separately, as outlined below. We associate violations with incarcerations by looking for the most severe violation between two years before and 14 days after the incarceration period started. Client location is pulled from the transfer records in Atlas.\n\n<br />\nThe denominator is the average daily caseload for the officer over the given time period. Clients on Unsupervised/Court Probation or clients who are supervised out of state with respect to an Interstate Compact are excluded from an officer's active caseload.",
      topXPct: null,
      listTableText:
        "Clients will appear on this list multiple times if they have been incarcerated more than once under this officer in the time period.",
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
        "The numerator represents the number of all reported absconsion violations in the given time period, which could include multiple absconsion violations for the same client. Absconsion violations are calculated based on the number of Violation Surveys entered into Atlas with “Absconding” selected as one of its violation types. The time period of each absconsion violation is determined using the date the Violation Survey was completed. If the absconsion violation is filed after the incarceration event, neither the violation nor the incarceration event will be included in our metrics.\n\n<br />\nThe denominator is the average daily caseload for the officer over the given time period. Clients on Unsupervised/Court Probation or clients who are supervised out of state with respect to an Interstate Compact are excluded from an officer's active caseload.",
      topXPct: null,
      listTableText:
        "Clients will appear on this list multiple times if they have had more than one absconsion under this officer in the time period.",
    },
  ],
  noneAreOutliersLabel: "are outliers",
  officerHasNoEligibleClientsLabel:
    "Nice! No outstanding opportunities for now.",
  officerHasNoOutlierMetricsLabel: "Nice! No outlying metrics this month.",
  outliersHover:
    "Has a rate on any metric significantly higher than peers - over 1 Interquartile Range above the statewide rate.",
  slightlyWorseThanRateLabel: "Slightly worse than statewide rate",
  supervisionDistrictLabel: "district",
  supervisionDistrictManagerLabel: "district director",
  supervisionJiiLabel: "client",
  supervisionOfficerLabel: "officer",
  supervisionSupervisorLabel: "supervisor",
  supervisionUnitLabel: "unit",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "Nice! No outstanding opportunities for now.",
  supervisorHasNoOutlierOfficersLabel:
    "Nice! No officers are outliers on any metrics this month.",
  worseThanRateLabel: "Far above the statewide rate",
  vitalsMetrics: [
    {
      metricId: VITALS_METRIC_IDS.enum.timely_contact,
      titleDisplayName: "Timely F2F Contact",
    },
    {
      metricId: VITALS_METRIC_IDS.enum.timely_risk_assessment,
      titleDisplayName: "Timely Risk Assessment",
    },
  ],
};
