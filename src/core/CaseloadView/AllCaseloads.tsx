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
import { spacing } from "@recidiviz/design-system";
import { groupBy } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { SectionLabelText } from "../OpportunityCaseloadView/styles";
import { ProfileCapsule } from "../PersonCapsules";
import { workflowsUrl } from "../views";
import WorkflowsNoResults from "../WorkflowsNoResults";
import WorkflowsOfficerName from "../WorkflowsOfficerName";

const CaseloadWrapper = styled.ul`
  column-gap: ${rem(spacing.md)};
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${rem(320)}, 1fr));
  list-style-type: none;
  margin: 0;
  margin-top: ${rem(spacing.md)};
  padding: 0;
  row-gap: ${rem(spacing.sm)};
`;

const Caseload = ({ persons }: { persons: JusticeInvolvedPerson[] }) => {
  const items = persons.map((person) => (
    <li key={person.externalId}>
      <Link
        to={workflowsUrl("clientProfile", { clientId: person.pseudonymizedId })}
      >
        <ProfileCapsule avatarSize="lg" person={person} textSize="sm" />
      </Link>
    </li>
  ));

  return <CaseloadWrapper>{items}</CaseloadWrapper>;
};

export const AllCaseloads = observer(function AllCaseloads() {
  const {
    workflowsStore: {
      caseloadPersons,
      selectedOfficerIds,
      workflowsOfficerTitle,
    },
  } = useRootStore();

  if (!selectedOfficerIds.length)
    return (
      <WorkflowsNoResults
        headerText="All Clients"
        callToActionText={`Search for ${workflowsOfficerTitle}s above to view their entire caseload.`}
      />
    );

  const caseloads = groupBy(caseloadPersons, "assignedStaffId");

  return (
    <>
      {selectedOfficerIds.map((officerId) => (
        <React.Fragment key={officerId}>
          {selectedOfficerIds.length > 1 && (
            <SectionLabelText>
              <WorkflowsOfficerName officerId={officerId} />
            </SectionLabelText>
          )}
          {/* in practice there should never be a missing caseload,
              but fall back to an empty array for type safety */}
          <Caseload persons={caseloads[officerId] ?? []} />
        </React.Fragment>
      ))}
    </>
  );
});
