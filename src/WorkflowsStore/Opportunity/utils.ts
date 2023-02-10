// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { ascending } from "d3-array";
import { differenceInDays, differenceInMonths, format } from "date-fns";
import moment from "moment";
import simplur from "simplur";

import { optionalFieldToDate } from "../utils";
import {
  COMPLIANT_REPORTING_ALMOST_CRITERIA_RANKED,
  CompliantReportingOpportunity,
} from "./CompliantReportingOpportunity";
import {
  Opportunity,
  OPPORTUNITY_LABELS,
  OPPORTUNITY_STATUS_RANKED,
  OpportunityCaseNote,
  OpportunityType,
} from "./types";

export function rankByReviewStatus(opp: Opportunity): number {
  if (opp instanceof CompliantReportingOpportunity) {
    if (opp.almostEligible) {
      // sort denials to the bottom
      if (opp.reviewStatus === "DENIED") {
        return COMPLIANT_REPORTING_ALMOST_CRITERIA_RANKED.length;
      }
      return Math.min(
        ...opp.validAlmostEligibleKeys.map((key) =>
          COMPLIANT_REPORTING_ALMOST_CRITERIA_RANKED.indexOf(key)
        )
      );
    }
  }
  return OPPORTUNITY_STATUS_RANKED.indexOf(opp.reviewStatus);
}

export function formatNoteDate(date: Date): string {
  return format(date, "MMMM do");
}

export type OpportunityHeadersType = {
  eligibilityText: string;
  opportunityText: string;
  callToAction: string;
};

export const generateOpportunityInitialHeader = (
  opportunityType: OpportunityType
): string => {
  const opportunityLabel = OPPORTUNITY_LABELS[opportunityType];

  switch (opportunityType) {
    case "pastFTRD":
      return "Search for officers above to review clients whose full-term release date has passed.";
    case "usTnExpiration":
      return "Search for officers above to review clients who may be on or past their supervision expiration date.";
    case "usMeSCCP":
      return (
        "Search for case managers above to review residents in their unit who are approaching SCCP " +
        "eligibility and complete application paperwork."
      );
    default:
      return `Search for officers above to review and refer eligible clients for ${opportunityLabel.toLowerCase()}.`;
  }
};

export const generateOpportunityHydratedHeader = (
  opportunityType: OpportunityType,
  count: number
): OpportunityHeadersType => {
  const headers = {
    compliantReporting: {
      eligibilityText: simplur`${count} client[|s] may be eligible for `,
      opportunityText: "Compliant Reporting",
      callToAction:
        "Review and refer eligible clients for Compliant Reporting.",
    },
    earlyTermination: {
      eligibilityText: simplur`${count} client[|s] may be eligible for `,
      opportunityText: "early termination",
      callToAction:
        "Review clients eligible for early termination and download the paperwork to file with the Court.",
    },
    earnedDischarge: {
      eligibilityText: simplur`${count} client[|s] may be eligible for `,
      opportunityText: `earned discharge`,
      callToAction: `Review clients who may be eligible for Earned Discharge and complete a pre-filled request form.`,
    },
    LSU: {
      eligibilityText: simplur`${count} client[|s] may be eligible for the `,
      opportunityText: `Limited Supervision Unit`,
      callToAction: `Review clients who may be eligible for LSU and complete a pre-filled transfer chrono.`,
    },
    pastFTRD: {
      eligibilityText: simplur`${count} client[|s] ha[s|ve] `,
      opportunityText: "passed their full-term release date",
      callToAction:
        "Review clients who are past their full-term release date and email clerical to move them to history.",
    },
    supervisionLevelDowngrade: {
      eligibilityText: simplur`${count} client[|s] may be `,
      opportunityText:
        "supervised at a higher level than their latest risk score",
      callToAction: "Change their supervision level in TOMIS.",
    },
    usIdSupervisionLevelDowngrade: {
      eligibilityText: simplur`${count} client[|s] [is|are] being `,
      opportunityText:
        "supervised at a level that does not match their latest risk score",
      callToAction: "Change their supervision level in Atlas",
    },
    usMeSCCP: {
      eligibilityText: simplur`${count} resident[|s] may be eligible for `,
      opportunityText: "Supervised Community Confinement Program",
      callToAction:
        "Search for case managers above to review residents in their unit who are approaching " +
        "SCCP eligibility and complete application paperwork.",
    },
    usTnExpiration: {
      eligibilityText: simplur`${count} client[|s] may be `,
      opportunityText: "on or past their expiration date",
      callToAction:
        "Review these clients and complete their auto-generated TEPE Note.",
    },
  };

  return headers[opportunityType];
};

export function sortByReviewStatus(
  opp1: Opportunity,
  opp2: Opportunity
): number {
  // Use the review status on the opportunity to sort.
  // Compliant Reporting has additional conditions to determine the value of the rank.
  const opp1ReviewStatus = rankByReviewStatus(opp1);
  const opp2ReviewStatus = rankByReviewStatus(opp2);

  return ascending(opp1ReviewStatus, opp2ReviewStatus);
}

export function sortByReviewStatusAndEligibilityDate(
  opp1: Opportunity,
  opp2: Opportunity
): number {
  // First, sort by review status
  const rankSort = sortByReviewStatus(opp1, opp2);
  if (rankSort === 0) {
    // If the ranks are equivalent, sort by eligibilityDate
    if (opp1.eligibilityDate && opp2.eligibilityDate) {
      return ascending(opp1.eligibilityDate, opp2.eligibilityDate);
    }
  }
  return rankSort;
}

export const opportunityToSortFunctionMapping: Record<
  OpportunityType,
  (a: Opportunity, b: Opportunity) => number
> = {
  earlyTermination: sortByReviewStatus,
  compliantReporting: sortByReviewStatus,
  earnedDischarge: sortByReviewStatusAndEligibilityDate,
  LSU: sortByReviewStatusAndEligibilityDate,
  pastFTRD: sortByReviewStatusAndEligibilityDate,
  supervisionLevelDowngrade: sortByReviewStatus,
  usIdSupervisionLevelDowngrade: sortByReviewStatusAndEligibilityDate,
  usMeSCCP: sortByReviewStatus,
  usTnExpiration: sortByReviewStatusAndEligibilityDate,
};

export const transformCaseNotes = (
  caseNotes: Record<string, Record<string, string>[]> | undefined
): Record<string, OpportunityCaseNote[]> => {
  if (!caseNotes) return {};

  return Object.keys(caseNotes).reduce(
    (processedNotes: Record<string, OpportunityCaseNote[]>, section) => {
      return {
        ...processedNotes,
        [section]: caseNotes[section].map((note) => ({
          noteTitle: note.noteTitle,
          noteBody: note.noteBody,
          eventDate: optionalFieldToDate(note.eventDate),
        })),
      };
    },
    {}
  );
};

export const defaultFormValueJoiner = (
  ...items: (string | undefined)[]
): string => items.filter((item) => item && item !== "").join("\n");

export const formatFormValueDateMMDDYYYYY = (date: string | Date): string =>
  moment(date).format("MM/DD/YYYY");

export const displayString = (
  str: string | undefined,
  prefix?: string
): string => {
  const displayText = str || "";
  return !prefix ? displayText : `${prefix} ${displayText}`;
};

export const displayList = (
  lst: string[] | undefined,
  prefix?: string
): string => {
  const hasContents = lst?.length;
  const displayText = hasContents ? lst.join(", ") : "";
  return !prefix || !hasContents ? displayText : `${prefix} ${displayText}`;
};

export const monthsOrDaysRemainingFromToday = (eligibleDate: Date): string => {
  const months = differenceInMonths(eligibleDate, new Date());
  if (months === 0) {
    return simplur`${differenceInDays(eligibleDate, new Date())} more day[|s]`;
  }
  return simplur`${months} more month[|s]`;
};
