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
import styled from "styled-components";

import { StaffRecord, SystemId } from "~datatypes";

import {
  formatWorkflowsDate,
  formatWorkflowsDateWithTime,
} from "../../../../src/utils";
import PersonIcon from "../../../assets/static/images/person.svg?react";
import { useRootStore } from "../../../components/StoreProvider";
import { OfficerRequest } from "../../../FirestoreStore";
import { SearchType } from "../../models/types";
import { getOfficerFullName } from "../../WorkflowsOfficerName/getOfficerFullName";
import {
  DetailsBox,
  DetailsHeading,
  DetailsSection,
  SecureSmallDetailsCopy,
  SmallDetailsHeader,
} from "../styles";
import { OpportunityProfileProps } from "../types";

/**
 * A timeline of the most recent officer actions requiring supervisor approval and the
 * corresponding supervisor responses.
 */

const PersonInfoWrapper = styled.div`
  display: flex;
`;

function OfficerActionContents({
  action,
}: {
  action: OfficerRequest;
}): React.ReactElement<any> | undefined {
  if (action.type === "APPROVAL") {
    return (
      <div>
        <SecureSmallDetailsCopy>
          Request for Grant Review
        </SecureSmallDetailsCopy>
        {action.notes && (
          <SecureSmallDetailsCopy>{action.notes}</SecureSmallDetailsCopy>
        )}
      </div>
    );
  }

  const denialReasons = `Denial Reasons: ${action.denialReasons.join(", ")}`;
  const snooze = action?.requestedSnoozeLength
    ? `Snooze: ${action.requestedSnoozeLength} Days (Will resurface: ${formatWorkflowsDate(addDays(new Date(), action.requestedSnoozeLength))})`
    : "Snooze: Indefinite (Will not resurface)";

  return (
    <div>
      <SecureSmallDetailsCopy>Request for Snooze Review</SecureSmallDetailsCopy>
      {action.actionPlan && (
        <SecureSmallDetailsCopy>{action.actionPlan}</SecureSmallDetailsCopy>
      )}
      <SecureSmallDetailsCopy style={{ marginTop: spacing.sm }}>
        {denialReasons}
      </SecureSmallDetailsCopy>
      {snooze && (
        <SecureSmallDetailsCopy style={{ marginTop: spacing.sm }}>
          {snooze}
        </SecureSmallDetailsCopy>
      )}
    </div>
  );
}

function resolveDisplayName(
  by: string,
  updateById: string | undefined,
  officers: StaffRecord[],
  searchType: SearchType | undefined,
  currentUserEmail: string | undefined,
): string {
  if (by.trim() !== "") {
    return by.trim();
  }
  if (updateById) {
    return (
      getOfficerFullName(officers, updateById, undefined, searchType) ??
      updateById
    );
  }
  return currentUserEmail ?? "";
}

function PersonHeader({
  personName,
  date,
}: {
  personName: string;
  date: Timestamp;
}): React.ReactElement<any> | null {
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

/**
 * For a given officer action, display the action and the supervisor response (if one exists)
 */
const ActionEntry = observer(function ActionEntry({
  action,
  systemType,
}: {
  action: OfficerRequest;
  systemType: SystemId;
}): React.ReactElement<any> | null {
  const response = action.supervisorResponse;
  let actionText: string;
  if (action.type === "DENIAL" && !action.requestedSnoozeLength) {
    actionText = "indefinite snooze";
  } else if (action.type === "DENIAL") {
    actionText = "snooze";
  } else {
    actionText = "grant";
  }

  const responseTypeVerb = {
    APPROVAL: "Approved request",
    DENIAL: "Denied request",
    REVISION: "Requested revisions",
  };

  const {
    workflowsStore: {
      availableOfficersWithOrWithoutCaseloads,
      availableOfficers,
      searchStore: { searchType },
    },
    userStore: { userEmail },
  } = useRootStore();

  const officers =
    systemType === "INCARCERATION"
      ? availableOfficers
      : availableOfficersWithOrWithoutCaseloads;

  const responseText = `${response ? responseTypeVerb[response.type] : "Response"} for ${actionText}`;
  const actionBy = resolveDisplayName(
    action.by,
    action.updateById,
    officers,
    searchType,
    userEmail,
  );

  return (
    <>
      {response && (
        <DetailsBox>
          <PersonHeader
            personName={resolveDisplayName(
              response.by,
              response.updateById,
              officers,
              searchType,
              userEmail,
            )}
            date={response.date}
          />
          <SecureSmallDetailsCopy>{responseText}</SecureSmallDetailsCopy>
          {response.type === "DENIAL" && response.revisionRequest && (
            <SecureSmallDetailsCopy>
              {`Revisions request: ${response.revisionRequest}`}
            </SecureSmallDetailsCopy>
          )}
          {response.type === "REVISION" && (
            <SecureSmallDetailsCopy>
              {`Reason: ${response.notes}`}
            </SecureSmallDetailsCopy>
          )}
        </DetailsBox>
      )}
      <DetailsBox>
        <PersonHeader personName={actionBy} date={action.date} />
        <OfficerActionContents action={action}></OfficerActionContents>
      </DetailsBox>
    </>
  );
});

export const ActionHistory = observer(function ActionHistory({
  opportunity,
}: OpportunityProfileProps): React.ReactElement<any> | null {
  if (!opportunity.actionHistory?.length) {
    return null;
  }

  return (
    <DetailsSection>
      <DetailsHeading>Action History</DetailsHeading>
      {opportunity.actionHistory.toReversed().flatMap((action) => (
        <ActionEntry
          action={action}
          systemType={opportunity.config.systemType}
          key={action.date.toString()}
        />
      ))}
    </DetailsSection>
  );
});
