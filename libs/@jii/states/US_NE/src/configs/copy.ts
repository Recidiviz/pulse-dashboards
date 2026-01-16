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

import dedent from "dedent";

import { UsNeResidentMetadata } from "~datatypes";

import gbmdDefinition from "./definitions/gbmd.md?raw";
import jailCreditsDefinition from "./definitions/jailCredits.md?raw";
import lb191Definition from "./definitions/lb191.md?raw";
import mmtdDefinition from "./definitions/mmtd.md?raw";
import pedDefinition from "./definitions/ped.md?raw";
import trdDefinition from "./definitions/trd.md?raw";

export type UsNeCardGroupCopy = {
  sectionTitle: string;
  moreInfoLink: string;
  cards: {
    id: string;
    tag?: string;
    label: string;
    value: string;
    summary: string;
    metadataField: keyof UsNeResidentMetadata;
    definitionSlug?: string;
  }[];
};

export type UsNeCopy = {
  lastUpdated: string;
  home: {
    pageTitle: string;
    headerFields: { label: string; value: string }[];
    todos: {
      sectionTitle: string;
      goodTimeRestoration: {
        [K in "almostEligible" | "eligible" | "eligibleForMoreThan30Days"]: {
          title: string;
          body: string;
          linkText: string;
        };
      };
      reentryChecklist: {
        title: string;
        body: string;
        linkText: string;
      };
    };
    dates: UsNeCardGroupCopy;
    goodTimeBalances: UsNeCardGroupCopy;
    goodTimeAdjustments: {
      sectionTitle: string;
      emptyMessage: string;
      tableColumns: { label: string; value: string }[];
    };
  };
  reentryChecklist: {
    pageTitle: string;
    subtitle: string;
    writeErrorMessage: string;
    sections: {
      id: string;
      title: string;
      subtitle: string;
      items: { id: string; text: string }[];
    }[];
  };
  infoPages: Record<string, { heading: string; body: string }>;
  topLinkText: string;
  definitionsLinksHeading: string;
  homeLink: string;
};

export const usNeCopy: UsNeCopy = {
  lastUpdated:
    "This information is current as of {{formatFullDate goodTimeLastModifiedDate}}",
  home: {
    pageTitle: "Learn More About Your Sentence",
    headerFields: [
      {
        label: "Open Detainers/Holds:",
        value: "{{metadata.numHoldsAndDetainers}}",
      },
      { label: "Open Notifiers:", value: "{{metadata.numNotifiers}}" },
      {
        label: "Dead Time:",
        value: "{{metadata.deadTimeDays}} Days",
      },
      {
        label: "Minimum Sentence:",
        value: "{{metadata.minimumSentenceYears}} Yrs",
      },
      {
        label: "Maximum Sentence:",
        value: "{{metadata.maximumSentenceYears}} Yrs",
      },
      {
        label: "Good Time Law:",
        value: "LB {{metadata.goodTimeLawNumber}}",
      },
    ],
    todos: {
      sectionTitle: "To-dos",
      goodTimeRestoration: {
        eligible: {
          title: "Restore Lost Good Time",
          body: dedent`Congrats on going 6 months without any misconduct reports.
                       You are eligible to request 30 days back this month. You currently have {{metadata.goodTimeLostDaysRestorable}} total days lost.

                       To begin the time restoration process, ask your case manager or submit an Inmate Interview Request (IIR)
                       to the records office personnel in your facility.`,
          linkText: "Learn More",
        },
        eligibleForMoreThan30Days: {
          title: "Restore Lost Good Time",
          body: dedent`Congrats on getting 30 days of good time back each of the last 5 months.
                       You are now eligible to request more than 30 days back this month. You currently have {{metadata.goodTimeLostDaysRestorable}} total days lost.

                       To begin the time restoration process, ask your case manager or submit an Inmate Interview Request (IIR)
                       to the records office personnel in your facility.`,
          linkText: "Learn More",
        },
        almostEligible: {
          title: "Restore Lost Good Time",
          body: "ALMOST ELIGIBLE COPY TK",
          linkText: "Learn More",
        },
      },
      reentryChecklist: {
        title: "Complete Your Roadmap to Reentry",
        body: "Complete the items on your reentry checklist to prepare for success.",
        linkText: "Learn More",
      },
    },
    dates: {
      sectionTitle: "Important dates",
      moreInfoLink: "Learn more",
      cards: [
        {
          id: "trd",
          label: "Tentative Release Date (TRD)",
          value: "{{formatFullDateOptional value 'No TRD date'}}",
          summary: dedent`Your Tentative Release Date (TRD) is the estimated date you will be released from incarceration.
          This date can be changed as a result of a disciplinary action, a change in good time, a parole revocation,
          or a change in the law or the interpretation of the law.`,
          metadataField: "tentativeReleaseDate",
        },
        {
          id: "ped",
          label: "Parole Eligibility Date (PED)",
          value: "{{formatFullDateOptional value 'No PE date'}}",
          summary: dedent`The Parole Eligibility Date (PED) is the date you are first eligible for parole.`,
          metadataField: "paroleEligibilityDate",
        },
        {
          id: "mmtd",
          label: "Mandatory Minimum Term Date (MMTD)",
          value: "{{formatFullDateOptional value 'No MMTD date'}}",
          summary: dedent`Your Mandatory Minimum Term Date (MMTD) is the date when the
          required minimum part of your sentence ends.
          The mandatory minimum term is set by the law based on your total combined sentence.`,
          metadataField: "mandatoryMinimumDate",
        },
      ],
    },
    goodTimeBalances: {
      sectionTitle: "Credits",
      moreInfoLink: "Learn more",
      cards: [
        {
          id: "gbmd",
          label: "Good Time Balance/Mandatory Discharge (GB/MD)",
          value: `{{pluralize 'Day' metadata.goodTimeBalanceDays}}`,
          summary: dedent`A person sentenced to prison immediately gets this time up front.
          This is a type of good time that can be removed for Misconduct Reports (MRs).`,
          metadataField: "goodTimeBalanceDays",
        },
        {
          id: "lgtr",
          label: "Lost Good Time (Restorable)",
          value: "{{pluralize 'Day' value}}",
          summary: dedent`{{#if value}}
          This good time has been removed due to misconduct reports (MRs).
          You may apply to have these days restored after some time without misconduct reports.
          Ask your case manager for specific details on when you are eligible to ask for time back.
          {{else}}
          You do not have any lost good time days that are restorable.
          {{/if}}`,
          metadataField: "goodTimeLostDaysRestorable",
          definitionSlug: "gbmd",
        },
        {
          id: "lgtn",
          label: "Lost Good Time (Non-Restorable)",
          value: "{{pluralize 'Day' value}}",
          summary: dedent`{{#if value}}
          This good time has been lost due to misconduct reports (MRs). It is not possible to restore these days.

          This is already applied to your Tentative Release Date (TRD).
          {{else}}
          You do not have any lost good time days that are not restorable.
          {{/if}}`,
          metadataField: "goodTimeLostDaysNonRestorable",
          definitionSlug: "gbmd",
        },
        {
          id: "lb191",
          label: "LB 191 Earned Time Credits",
          value: `{{pluralize 'Day' value}}`,
          summary: dedent`{{#if (equals metadata.goodTimeLawNumber '191')}}
          After the first 12 months, you may earn an extra 3 days off your max sentence each month for good conduct.
          These days are applied to your Tentative Release Date (TRD) when they are earned.
          {{else}}
          You were sentenced under LB {{metadata.goodTimeLawNumber}}, not LB 191.
          For more information, submit your questions to the records office personnel in your facility on an Inmate Interview Request (IIR).
          {{/if}}`,
          metadataField: "lb191Credits",
          // Note: there is custom logic in UsNeCardGroup to hide the Learn More link if the resident is not sentenced under LB 191
        },
        {
          id: "jailCredits",
          label: "Jail Credits",
          value: `{{pluralize 'Day' value}}`,
          summary: dedent`Jail credits are the amount of days the court determined you spent in jail
          for the criminal charge which led to your prison sentence.
          These days are subtracted from your total combined sentence.`,
          metadataField: "jailTimeDays",
        },
      ],
    },
    goodTimeAdjustments: {
      sectionTitle: "Good Time Adjustments",
      emptyMessage: "No adjustments made",
      tableColumns: [
        {
          label: "Adjustment Type",
          value: `{{#if (gt creditsEarned 0)}}Addition{{else}}Removal{{/if~}}
            {{#if violationDescription}}: {{titleCase (lowerCase violationDescription)}}{{/if}}`,
        },
        {
          label: "MR Number (If\u00A0applicable)",
          value: "{{misconductReportNumber}}",
        },
        {
          label: "Days",
          value: `{{#if (gt creditsEarned 0)}}+{{/if}}{{creditsEarned}}`,
        },
        { label: "Transaction Date", value: "{{formatFullDate creditDate}}" },
      ],
    },
  },
  reentryChecklist: {
    pageTitle: "Roadmap to Reentry",
    subtitle:
      "Mark tasks as complete to keep your case manager updated on your progress",
    writeErrorMessage: "We couldn't save your progress: {{error}}",
    sections: [
      {
        id: "early",
        title: "Complete Anytime",
        subtitle:
          "These tasks can be completed as early as possible to set you up for success.",
        items: [
          {
            id: "birth-certificate",
            text: "I have my birth certificate, or have applied to receive one.",
          },
          {
            id: "applied-medicaid",
            text: "I have applied for Medicaid.",
          },
          {
            id: "ged-diploma",
            text: "I have my GED or high school diploma, or am enrolled in GED classes currently.",
          },
          {
            id: "job-training",
            text: "I am taking part in job training, industries, or an apprenticeship to prepare me for a career.",
          },
          {
            id: "skills-career-interests",
            text: "I know my skills and career interests.",
          },
          {
            id: "parenting-programs",
            text: "*If I have a family,* I am participating in parenting or family programs.",
          },
          {
            id: "five-keys-interest",
            text: "I know which of the 5 Keys programs I am interested in participating in.",
          },
        ],
      },
      {
        id: "3-years",
        title: "Complete 3 Years Pre-Release",
        subtitle:
          "Career readiness should be prioritized especially within 3 years of release.",
        items: [
          {
            id: "career-programs",
            text: "I am enrolled in college, vocational, or training programs to prepare me for a career.",
          },
          {
            id: "mental-health-assessment",
            text: "I have completed a mental health or substance use assessment.",
          },
          {
            id: "parenting-programs-2yr",
            text: "*If I have a family, I* am participating in parenting or family programs.",
          },
          {
            id: "clinical-program",
            text: "*If relevant,* I have completed or am on track to complete any prescribed clinical program.",
          },
        ],
      },
      {
        id: "6-months",
        title: "Complete 6 Months Pre-Release",
        subtitle:
          "Start your housing and employment plan within 6 months of release.",
        items: [
          {
            id: "job-opportunities",
            text: "I know what kind of job opportunities I can apply for.",
          },
          {
            id: "resume-portfolio",
            text: "I have a resume or work portfolio.",
          },
          {
            id: "safe-housing",
            text: "I have a safe place to live after release.",
          },
          {
            id: "backup-housing",
            text: "I have a backup housing plan.",
          },
          {
            id: "reentry-circle",
            text: "I know when my Reentry Inner Circle Meeting is, or I have already attended.",
          },
        ],
      },
      {
        id: "120-days",
        title: "Complete 120 Days Pre-Release",
        subtitle:
          "Finalize your reentry plan. Your Reentry Specialist can assist with these items at your 120-Day meeting.",
        items: [
          {
            id: "social-security-card",
            text: "I have my Social Security card.",
          },
          {
            id: "state-id-license",
            text: "I have my state ID or driver's license.",
          },
          {
            id: "birth-certificate-120",
            text: "I have my birth certificate.",
          },
          {
            id: "medicaid-120",
            text: "I have Medicaid.",
          },
          {
            id: "medical-checkup",
            text: "I have completed a medical check-up.",
          },
          {
            id: "continuation-care-plan",
            text: "*If relevant,* I have a medical continuation-of-care plan (appointments, providers, or referrals).",
          },
          {
            id: "medication-supply",
            text: "*If relevant,* I will leave with a 30-day supply of medications plus refills.",
          },
          {
            id: "treatment-aftercare",
            text: "*If relevant,* I know where I can go for treatment or aftercare if needed.",
          },
          {
            id: "barriers-plan",
            text: "I have a plan to deal with driver's license or employment barriers.",
          },
          {
            id: "budget-plan",
            text: "I have a budget plan for my first month after release.",
          },
          {
            id: "legal-obligations",
            text: "*If relevant,* I know my legal or financial obligations (child support, fines, debt).",
          },
          {
            id: "parole-expectations",
            text: "*If relevant,* I understand what to expect while on parole.",
          },
          {
            id: "supportive-person",
            text: "I have at least one supportive person or mentor I can count on.",
          },
          {
            id: "peer-support",
            text: "I am connected to peer support or reentry programs.",
          },
          {
            id: "success-plan",
            text: "I have a Success Plan with goals for 2 weeks, 30, 60, and 90 days.",
          },
          {
            id: "community-help",
            text: "I know where to go in the community for extra help.",
          },
          {
            id: "transportation-plan",
            text: "I have a transportation plan for release day and for work/supervision.",
          },
        ],
      },
    ],
  },
  infoPages: {
    mmtd: {
      heading: "Mandatory Minimum Term Date (MMTD)",
      body: mmtdDefinition,
    },
    ped: {
      heading: "Parole Eligibility Date (PED)",
      body: pedDefinition,
    },
    trd: {
      heading: "Tentative Release Date (TRD)",
      body: trdDefinition,
    },
    gbmd: {
      heading: "Good Time Balance/Mandatory Discharge (GB/MD)",
      body: gbmdDefinition,
    },
    lb191: {
      heading: "LB 191 Credits",
      body: lb191Definition,
    },
    jailCredits: {
      heading: "Jail Credits",
      body: jailCreditsDefinition,
    },
  },
  topLinkText: "Back to top",
  definitionsLinksHeading: "Other definitions",
  homeLink: "Back",
};
