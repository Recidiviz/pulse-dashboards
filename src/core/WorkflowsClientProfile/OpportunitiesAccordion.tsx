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

import { palette, Sans14, Sans16, spacing } from "@recidiviz/design-system";
import { sortBy } from "lodash";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import {
  Accordion,
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
} from "react-accessible-accordion";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { SelectedPersonOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { OpportunityDenialView } from "../OpportunityDenial";
import { useStatusColors } from "../utils/workflowsUtils";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import { OpportunityModule } from "./OpportunityModule";
import { OpportunityModuleHeader } from "./OpportunityModuleHeader";

const OpportunityWrapper = styled.div<{ background: string; border: string }>`
  background-color: ${({ background: backgroundColor }) => backgroundColor};
  border-width: 1px 0;
  border-color: ${({ border: borderColor }) => borderColor};
  &:first-child {
    border-top-style: solid;
  }
  &:nth-child(n + 1) {
    border-bottom-style: solid;
  }
`;

const AccordionButton = styled(AccordionItemButton)<{
  $responsiveRevamp: boolean;
}>`
  padding: ${({ $responsiveRevamp }) =>
    $responsiveRevamp
      ? `${rem(spacing.lg)} ${rem(spacing.md)}`
      : rem(spacing.lg)};
  position: relative;
  cursor: pointer;

  &:not(:first-child) {
    border-top: none;
  }

  &:after {
    display: inline-block;
    content: "";
    height: ${({ $responsiveRevamp }) => ($responsiveRevamp ? "8" : "10")}px;
    width: ${({ $responsiveRevamp }) => ($responsiveRevamp ? "8" : "10")}px;
    margin-right: 12px;
    border-bottom: 1px solid ${palette.slate70};
    border-right: 1px solid ${palette.slate70};
    transform: rotate(-45deg);
    position: absolute;
    right: ${({ $responsiveRevamp }) =>
      $responsiveRevamp ? rem(spacing.sm) : rem(spacing.lg)};
    top: calc(${rem(spacing.lg)} + 5px);
  }

  &[aria-expanded="true"]::after,
  &[aria-selected="true"]::after {
    transform: rotate(45deg);
  }

  &[aria-expanded="true"] {
    span[class*="OpportunityLabel"] {
      border-bottom: 1px solid;
    }
  }
`;

const AccordionBody = styled(AccordionItemPanel)<{
  $responsiveRevamp: boolean;
}>`
  padding: ${({ $responsiveRevamp }) =>
    $responsiveRevamp ? 0 : `0 ${rem(spacing.lg)}`};
  margin-top: -${rem(spacing.lg)};

  & > *:first-child {
    background-color: transparent;
    border: none;
  }
`;

export const AccordionWrapper = styled(Accordion)<{
  $responsiveRevamp: boolean;
}>`
  margin: 0 -${({ $responsiveRevamp }) => ($responsiveRevamp ? rem(spacing.md) : rem(spacing.lg))};

  & + hr {
    display: none;
  }
`;

const NoOpportunities = styled.div`
  align-items: center;
  background: ${rgba(palette.slate, 0.05)};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  color: ${palette.slate70};
  display: flex;
  flex-direction: column;
  height: ${rem(250)};
  justify-content: center;
  padding: ${rem(spacing.md)};

  ${Sans16} {
    color: ${palette.pine2};
  }
`;

export const AccordionSection = observer(function AccordionSection({
  opportunity,
  formLinkButton = false,
  onDenialButtonClick = () => null,
}: {
  opportunity: Opportunity;
  formLinkButton?: boolean;
  onDenialButtonClick?: () => void;
}) {
  const {
    workflowsStore: { featureVariants },
  } = useRootStore();
  const colors = useStatusColors(opportunity);

  return (
    <OpportunityWrapper className="ProfileOpportunityItem" {...colors}>
      <AccordionItem uuid={opportunity.type}>
        <AccordionItemHeading>
          <AccordionButton
            $responsiveRevamp={!!featureVariants.responsiveRevamp}
          >
            <OpportunityModuleHeader opportunity={opportunity} />
          </AccordionButton>
        </AccordionItemHeading>
        <AccordionBody $responsiveRevamp={!!featureVariants.responsiveRevamp}>
          <OpportunityModule
            hideHeader
            opportunity={opportunity}
            formLinkButton={formLinkButton && !!opportunity.form}
            onDenialButtonClick={onDenialButtonClick}
          />
        </AccordionBody>
      </AccordionItem>
    </OpportunityWrapper>
  );
});

export const OpportunitiesAccordion = observer(function OpportunitiesAccordion({
  person,
  hideEmpty = false,
  formLinkButton,
}: {
  person: JusticeInvolvedPerson;
  hideEmpty?: boolean;
  formLinkButton?: boolean;
}) {
  const {
    workflowsStore,
    workflowsStore: {
      featureVariants,
      opportunityTypes,
      selectedOpportunityOnFullProfile,
    },
  } = useRootStore();

  const opportunities = sortBy(
    Object.values(person.verifiedOpportunities).filter(
      (opp) => opp !== undefined
    ) as Opportunity[],
    (opp: Opportunity) => opportunityTypes.indexOf(opp.type)
  );

  const empty = hideEmpty ? null : (
    <NoOpportunities>
      <Sans16>None for now</Sans16>
      <Sans14>New opportunities will appear here.</Sans14>
    </NoOpportunities>
  );

  const hydrated =
    opportunities.length === 1 && !featureVariants.responsiveRevamp ? (
      <div className="ProfileOpportunityItem">
        <OpportunityModule
          opportunity={opportunities[0]}
          formLinkButton={!!opportunities[0].form}
        />
      </div>
    ) : (
      <AccordionWrapper
        $responsiveRevamp={!!featureVariants.responsiveRevamp}
        allowZeroExpanded
        preExpanded={opportunities.length ? [opportunities[0].type] : [0]}
      >
        {opportunities.map((opportunity) => {
          if (!opportunity) return undefined;
          return (
            <AccordionSection
              key={opportunity.type}
              opportunity={opportunity}
              formLinkButton={formLinkButton}
              onDenialButtonClick={() => {
                workflowsStore.updateSelectedOpportunityOnFullProfile(
                  opportunity
                );
              }}
            />
          );
        })}
        <WorkflowsPreviewModal
          isOpen={!!selectedOpportunityOnFullProfile}
          clearSelectedPersonOnClose={false}
          onClose={() =>
            workflowsStore.updateSelectedOpportunityOnFullProfile(undefined)
          }
          pageContent={
            <OpportunityDenialView
              onSubmit={() =>
                workflowsStore.updateSelectedOpportunityOnFullProfile(undefined)
              }
              opportunity={selectedOpportunityOnFullProfile}
            />
          }
        />
      </AccordionWrapper>
    );

  return (
    <SelectedPersonOpportunitiesHydrator
      {...{ empty, hydrated, opportunityTypes }}
    />
  );
});
