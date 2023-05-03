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

import { observer } from "mobx-react-lite";
import React from "react";

import { formatDate } from "../../utils";
import { Opportunity } from "../../WorkflowsStore";
import WorkflowsOfficerName from "../WorkflowsOfficerName";

type OpportunityWorkflowStatusProps = {
  opportunity: Opportunity;
};

export const WorkflowProgress: React.FC<OpportunityWorkflowStatusProps> =
  observer(function WorkflowProgress({ opportunity }) {
    const {
      lastViewed,
      isHydrated,
      supportsExternalRequest,
      externalRequestData,
      externalRequestStatusMessage,
    } = opportunity;

    if (!isHydrated) return null;

    if (supportsExternalRequest && externalRequestData?.status === "SUCCESS") {
      return (
        <>
          {externalRequestStatusMessage}{" "}
          {formatDate(externalRequestData.submitted.date.toDate())} by{" "}
          <WorkflowsOfficerName
            officerEmail={externalRequestData.submitted.by}
          />
        </>
      );
    }

    if (lastViewed) {
      return (
        <>
          Viewed on {formatDate(lastViewed.date.toDate())} by{" "}
          <WorkflowsOfficerName officerEmail={lastViewed.by} />
        </>
      );
    }

    return <>Needs review</>;
  });
