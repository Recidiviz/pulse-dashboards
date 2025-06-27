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

import { Sans12, spacing } from "@recidiviz/design-system";
import { addDays } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { observer } from "mobx-react-lite";
import React from "react";
import styled from "styled-components/macro";

import {
  formatWorkflowsDate,
  formatWorkflowsDateWithTime,
} from "../../../../../src/utils";
import PersonIcon from "../../../../assets/static/images/person.svg?react";
import { OfficerAction } from "../../../../FirestoreStore";
import { UsIaEarlyDischargeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsIa/index";
import {
  DetailsBox,
  DetailsHeading,
  DetailsSection,
  SecureSmallDetailsCopy,
  SmallDetailsHeader,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

const PersonInfoWrapper = styled.div`
  display: flex;
`;

function OfficerActionContents({
  action,
}: {
  action: OfficerAction;
}): React.ReactElement | undefined {
  if (action.type === "APPROVAL") {
    if (!action.notes) {
      return undefined;
    }
    return <SecureSmallDetailsCopy>{action.notes}</SecureSmallDetailsCopy>;
  } else {
    const denialReasons = `Denial Reasons: ${action.denialReasons.join(", ")}`;
    const snooze = `Snooze: ${action.requestedSnoozeLength} Days (Will resurface: ${formatWorkflowsDate(addDays(new Date(), action.requestedSnoozeLength))})`;

    return (
      <div>
        <SecureSmallDetailsCopy>{action.actionPlan}</SecureSmallDetailsCopy>
        <SecureSmallDetailsCopy style={{ marginTop: spacing.sm }}>
          {denialReasons}
        </SecureSmallDetailsCopy>
        <SecureSmallDetailsCopy style={{ marginTop: spacing.sm }}>
          {snooze}
        </SecureSmallDetailsCopy>
      </div>
    );
  }
}

function PersonHeader({
  personName,
  date,
}: {
  personName: string;
  date: Timestamp;
}): React.ReactElement | null {
  return (
    <SmallDetailsHeader>
      <PersonInfoWrapper>
        <PersonIcon />
        <Sans12>{personName}</Sans12>
      </PersonInfoWrapper>
      <Sans12>{formatWorkflowsDateWithTime(date.toDate())}</Sans12>
    </SmallDetailsHeader>
  );
}

function ActionEntry({
  action,
}: {
  action: OfficerAction;
}): React.ReactElement | null {
  if (isApprovalWithEmptyNotes(action)) {
    return null;
  }
  const response = action.supervisorResponse;
  return (
    <>
      {response?.revisionRequest && (
        <DetailsBox>
          <PersonHeader personName={response.by} date={response.date} />
          <SecureSmallDetailsCopy>
            {response.revisionRequest}
          </SecureSmallDetailsCopy>
        </DetailsBox>
      )}
      <DetailsBox>
        <PersonHeader personName={action.by} date={action.date} />
        <OfficerActionContents action={action}></OfficerActionContents>
      </DetailsBox>
    </>
  );
}

const isApprovalWithEmptyNotes = (action: OfficerAction) =>
  action.type === "APPROVAL" && !action.notes;

export const UsIaActionPlansAndNotes = observer(
  function UsIaActionPlansAndNotes({
    opportunity,
  }: OpportunityProfileProps): React.ReactElement | null {
    if (
      !(opportunity instanceof UsIaEarlyDischargeOpportunity) ||
      !opportunity.mostRecentActions?.length ||
      opportunity.mostRecentActions.every(isApprovalWithEmptyNotes)
    ) {
      return null;
    }

    return (
      <DetailsSection>
        <DetailsHeading>Action Plans and Notes</DetailsHeading>
        {opportunity.mostRecentActions.reverse().map((action) => (
          <ActionEntry action={action} />
        ))}
      </DetailsSection>
    );
  },
);
