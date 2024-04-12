// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

export function buildSnoozedByText({
  deniedTabTitle,
  snoozedOnDate,
  snoozedBy,
}: {
  deniedTabTitle: string;
  snoozedOnDate?: Date;
  snoozedBy?: string;
}): string | undefined {
  if (!snoozedOnDate || !snoozedBy) return;
  return `${deniedTabTitle.charAt(0).toUpperCase() + deniedTabTitle.slice(1).toLowerCase()} by ${snoozedBy} on ${format(
    snoozedOnDate,
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

export function buildSnoozedByTextAndResurfaceText(
  opportunity: Opportunity,
  snoozeUntil?: Date,
) {
  const snoozedByText = buildSnoozedByText(opportunity);
  const resurfaceText = buildResurfaceText(opportunity, snoozeUntil);
  return [snoozedByText, resurfaceText];
}

const MarkedIneligibleReasons: React.FC<{
  opportunity: Opportunity;
  snoozedByTextAndResurfaceTextPair: ReturnType<
    typeof buildSnoozedByTextAndResurfaceText
  >;
  denialReasons?: string[];
}> = ({ opportunity, snoozedByTextAndResurfaceTextPair, denialReasons }) => {
  const { enableSnooze } = useFeatureVariants();

  if (!denialReasons || !enableSnooze) return null;

  const ineligibleReasonsList = buildDenialReasonsListText(
    opportunity,
    denialReasons,
  );

  const snoozedByTextAndResurfaceText = snoozedByTextAndResurfaceTextPair.every(
    (text) => text,
  )
    ? snoozedByTextAndResurfaceTextPair.join(" ")
    : undefined;

  return (
    <MarkedIneligibleReasonsText className="MarkedIneligibleReasonsText">
      {snoozedByTextAndResurfaceText && (
        <>
          {" "}
          <div>{snoozedByTextAndResurfaceText} </div> <br />
        </>
      )}
      <div>
        {ineligibleReasonsList}
        {opportunity.denial?.otherReason ? (
          <OtherReasonText>
            &quot;{opportunity.denial.otherReason}&quot;
          </OtherReasonText>
        ) : null}
      </div>
    </MarkedIneligibleReasonsText>
  );
};
export default MarkedIneligibleReasons;
