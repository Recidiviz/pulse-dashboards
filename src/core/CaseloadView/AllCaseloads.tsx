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
import { pluralizeWord, toTitleCase } from "../../utils";
import { Client, JusticeInvolvedPerson } from "../../WorkflowsStore";
import { SectionLabelText } from "../OpportunityCaseloadView/styles";
import { ProfileCapsule } from "../PersonCapsules";
import { workflowsUrl } from "../views";
import WorkflowsResults from "../WorkflowsResults";

const CaseloadWrapper = styled.ul<{
  isTwoColumns?: boolean;
}>`
  column-gap: ${rem(spacing.md)};
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(
      max(${rem(320)}, ${({ isTwoColumns }) => (isTwoColumns ? 3 : 2)}0vw),
      1fr
    )
  );
  list-style-type: none;
  margin: 0;
  margin-top: ${rem(spacing.md)};
  padding: 0;
  row-gap: ${rem(spacing.sm)};
`;

function Caseload({
  persons,
  isResponsiveRevamp,
}: {
  persons: JusticeInvolvedPerson[];
  isResponsiveRevamp?: boolean;
}) {
  const items = persons.map((person) => (
    <li key={`externalId-${person.externalId}`}>
      <Link
        to={workflowsUrl(
          person instanceof Client ? "clientProfile" : "residentProfile",
          { justiceInvolvedPersonId: person.pseudonymizedId }
        )}
      >
        <ProfileCapsule avatarSize="lg" person={person} textSize="sm" />
      </Link>
    </li>
  ));

  return (
    <CaseloadWrapper isTwoColumns={isResponsiveRevamp}>{items}</CaseloadWrapper>
  );
}

export const AllCaseloads = observer(function AllCaseloads() {
  const {
    workflowsStore: {
      caseloadPersons,
      selectedSearchables,
      workflowsSearchFieldTitle,
      justiceInvolvedPersonTitle,
      featureVariants,
    },
  } = useRootStore();

  if (!selectedSearchables.length)
    return (
      <WorkflowsResults
        headerText={`All ${toTitleCase(justiceInvolvedPersonTitle)}s`}
        callToActionText={`Search for ${pluralizeWord(
          workflowsSearchFieldTitle
        )} above to view their entire caseload.`}
      />
    );

  const caseloads = groupBy(caseloadPersons, "searchIdValue");

  const allCaseloadsViz = (
    <>
      {selectedSearchables.map((searchable) => (
        <React.Fragment key={searchable.searchId}>
          {selectedSearchables.length > 1 && (
            <SectionLabelText>
              <span className="fs-exclude">{searchable.searchLabel}</span>
            </SectionLabelText>
          )}
          {/* in practice there should never be a missing caseload,
          but fall back to an empty array for type safety */}
          <Caseload
            persons={caseloads[searchable.searchId] ?? []}
            isResponsiveRevamp={!!featureVariants.responsiveRevamp}
          />
        </React.Fragment>
      ))}
    </>
  );

  return !featureVariants.responsiveRevamp ? (
    allCaseloadsViz
  ) : (
    <WorkflowsResults
      headerText={`All ${toTitleCase(justiceInvolvedPersonTitle)}s (${
        caseloadPersons.length
      })`}
    >
      {allCaseloadsViz}
    </WorkflowsResults>
  );
});
