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

import { palette, typography } from "@recidiviz/design-system";
import { format } from "date-fns";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { useFeatureVariants } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { TextLink } from "../WorkflowsMilestones/styles";

const MarkedIneligibleReasonsText = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
  background-color: ${palette.slate10};
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
`;

export function buildSnoozedByText(
  opportunity: Opportunity,
  snoozedOnDate?: Date,
  snoozedBy?: string
): string | undefined {
  if (!snoozedOnDate || !snoozedBy) return;
  return `${opportunity.deniedTabTitle} by ${snoozedBy} on ${format(
    snoozedOnDate,
    "LLLL d, yyyy"
  )}.`;
}

export function buildResurfaceText(
  opportunity: Opportunity,
  snoozeUntil?: Date
): string | undefined {
  if (!snoozeUntil) return;
  return `${
    opportunity.person.displayPreferredName
  } may be surfaced again on or after ${format(snoozeUntil, "LLLL d, yyyy")}.`;
}

export function buildDenialReasonsListText(
  opportunity: Opportunity,
  denialReasons: string[]
): string {
  const denialReasonsList = denialReasons.join(", ");
  const ineligibleReasonsListCopy = opportunity.isAlert
    ? "Override reasons:"
    : "Not eligible reasons:";

  return `${ineligibleReasonsListCopy}${" "}${denialReasonsList}`;
}

const MarkedIneligibleReasons: React.FC<{
  opportunity: Opportunity;
  snoozeUntil?: Date;
  denialReasons?: string[];
}> = observer(function MarkedIneligibleReason({
  opportunity,
  snoozeUntil,
  denialReasons,
}) {
  const { enableSnooze } = useFeatureVariants();

  if (!denialReasons || !enableSnooze) return null;

  const handleUndoClick = async () => {
    await opportunity.deleteOpportunityDenialAndSnooze();
  };

  const snoozedByText = buildSnoozedByText(
    opportunity,
    opportunity.snoozedOnDate,
    opportunity.snoozedBy
  );

  const resurfaceText = buildResurfaceText(opportunity, snoozeUntil);

  const ineligibleReasonsList = buildDenialReasonsListText(
    opportunity,
    denialReasons
  );

  return (
    <MarkedIneligibleReasonsText className="MarkedIneligibleReasonsText">
      {snoozedByText && resurfaceText && (
        <>
          {" "}
          <div>
            {snoozedByText} {resurfaceText}{" "}
            <TextLink onClick={handleUndoClick}>Undo</TextLink>
          </div>{" "}
          <br />
        </>
      )}
      <div>{ineligibleReasonsList}</div>
    </MarkedIneligibleReasonsText>
  );
});
export default MarkedIneligibleReasons;