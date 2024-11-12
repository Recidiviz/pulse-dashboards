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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { format, isEqual } from "date-fns";
import { rem } from "polished";
import styled from "styled-components/macro";

import { useFeatureVariants } from "../../components/StoreProvider";
import { Denial, Submission } from "../../FirestoreStore";
import { Opportunity } from "../../WorkflowsStore";

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
}: {
  denial?: Denial;
  isSubmitted: boolean;
  deniedTabTitle: string;
  snoozedOnDate?: Date;
  snoozedBy?: string;
  submittedTabTitle: string;
  submittedUpdate?: Submission;
  subcategoryCopy?: string;
}): string | undefined {
  if (!isSubmitted && !denial) return;

  const status = denial ? deniedTabTitle : submittedTabTitle;
  const actionBy = denial ? snoozedBy : submittedUpdate?.by;
  const actionDate = denial ? snoozedOnDate : submittedUpdate?.date.toDate();

  if (!actionBy || !actionDate) return;

  const subcategorySubstr = subcategoryCopy ? `: ${subcategoryCopy}` : "";

  return `${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}${subcategorySubstr} by ${actionBy} on ${format(
    actionDate,
    "LLLL d, yyyy",
  )}.`;
}

export function buildResurfaceText(
  opportunity: Opportunity,
  snoozeUntil?: Date,
): string | undefined {
  if (!snoozeUntil) return;
  const dateStr = format(snoozeUntil, "LLLL d, yyyy");
  const { person } = opportunity;
  if (
    "expirationDate" in person &&
    person.expirationDate instanceof Date &&
    isEqual(snoozeUntil, person.expirationDate)
  ) {
    return `${dateStr} is ${person.displayPreferredName}'s supervision end date.`;
  }
  if (
    "releaseDate" in person &&
    person.releaseDate instanceof Date &&
    isEqual(snoozeUntil, person.releaseDate)
  ) {
    return `${dateStr} is ${person.displayPreferredName}'s release date.`;
  }
  return `${person.displayPreferredName} may be surfaced again on or after ${dateStr}.`;
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
  snoozeUntil?: Date,
) {
  const actedOnText = buildActedOnText(opportunity);
  const resurfaceText = buildResurfaceText(opportunity, snoozeUntil);
  return [actedOnText, resurfaceText];
}

const MarkedIneligibleReasons: React.FC<{
  opportunity: Opportunity;
  actedOnTextAndResurfaceTextPair: ReturnType<
    typeof buildActedOnTextAndResurfaceText
  >;
  denialReasons?: string[];
}> = ({ opportunity, actedOnTextAndResurfaceTextPair, denialReasons }) => {
  const { enableSnooze } = useFeatureVariants();

  if (opportunity.isSubmitted) {
    return (
      <MarkedIneligibleReasonsText className="MarkedIneligibleReasonsText">
        <div>{`Marked as ${actedOnTextAndResurfaceTextPair[0]}`} </div>
      </MarkedIneligibleReasonsText>
    );
  }

  if (!denialReasons || !enableSnooze) return null;

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
