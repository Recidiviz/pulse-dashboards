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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import simplur from "simplur";
import styled from "styled-components/macro";

// TODO: Gut this entire document, so it uses the new caseload presenter.
import {
  useOpportunityConfigurations,
  useRootStore,
} from "../../components/StoreProvider";
import { pluralizeWord } from "../../utils";
import {
  generateOpportunityInitialHeader,
  OpportunityType,
} from "../../WorkflowsStore";
import cssVars from "../CoreConstants.module.scss";
import { CaseloadOpportunitiesHydrator } from "../OpportunitiesHydrator";
import WorkflowsResults from "../WorkflowsResults";
import { HydratedOpportunityPersonList } from "./HydratedOpportunityPersonList";

export const PersonList = styled.ul`
  column-gap: ${rem(spacing.md)};
  display: grid;
  grid-template-columns: 100%;
  list-style-type: none;
  margin: 0;
  padding: 0;
  row-gap: ${rem(spacing.sm)};

  @media screen and (min-width: ${cssVars.breakpointSm}) {
    grid-template-columns: 50% 50%;
  }
`;

const Empty = observer(function Empty() {
  const {
    workflowsStore: {
      selectedOpportunityType: opportunityType,
      selectedSearchIds,
      justiceInvolvedPersonTitle,
      workflowsSearchFieldTitle,
    },
  } = useRootStore();

  const opportunityConfigs = useOpportunityConfigurations();

  if (!opportunityType) return null;

  const { label } = opportunityConfigs[opportunityType];
  return (
    <WorkflowsResults
      callToActionText={simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
        selectedSearchIds.length,
      ]} ${pluralizeWord(
        workflowsSearchFieldTitle,
        selectedSearchIds.length,
      )}['s|'] caseloads are eligible for ${label.toLowerCase()}. Search for another ${workflowsSearchFieldTitle}.`}
    />
  );
});

const Hydrated = observer(function Hydrated({
  opportunityType,
}: {
  opportunityType: OpportunityType;
}) {
  const {
    workflowsStore: {
      allOpportunitiesByType,
      selectedPerson,
      justiceInvolvedPersonTitle,
    },
  } = useRootStore();
  return (
    <HydratedOpportunityPersonList
      allOpportunitiesByType={allOpportunitiesByType}
      opportunityType={opportunityType}
      justiceInvolvedPersonTitle={justiceInvolvedPersonTitle}
      selectedPerson={selectedPerson}
    />
  );
});

export const OpportunityPersonList = observer(function OpportunityPersonList() {
  const {
    workflowsStore: {
      selectedOpportunityType: opportunityType,
      justiceInvolvedPersonTitle,
      workflowsSearchFieldTitle,
    },
  } = useRootStore();
  const opportunityConfigs = useOpportunityConfigurations();

  if (!opportunityType) return null;

  const { label, initialHeader } = opportunityConfigs[opportunityType];

  const cta =
    initialHeader ||
    generateOpportunityInitialHeader(
      label,
      justiceInvolvedPersonTitle,
      workflowsSearchFieldTitle,
    );

  const empty = <Empty />;

  const initial = (
    <WorkflowsResults headerText={label} callToActionText={cta} />
  );

  const hydrated = <Hydrated opportunityType={opportunityType} />;

  return (
    <CaseloadOpportunitiesHydrator
      {...{ initial, empty, hydrated, opportunityTypes: [opportunityType] }}
    />
  );
});
