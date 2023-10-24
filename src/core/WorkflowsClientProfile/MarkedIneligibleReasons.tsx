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
import { format, parseISO, startOfToday } from "date-fns";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { OTHER_KEY } from "../../WorkflowsStore/utils";
import { TextLink } from "../WorkflowsMilestones/styles";

const MarkedIneligibleReasonsText = styled.div`
  ${typography.Sans14}
  color: ${palette.pine1};
  background-color: ${palette.slate10};
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
`;

const MarkedIneligibleReasons: React.FC<{
  opportunity: Opportunity;
  currentUserEmail: string;
}> = observer(function MarkedIneligibleReason({
  opportunity,
  currentUserEmail,
}) {
  const {
    workflowsStore: {
      featureVariants: { enableSnooze },
    },
  } = useRootStore();

  const denialReasons = opportunity.denial?.reasons;
  const otherReason = opportunity.denial?.otherReason;
  if (!denialReasons) return null;

  function buildOtherText() {
    if (!(denialReasons ?? []).includes(OTHER_KEY)) return null;
    if (!otherReason) return ["Other"];
    return [`Other: ${otherReason}`];
  }

  const handleUndoClick = async () => {
    await opportunity.deleteOpportunityDenialAndSnooze();
  };

  const snoozeUntil: Date | undefined =
    opportunity.manualSnoozeUntilDate ??
    (opportunity?.autoSnooze?.snoozeUntil
      ? parseISO(opportunity?.autoSnooze?.snoozeUntil)
      : undefined);

  const resurfaceText =
    enableSnooze &&
    snoozeUntil &&
    `${opportunity.deniedTabTitle} by ${currentUserEmail} on ${format(
      startOfToday(),
      "LLLL d, yyyy"
    )}. ${
      opportunity.person.displayPreferredName
    } may be surfaced again on or after ${format(
      snoozeUntil,
      "LLLL d, yyyy"
    )}.`;

  return (
    <MarkedIneligibleReasonsText className="MarkedIneligibleReasonsText">
      {resurfaceText && (
        <>
          {" "}
          <div>
            {resurfaceText} <TextLink onClick={handleUndoClick}>Undo</TextLink>
          </div>{" "}
          <br />
        </>
      )}
      <div>
        Not eligible reasons:{" "}
        {denialReasons
          .filter((r) => r !== OTHER_KEY)
          .map((r) => opportunity.denialReasonsMap[r])
          .concat(buildOtherText() ?? [])
          .join(", ")}
      </div>
    </MarkedIneligibleReasonsText>
  );
});
export default MarkedIneligibleReasons;
