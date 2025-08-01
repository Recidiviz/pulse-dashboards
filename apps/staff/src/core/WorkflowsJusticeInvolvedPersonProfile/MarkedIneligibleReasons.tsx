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

import { spacing, typography } from "@recidiviz/design-system";
import { format, isEqual } from "date-fns";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { Denial, Submission } from "../../FirestoreStore";
import { appendDateSuffixIfMissing } from "../../utils";
import { Opportunity } from "../../WorkflowsStore";
import { formatSupervisionEndDatePhrase } from "./utils";

const MarkedIneligibleReasonsText = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
  background-color: ${palette.slate10};
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
`;

const OtherReasonText = styled.pre`
  ${typography.Sans14}
  color: ${palette.slate85};
  text-wrap: inherit;
  margin: ${rem(spacing.md)} 0 0 0;
`;

export function buildActedOnText({
  denial,
  isSubmitted,
  deniedTabTitle,
  snoozedOnDate,
  snoozedBy,
  submittedTabTitle,
  submittedUpdate,
  subcategoryCopy,
  actedOnTextAddition,
}: {
  denial?: Denial;
  isSubmitted: boolean;
  deniedTabTitle: string;
  snoozedOnDate?: Date;
  snoozedBy?: string;
  submittedTabTitle: string;
  submittedUpdate?: Submission;
  subcategoryCopy?: string;
  actedOnTextAddition?: string;
}): string | undefined {
  if (!isSubmitted && !denial) return;

  const status = denial ? deniedTabTitle : submittedTabTitle;
  const actionBy = denial ? snoozedBy : submittedUpdate?.by;
  const actionDate = denial ? snoozedOnDate : submittedUpdate?.date.toDate();

  if (!actionBy || !actionDate) return;

  const subcategorySubstr = subcategoryCopy ? `: ${subcategoryCopy}` : "";

  if (denial && actedOnTextAddition) {
    return `${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}${subcategorySubstr} by ${actionBy} on ${format(
      actionDate,
      "LLLL d, yyyy",
    )}${actedOnTextAddition}`;
  }

  return `${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}${subcategorySubstr} by ${actionBy} on ${format(
    actionDate,
    "LLLL d, yyyy",
  )}.`;
}

export function getusAzTprDtpAdditionalInformation(
  opportunity: Opportunity,
): JSX.Element | undefined {
  const usAzTprDtpAdditionalInformation = `Thank you for flagging an error in this person's TPR date in ACIS. Recidiviz will automatically report this information to Central Time Comp. If you have questions for their team, you're encouraged to reach out to them directly via email.`;
  if (
    [
      "usAzOverdueForACISTPR",
      "usAzOverdueForACISDTP",
      "usAzReleaseToDTP",
      "usAzReleaseToTPR",
    ].includes(opportunity.type)
  ) {
    return (
      <>
        <div>{usAzTprDtpAdditionalInformation}</div>
        <br />
      </>
    );
  }
}

export function buildResurfaceText(
  opportunity: Opportunity,
  snoozeUntil: Date | undefined,
  labels: { releaseDateCopy: string; supervisionEndDateCopy: string },
): string | undefined {
  if (!snoozeUntil) return;
  const { supervisionEndDateCopy, releaseDateCopy } = labels;
  const dateStr = format(snoozeUntil, "LLLL d, yyyy");
  const { person } = opportunity;

  let endDateString;

  if (
    "expirationDate" in person &&
    person.expirationDate instanceof Date &&
    isEqual(snoozeUntil, person.expirationDate)
  ) {
    endDateString = `${dateStr} is ${person.displayPreferredName}'s ${formatSupervisionEndDatePhrase(supervisionEndDateCopy)}.`;
  } else if (
    "releaseDate" in person &&
    person.releaseDate instanceof Date &&
    isEqual(snoozeUntil, person.releaseDate)
  ) {
    endDateString = `${dateStr} is ${person.displayPreferredName}'s ${appendDateSuffixIfMissing(releaseDateCopy)}.`;
  } else {
    endDateString = `${person.displayPreferredName} may be surfaced again on or after ${dateStr}.`;
  }

  if (opportunity.generateCaseNoteText) {
    return opportunity.generateCaseNoteText;
  }

  return endDateString;
}

export function buildDenialReasonsListText(
  opportunity: Opportunity,
  denialReasons: string[],
): string {
  const denialReasonsList = denialReasons.join(", ");
  const ineligibleReasonsListCopy = opportunity.config.isAlert
    ? "Override reasons:"
    : "Not eligible reasons:";

  return `${ineligibleReasonsListCopy}${" "}${denialReasonsList}`;
}

export function buildActedOnTextAndResurfaceText(
  opportunity: Opportunity,
  snoozeUntil: Date | undefined,
  labels: { releaseDateCopy: string; supervisionEndDateCopy: string },
) {
  const actedOnText = buildActedOnText(opportunity);
  const resurfaceText = buildResurfaceText(opportunity, snoozeUntil, labels);
  return [actedOnText, resurfaceText];
}

const MarkedIneligibleReasons: React.FC<{
  opportunity: Opportunity;
  actedOnTextAndResurfaceTextPair: ReturnType<
    typeof buildActedOnTextAndResurfaceText
  >;
  denialReasons?: string[];
}> = ({ opportunity, actedOnTextAndResurfaceTextPair, denialReasons }) => {
  if (opportunity.isSubmitted) {
    return (
      <MarkedIneligibleReasonsText className="MarkedIneligibleReasonsText">
        <div>{`Marked as ${actedOnTextAndResurfaceTextPair[0]}`} </div>
      </MarkedIneligibleReasonsText>
    );
  }

  if (!denialReasons) return null;

  const ineligibleReasonsList = buildDenialReasonsListText(
    opportunity,
    denialReasons,
  );

  const actedOnTextAndResurfaceText = actedOnTextAndResurfaceTextPair.every(
    (text) => text,
  )
    ? actedOnTextAndResurfaceTextPair.join(" ")
    : undefined;

  return (
    <MarkedIneligibleReasonsText className="MarkedIneligibleReasonsText">
      {actedOnTextAndResurfaceText && (
        <>
          {" "}
          <div>{actedOnTextAndResurfaceText} </div> <br />
          {getusAzTprDtpAdditionalInformation(opportunity)}
        </>
      )}
      {opportunity.denial && (
        <div>
          {ineligibleReasonsList}
          {opportunity.denial?.otherReason ? (
            <OtherReasonText>
              &quot;{opportunity.denial.otherReason}&quot;
            </OtherReasonText>
          ) : null}
        </div>
      )}
    </MarkedIneligibleReasonsText>
  );
};
export default MarkedIneligibleReasons;
