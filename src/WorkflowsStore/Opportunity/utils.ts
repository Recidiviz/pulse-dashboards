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
import { snakeCase } from "lodash";
import moment from "moment";
import simplur from "simplur";

import { FeatureGateError } from "../../errors";
import { FeatureVariant } from "../../RootStore/types";
import { pluralizeWord } from "../../utils";
import { JusticeInvolvedPersonBase } from "../JusticeInvolvedPersonBase";
import { ValidateFunction } from "../subscriptions";
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
  OpportunityRequirement,
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

// The next three types are internal to this file in order to have a type where either
// eligibilityText or fullText must be set
type OpportunityHeadersBaseType = {
  opportunityText: string;
  callToAction: string;
};

type OpportunityHeadersWithEligibilityTextType = OpportunityHeadersBaseType & {
  eligibilityText: string;
  fullText?: never;
};

type OpportunityHeadersWithFullTextType = OpportunityHeadersBaseType & {
  fullText: string;
  eligibilityText?: never;
};

export type OpportunityHeadersType =
  | OpportunityHeadersWithEligibilityTextType
  | OpportunityHeadersWithFullTextType;

export const generateOpportunityInitialHeader = (
  opportunityType: OpportunityType,
  justiceInvolvedPersonTitle: string,
  workflowsSearchFieldTitle: string
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
    case "usMeEarlyTermination":
      return "Search for officers above to review clients who may be good candidates for early termination from probation.";
    default:
      return `Search for ${pluralizeWord(
        workflowsSearchFieldTitle
      )} above to review and refer eligible ${pluralizeWord(
        justiceInvolvedPersonTitle
      )} for ${opportunityLabel.toLowerCase()}.`;
  }
};

export const generateOpportunityHydratedHeader = (
  opportunityType: OpportunityType,
  count: number
): OpportunityHeadersType => {
  const headers: Record<OpportunityType, OpportunityHeadersType> = {
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
    usMiSupervisionLevelDowngrade: {
      eligibilityText: simplur`${count} client[|s] within their first 6 months of supervision [is|are] being `,
      opportunityText:
        "supervised at a level that does not match their latest risk score",
      callToAction:
        "Review clients whose supervision level does not match their risk level and change supervision levels in OMNI.",
    },
    usMiClassificationReview: {
      eligibilityText: simplur`${count} client[|s] may be `,
      opportunityText: "eligible for a supervision level downgrade",
      callToAction:
        "Review clients who meet the time threshold for classification review and downgrade supervision levels in OMNI.",
    },
    usMiEarlyDischarge: {
      eligibilityText: simplur`${count} client[|s] may be `,
      opportunityText: "eligible for early discharge",
      callToAction:
        "Review clients who may be eligible for early discharge and complete discharge paperwork in OMNI.",
    },
    usMeWorkRelease: {
      eligibilityText: simplur`${count} client[|s] may be `,
      opportunityText:
        "eligible for the Community Transition Program (Work Release)",
      callToAction:
        "Search for case manager(s) below to review residents on their caseload who are approaching " +
        "Work Release eligibility and complete application paperwork.",
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
    usTnCustodyLevelDowngrade: {
      eligibilityText: simplur`${count} resident[|s] may be eligible for a`,
      opportunityText: "custody level downgrade",
      callToAction: "Review and update custody levels.",
    },
    usMoRestrictiveHousingStatusHearing: {
      fullText: simplur`${count} resident[|s] are currently in Restrictive Housing`,
      opportunityText: "Restrictive Housing Status Hearing",
      callToAction: "Conduct a Restrictive Housing Status Hearing",
    },
    usMeEarlyTermination: {
      eligibilityText: simplur`${count} client[|s] may be good [a|] candidate[|s] for `,
      opportunityText: "Early Termination",
      callToAction:
        "Search for officers above to review clients who may be good candidates for early termination from probation.",
    },
    // TODO: Update copy
    usMiMinimumTelephoneReporting: {
      eligibilityText: simplur`${count} client[|s] may be eligible for a downgrade to `,
      opportunityText: "minimum telephone reporting",
      callToAction:
        "Review clients who meet the requirements for minimum telephone reporting and change supervision levels in OMNI.",
    },
    usMiPastFTRD: {
      eligibilityText: simplur`${count} client[|s] ha[s|ve] `,
      opportunityText: "passed their full-term release date",
      callToAction:
        "Review clients who are past their full-term release date and complete discharges in Omni.",
    },
    usMeFurloughRelease: {
      eligibilityText: simplur`${count} resident[|s] may be eligible for the `,
      opportunityText: "Furlough Program",
      callToAction:
        "Search for case managers below to review residents on their caseload who are approaching standard furlough release eligibility and complete application paperwork.",
    },
    usCaSupervisionLevelDowngrade: {
      eligibilityText: simplur`${count} client[|s] may be `,
      opportunityText: "eligible for a supervision level downgrade",
      callToAction: "usCaSupervisionLevelDowngrade CTA",
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

export function sortByEligibilityDateUndefinedFirst(
  opp1: Opportunity,
  opp2: Opportunity
): number {
  if (!opp1.eligibilityDate) return -1;
  if (!opp2.eligibilityDate) return 1;
  return ascending(opp1.eligibilityDate, opp2.eligibilityDate);
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
  usMiSupervisionLevelDowngrade: sortByReviewStatusAndEligibilityDate,
  usMiClassificationReview: sortByReviewStatusAndEligibilityDate,
  usMiEarlyDischarge: sortByReviewStatusAndEligibilityDate,
  usMeSCCP: sortByReviewStatus,
  usMeWorkRelease: sortByReviewStatus,
  usTnExpiration: sortByReviewStatusAndEligibilityDate,
  usTnCustodyLevelDowngrade: sortByReviewStatus,
  usMoRestrictiveHousingStatusHearing: sortByEligibilityDateUndefinedFirst,
  usMeEarlyTermination: sortByReviewStatus,
  usMiMinimumTelephoneReporting: sortByReviewStatus,
  usMiPastFTRD: sortByReviewStatusAndEligibilityDate,
  usMeFurloughRelease: sortByReviewStatus,
  usCaSupervisionLevelDowngrade: sortByReviewStatusAndEligibilityDate,
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

type CriteriaGroupKey = "eligibleCriteria" | "ineligibleCriteria";

type WithCriteria = Record<CriteriaGroupKey, object>;

// Copy is defined as an array rather than a record so it can have a well-defined order
export type CriteriaCopy<R extends WithCriteria> = {
  [K in CriteriaGroupKey]: Array<[keyof R[K], OpportunityRequirement]>;
};

// Formatters are defined in a separate dict so the function type can depend on the criterion
export type CriteriaFormatters<R extends WithCriteria> = {
  [K in CriteriaGroupKey]?: {
    [C in keyof R[K]]?: Record<
      string,
      (criterion: Required<R[K]>[C], record: R) => string
    >;
  };
};

export function hydrateCriteria<
  R extends WithCriteria,
  C extends CriteriaGroupKey
>(
  record: R | undefined,
  criteriaGroupKey: C,
  criteriaCopy: CriteriaCopy<R>,
  criteriaFormatters: CriteriaFormatters<R> = {}
): OpportunityRequirement[] {
  if (!record) return [];

  return criteriaCopy[criteriaGroupKey]
    .filter(([criterionKey]) => criterionKey in record[criteriaGroupKey])
    .map(([criterionKey, copy]) => {
      const out: OpportunityRequirement = { ...copy };
      const criterion = record[criteriaGroupKey][criterionKey];

      const formatters = [
        ...Object.entries(
          criteriaFormatters[criteriaGroupKey]?.[criterionKey] ?? {}
        ),
        // Auto-generate fallback formatters
        ...Object.entries(criterion ?? {}).map(
          ([k, v]): [string, () => string] => [
            snakeCase(k).toUpperCase(),
            () => String(v),
          ]
        ),
      ];
      formatters.forEach(([name, fmt]) => {
        const placeholder = `$${name}`;
        const formatted = fmt(criterion, record);
        out.text = out.text.replaceAll(placeholder, formatted);
        if (out.tooltip) {
          out.tooltip = out.tooltip.replaceAll(placeholder, formatted);
        }
      });
      // TODO: Should we catch unreplaced placeholders? Might be false positives
      // since the syntax is so minimal
      return out;
    });
}

export function getFeatureVariantValidator<R>(
  person: JusticeInvolvedPersonBase,
  featureVariant: FeatureVariant,
  actualValidator?: ValidateFunction<R>
): ValidateFunction<R> {
  return (record: R): void => {
    if (!person.rootStore.workflowsStore.featureVariants[featureVariant]) {
      throw new FeatureGateError(
        `Opportunity is not enabled for this user without the ${featureVariant} flag.`
      );
    }
    if (actualValidator) actualValidator(record);
  };
}
