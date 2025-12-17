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
  infoPages: Record<string, { heading: string; body: string }>;
  topLinkText: string;
  definitionsLinksHeading: string;
  homeLink: string;
};

export const usNeCopy: UsNeCopy = {
  lastUpdated:
    "This information was last updated on {{formatFullDate goodTimeLastModifiedDate}}",
  home: {
    pageTitle: "Learn More About Your Sentence",
    headerFields: [
      { label: "Open Detainers:", value: "{{metadata.numHoldsAndDetainers}}" },
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
        value: "LB{{metadata.goodTimeLawNumber}}",
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
          summary: dedent`Your Tentative Release Date (TRD) is the estimated end of sentence.
        This date is updated upon changes to your sentence.

        Tentative Release Date is sometimes referred to as a “jam date.”`,
          metadataField: "tentativeReleaseDate",
        },
        {
          id: "ped",
          label: "Parole Eligibility Date (PED)",
          value: "{{formatFullDateOptional value 'No PE date'}}",
          summary: dedent`The Parole Eligibility Date (PED) only exists for individuals who may be eligible for parole.
          The Nebraska Board of Parole sets Parole Hearing Dates based on the outcomes of reviews.
          At the hearing, the Nebraska Board of Parole will make a decision on whether to grant parole.`,
          metadataField: "paroleEligibilityDate",
        },
        {
          id: "mmtd",
          label: "Mandatory Minimum Term Date (MMTD)",
          value: "{{formatFullDateOptional value 'No MMTD date'}}",
          summary: `The Mandatory Minimum Term Date (MMTD) is the date when the required minimum part of your sentence ends. The mandatory minimum term is set by the law based on your sentence.`,
          metadataField: "mandatoryMinimumDate",
        },
      ],
    },
    goodTimeBalances: {
      sectionTitle: "Balances to Keep Track Of",
      moreInfoLink: "Learn more",
      cards: [
        {
          id: "gbmd",
          label: "Good Time Balance/Mandatory Discharge Days (GB/MD)",
          value: `{{pluralize 'Day' metadata.goodTimeBalanceDays}}`,
          summary: dedent`These days are applied to your tentative release date upon intake.
          This is a type of good time that can be removed for Misconduct Reports (MRs).

          This type of credit is called GB/MD or Good Time Balance / Mandatory Discharge.`,
          metadataField: "goodTimeBalanceDays",
        },
        {
          id: "lgtr",
          label: "Lost Good Time (Restorable)",
          value: "{{pluralize 'Day' value}}",
          summary: dedent`This good time has been removed due to misconduct reports (MRs).
          You may apply to have these days restored after some time without misconduct reports.
          Ask your case manager for specific details on when you are eligible to ask for time back.

          This is already applied to your Tentative Release Date (TRD).`,
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
          label: "LB 191 Credits",
          value: `{{pluralize 'Day' value}}`,
          summary: dedent`After {{#if metadata.mandatoryMinimumDate}}your Mandatory Minimum Term Date{{else}}12 months{{/if}},
          you can earn an extra 3 days off your max sentence each month for good conduct.
          These days are applied to your TRD when they are accrued.`,
          metadataField: "lb191Credits",
        },
        {
          id: "jailCredits",
          label: "Jail Credits",
          value: `{{pluralize 'Day' value}}`,
          summary: dedent`Jail credits are the amount of time you served in jail before sentencing.
          These days are applied to your Tentative Release Date (TRD) upon intake.`,
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
  infoPages: {
    mmtd: {
      heading: "Mandatory Minimum Term Date",
      body: mmtdDefinition,
    },
    ped: {
      heading: "Parole Eligibility Date",
      body: pedDefinition,
    },
    trd: {
      heading: "Tentative Release Date",
      body: trdDefinition,
    },
    gbmd: {
      heading: "Good Time Balance/Mandatory Discharge Days (GB/MD)",
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
