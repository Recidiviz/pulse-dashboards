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
import { useCallback, useEffect } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { Opportunity } from "../../WorkflowsStore";

type PreviewModalFooterProps<T> = {
  navigableItems?: T[];
  currentItem: T;
  itemLabel: string;
  onNavigate: (nextItem: T) => void;
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

export const OpportunityProfileFooter = ({
  currentOpportunity,
  navigableOpportunities,
  handleTrackPreviewed,
}: {
  currentOpportunity: Opportunity;
  navigableOpportunities?: Opportunity[];
  handleTrackPreviewed: () => void;
}) => {
  const { workflowsStore } = useRootStore();

  return (
    <PreviewModalFooter
      currentItem={currentOpportunity}
      navigableItems={navigableOpportunities}
      onNavigate={(opp: Opportunity) => {
        workflowsStore.updateSelectedPersonAndOpportunity(opp);
        handleTrackPreviewed();
      }}
      itemLabel={"Opportunity"}
    />
  );
};

// TODO(#8340) don't use `any` here
export const PreviewModalFooter: React.FC<PreviewModalFooterProps<any>> = ({
  currentItem,
  navigableItems,
  itemLabel,
  onNavigate,
}) => {
  const { isMobile } = useIsMobile(true);
  const currentItemIndex = navigableItems
    ? navigableItems.indexOf(currentItem)
    : -1;
  const totalItems = navigableItems?.length ?? 0;

  // returns true if there is a {next/previous} JII eligible in the same opportunity
  // direction is 1 for next, -1 for previous
  const canNavigateItem = useCallback(
    (direction: 1 | -1) => {
      if (!navigableItems || currentItemIndex === -1) {
        return false;
      }
      const nextItemIndex = currentItemIndex + direction;
      return nextItemIndex > -1 && nextItemIndex < navigableItems?.length; // not out of range of items
    },
    [currentItemIndex, navigableItems],
  );

  const navigateItem = useCallback(
    (direction: 1 | -1) => {
      if (!navigableItems || !canNavigateItem(direction)) {
        return false;
      }
      const nextItemIndex = currentItemIndex + direction;
      const nextItem = navigableItems[nextItemIndex];

      onNavigate(nextItem);
    },
    [canNavigateItem, onNavigate, currentItemIndex, navigableItems],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        navigateItem(1);
      } else if (e.key === "ArrowLeft") {
        navigateItem(-1);
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [navigateItem]);

  const previousTooltip = (
    <NavigationKeyboardShortcutTooltip>
      <NavigationKeyboardShortcutIcon>
        <i className="fa fa-long-arrow-left" />
      </NavigationKeyboardShortcutIcon>
      Previous {itemLabel}
    </NavigationKeyboardShortcutTooltip>
  );

  const nextTooltip = (
    <NavigationKeyboardShortcutTooltip>
      Next {itemLabel}
      <NavigationKeyboardShortcutIcon>
        <i className="fa fa-long-arrow-right" />
      </NavigationKeyboardShortcutIcon>
    </NavigationKeyboardShortcutTooltip>
  );

  return (
    <FooterWrapper>
      <TooltipTrigger contents={!isMobile && previousTooltip}>
        <Button
          onClick={() => navigateItem(-1)}
          kind="secondary"
          shape="block"
          disabled={!canNavigateItem(-1)}
          aria-label={`Previous ${itemLabel}`}
        >
          <i className="fa fa-angle-left" />
        </Button>
      </TooltipTrigger>
      {currentItemIndex + 1} / {totalItems}
      <TooltipTrigger contents={!isMobile && nextTooltip}>
        <Button
          onClick={() => navigateItem(1)}
          kind="secondary"
          shape="block"
          disabled={!canNavigateItem(1)}
          aria-label={`Next ${itemLabel}`}
        >
          <i className="fa fa-angle-right" />
        </Button>
      </TooltipTrigger>
    </FooterWrapper>
  );
};
