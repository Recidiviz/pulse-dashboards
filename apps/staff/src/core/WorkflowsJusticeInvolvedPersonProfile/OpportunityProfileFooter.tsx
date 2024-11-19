// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  Button,
  palette,
  Sans16,
  TooltipTrigger,
} from "@recidiviz/design-system";
import { runInAction } from "mobx";
import { useCallback, useEffect } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";

type OpportunityProfileFooterProps = {
  navigableOpportunities?: Opportunity[];
  currentOpportunity: Opportunity;
  modalRef: React.MutableRefObject<HTMLDivElement | null>;
};

const FooterWrapper = styled.div`
  border-top: 1px solid ${palette.slate20};
  background: white;
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
`;

const NavigationKeyboardShortcutTooltip = styled(Sans16)`
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: capitalize;
`;

const NavigationKeyboardShortcutIcon = styled.span`
  border: 1px solid white;
  padding: 3px;
  border-radius: 2px;
`;

export const OpportunityProfileFooter: React.FC<
  OpportunityProfileFooterProps
> = ({ currentOpportunity, navigableOpportunities, modalRef }) => {
  const { workflowsStore } = useRootStore();
  const { justiceInvolvedPersonTitle } = workflowsStore;

  const currentOpportunityIndex =
    currentOpportunity && navigableOpportunities
      ? navigableOpportunities.indexOf(currentOpportunity)
      : -1;
  const totalOpportunities = navigableOpportunities?.length ?? 0;

  // returns true if there is a {next/previous} JII eligible in the same opportunity
  // direction is 1 for next, -1 for previous
  const canNavigateOpportunity = useCallback(
    (direction: number) => {
      if (!navigableOpportunities || currentOpportunityIndex === -1) {
        return false;
      }
      const nextOpportunityIndex = currentOpportunityIndex + direction;
      return (
        nextOpportunityIndex > -1 &&
        nextOpportunityIndex < navigableOpportunities?.length
      ); // not out of range of items
    },
    [currentOpportunityIndex, navigableOpportunities],
  );

  const navigateOpportunity = useCallback(
    (direction: number) => {
      if (!navigableOpportunities || !canNavigateOpportunity(direction)) {
        return false;
      }
      const nextOpportunityIndex = currentOpportunityIndex + direction;
      const nextOpportunity = navigableOpportunities[nextOpportunityIndex];

      runInAction(async () => {
        await workflowsStore.updateSelectedPerson(
          nextOpportunity.person.pseudonymizedId,
        );
        workflowsStore.updateSelectedOpportunity(nextOpportunity.selectId);
      });

      nextOpportunity.trackPreviewed();
      if (modalRef?.current) {
        modalRef.current.scrollTo(0, 0);
      }
    },
    [
      canNavigateOpportunity,
      currentOpportunityIndex,
      navigableOpportunities,
      workflowsStore,
      modalRef,
    ],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        navigateOpportunity(1);
      } else if (e.key === "ArrowLeft") {
        navigateOpportunity(-1);
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [navigateOpportunity]);

  const previousTooltip = (
    <NavigationKeyboardShortcutTooltip>
      <NavigationKeyboardShortcutIcon>
        <i className="fa fa-long-arrow-left" />
      </NavigationKeyboardShortcutIcon>
      Previous {justiceInvolvedPersonTitle} Opportunity
    </NavigationKeyboardShortcutTooltip>
  );

  const nextTooltip = (
    <NavigationKeyboardShortcutTooltip>
      Next {justiceInvolvedPersonTitle} Opportunity
      <NavigationKeyboardShortcutIcon>
        <i className="fa fa-long-arrow-right" />
      </NavigationKeyboardShortcutIcon>
    </NavigationKeyboardShortcutTooltip>
  );

  return (
    <FooterWrapper>
      <TooltipTrigger contents={previousTooltip}>
        <Button
          onClick={() => navigateOpportunity(-1)}
          kind="secondary"
          shape="block"
          disabled={!canNavigateOpportunity(-1)}
        >
          <i className="fa fa-angle-left" />
        </Button>
      </TooltipTrigger>
      {currentOpportunityIndex + 1} / {totalOpportunities}
      <TooltipTrigger contents={nextTooltip}>
        <Button
          onClick={() => navigateOpportunity(1)}
          kind="secondary"
          shape="block"
          disabled={!canNavigateOpportunity(1)}
          aria-label="Next Opportunity"
        >
          <i className="fa fa-angle-right" />
        </Button>
      </TooltipTrigger>
    </FooterWrapper>
  );
};
