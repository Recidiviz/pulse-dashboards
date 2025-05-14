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

import { createContext, useContext, useRef, useState } from "react";

import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { OpportunityDenialView } from "../OpportunityDenial";
import { OpportunityProfile } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { OpportunityProfileFooter } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfileFooter";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import {
  OPPORTUNITY_SIDE_PANEL_VIEW,
  OpportunitySidePanelContextType,
  SidePanelConfigProps,
} from "./types";
import { getUsIaSidePanelViewConfigs } from "./UsIa/UsIaSidePanelViews";

type OpportunityCaseloadProps = {
  opportunity?: Opportunity;
  navigableOpportunities?: Opportunity[];
  selectedPerson: JusticeInvolvedPerson | undefined;
};

export const OpportunitySidePanelContext =
  createContext<OpportunitySidePanelContextType>({
    setCurrentView: () => null,
  });

export function useOpportunitySidePanel() {
  return useContext(OpportunitySidePanelContext);
}

export function OpportunityPreviewModal({
  opportunity,
  navigableOpportunities,
  selectedPerson,
}: OpportunityCaseloadProps): JSX.Element | null {
  const [currentView, setCurrentView] = useState<OPPORTUNITY_SIDE_PANEL_VIEW>(
    "OPPORTUNITY_PREVIEW",
  );

  const modalRef = useRef<HTMLDivElement | null>(null);

  if (!opportunity) return null;

  function resetPreviewView() {
    setCurrentView("OPPORTUNITY_PREVIEW");
  }

  // Used for setting up a new side panel view config
  const panelConfigSetupProps = {
    opportunity,
    selectedPerson,
    resetPreviewView,
    navigableOpportunities,
  };

  const defaultProps = {
    isOpen: true,
    onClose: resetPreviewView,
    contentRef: modalRef,
  };

  const sidePanelViewConfigs: Record<
    OPPORTUNITY_SIDE_PANEL_VIEW,
    SidePanelConfigProps
  > = {
    OPPORTUNITY_PREVIEW: {
      onAfterOpen: () => opportunity.trackPreviewed(),
      pageContent: (
        <OpportunityProfile
          opportunity={opportunity}
          formLinkButton={!!opportunity.form}
          onDenialButtonClick={() => setCurrentView("MARK_INELIGIBLE")}
          selectedPerson={selectedPerson}
        />
      ),
      footerContent: (
        <OpportunityProfileFooter
          currentOpportunity={opportunity}
          navigableOpportunities={navigableOpportunities}
        />
      ),
    },
    MARK_INELIGIBLE: {
      onBackClick: resetPreviewView,
      pageContent: (
        <OpportunityDenialView
          opportunity={opportunity}
          onSubmit={resetPreviewView}
        />
      ),
    },
    ...getUsIaSidePanelViewConfigs(panelConfigSetupProps),
  };

  const { onAfterOpen, onBackClick, pageContent, footerContent } =
    sidePanelViewConfigs[currentView];

  return (
    <OpportunitySidePanelContext.Provider value={{ setCurrentView }}>
      <WorkflowsPreviewModal
        {...defaultProps}
        onAfterOpen={onAfterOpen}
        onBackClick={onBackClick}
        pageContent={pageContent}
        footerContent={footerContent}
      />
    </OpportunitySidePanelContext.Provider>
  );
}
