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
import { intersection } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useMemo, useState } from "react";
import simplur from "simplur";
import styled from "styled-components/macro";

import {
  useOpportunityConfigurations,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { pluralizeWord } from "../../utils";
import {
  countOpportunities,
  generateOpportunityHydratedHeader,
  generateOpportunityInitialHeader,
  OpportunityTab,
} from "../../WorkflowsStore";
import { getTabOrderForOpportunityType } from "../../WorkflowsStore/Opportunity/utils/tabUtils";
import cssVars from "../CoreConstants.module.scss";
import { CaseloadOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { Heading, SubHeading } from "../sharedComponents";
import WorkflowsResults from "../WorkflowsResults";
import WorkflowsTabbedPersonList from "../WorkflowsTabbedPersonList";
import CaseloadOpportunityGrid from "./CaseloadOpportunityGrid";
import { OpportunityPreviewModal } from "./OpportunityPreviewModal";

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

const HydratedOpportunityPersonList = observer(
  function HydratedOpportunityPersonList() {
    const {
      workflowsStore: {
        selectedOpportunityType: opportunityType,
        opportunitiesByTab,
        allOpportunitiesByType,
        selectedPerson,
      },
      analyticsStore,
    } = useRootStore();

    const opportunityConfigs = useOpportunityConfigurations();

    const { isMobile } = useIsMobile(true);

    const oppsFromOpportunitiesByTab = useMemo(() => {
      if (opportunitiesByTab && opportunityType) {
        const oppsRecord = opportunitiesByTab[opportunityType];
        return oppsRecord;
      }
      return undefined;
    }, [opportunitiesByTab, opportunityType]);

    const oppsFromOpportunitiesByOppType = useMemo(() => {
      if (allOpportunitiesByType && opportunityType) {
        return allOpportunitiesByType[opportunityType];
      }
      return undefined;
    }, [allOpportunitiesByType, opportunityType]);

    const displayTabs = useMemo(() => {
      return oppsFromOpportunitiesByTab && opportunityType
        ? intersection(
            getTabOrderForOpportunityType(opportunityType),
            Object.keys(oppsFromOpportunitiesByTab),
          )
        : [];
    }, [opportunityType, oppsFromOpportunitiesByTab]) as OpportunityTab[];

    const [activeTab, setActiveTab] = useState<OpportunityTab>(displayTabs[0]);

    useEffect(() => {
      setActiveTab((prevTab) => prevTab || displayTabs[0]);
    }, [displayTabs]);

    useEffect(() => {
      if (!oppsFromOpportunitiesByTab?.[activeTab]?.length) {
        setActiveTab(displayTabs[0]);
      }
    }, [oppsFromOpportunitiesByTab, activeTab, displayTabs]);

    if (
      !opportunityType ||
      !oppsFromOpportunitiesByOppType ||
      !oppsFromOpportunitiesByTab
    )
      return null;

    const opportunityCount = oppsFromOpportunitiesByOppType
      ? countOpportunities(oppsFromOpportunitiesByOppType, opportunityType)
      : 0;

    const handleTabClick = (tab: OpportunityTab) => {
      analyticsStore.trackOpportunityTabClicked({ tab });
      setActiveTab(tab);
    };
    const hydratedHeader = generateOpportunityHydratedHeader(
      opportunityConfigs[opportunityType],
      opportunityCount
    );

    return !oppsFromOpportunitiesByOppType.length ? (
      <Empty />
    ) : (
      <>
        <Heading isMobile={isMobile} className="PersonList__Heading">
          {hydratedHeader.fullText ?? (
            <>
              {hydratedHeader.eligibilityText} {hydratedHeader.opportunityText}
            </>
          )}
        </Heading>
        <SubHeading className="PersonList__Subheading">
          {hydratedHeader.callToAction}
        </SubHeading>
        <WorkflowsTabbedPersonList<OpportunityTab>
          tabs={[...displayTabs]}
          activeTab={activeTab}
          onClick={handleTabClick}
        >
          <CaseloadOpportunityGrid
            items={oppsFromOpportunitiesByTab?.[activeTab]}
          />
        </WorkflowsTabbedPersonList>
        <OpportunityPreviewModal
          opportunity={selectedPerson?.verifiedOpportunities[opportunityType]}
        />
      </>
    );
  },
);

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

  const { label } = opportunityConfigs[opportunityType];

  const initialHeader = generateOpportunityInitialHeader(
    opportunityType,
    justiceInvolvedPersonTitle,
    workflowsSearchFieldTitle,
  );

  const empty = <Empty />;

  const initial = (
    <WorkflowsResults headerText={label} callToActionText={initialHeader} />
  );

  const hydrated = <HydratedOpportunityPersonList />;

  return (
    <CaseloadOpportunitiesHydrator
      {...{ initial, empty, hydrated, opportunityTypes: [opportunityType] }}
    />
  );
});
