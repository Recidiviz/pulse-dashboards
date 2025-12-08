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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { useRootStore } from "../../components/StoreProvider";
import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { ProfileCapsule } from "../PersonCapsules";
import { SectionLabelText } from "../sharedComponents";

const CaseloadWrapper = styled.ul`
  column-gap: ${rem(spacing.md)};
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(max(${rem(320)}, 30vw), 1fr));
  list-style-type: none;
  margin: 0;
  margin-top: ${rem(spacing.md)};
  padding: 0;
  row-gap: ${rem(spacing.sm)};
`;

function Caseload({ persons }: { persons: JusticeInvolvedPerson[] }) {
  if (!persons.length) return null;
  const items = persons.map((person) => (
    <li key={`externalId-${person.externalId}`}>
      <Link to={person.profileUrl}>
        <ProfileCapsule avatarSize="lg" person={person} textSize="sm" />
      </Link>
    </li>
  ));

  return <CaseloadWrapper>{items}</CaseloadWrapper>;
}

export const AllCaseloadsList = observer(function AllCaseloadsList() {
  const {
    workflowsStore: {
      searchStore: { caseloadPersonsGrouped, selectedSearchables },
    },
  } = useRootStore();

  return (
    <>
      {selectedSearchables.map((searchable) => (
        <React.Fragment key={searchable.searchId}>
          {caseloadPersonsGrouped[searchable.searchId] && (
            <SectionLabelText>
              <span className="fs-exclude">{searchable.searchLabel}</span>
            </SectionLabelText>
          )}
          {/* in practice there should never be a missing caseload,
            but fall back to an empty array for type safety */}
          <Caseload
            persons={caseloadPersonsGrouped[searchable.searchId] ?? []}
          />
        </React.Fragment>
      ))}
    </>
  );
});
