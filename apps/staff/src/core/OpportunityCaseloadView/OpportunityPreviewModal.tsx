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

import { useRef } from "react";

import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { OpportunityDenialView } from "../OpportunityDenial";
import { OpportunityProfile } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { OpportunityProfileFooter } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfileFooter";
import { useOpportunitySidePanel } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunitySidePanelContext";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";
import {
  OPPORTUNITY_SIDE_PANEL_VIEW,
  SidePanelConfigProps,
  SidePanelConfigSetupProps,
} from "./types";
import { getUsIaSidePanelViewConfigs } from "./UsIa/UsIaSidePanelViews";

type OpportunityCaseloadProps = {
  opportunity?: Opportunity;
  navigableOpportunities?: Opportunity[];
  selectedPerson: JusticeInvolvedPerson | undefined;
  onClose?: () => void;
  onSubmit?: () => void;
  clearSelectedPersonOnClose?: boolean;
  shouldTrackOpportunityPreviewed?: boolean;
};

export function OpportunityPreviewModal({
  opportunity,
  navigableOpportunities,
  selectedPerson,
  onClose,
  onSubmit,
  clearSelectedPersonOnClose,
  shouldTrackOpportunityPreviewed = true,
}: OpportunityCaseloadProps): JSX.Element | null {
  const { currentView, setCurrentView } = useOpportunitySidePanel();

  const modalRef = useRef<HTMLDivElement | null>(null);

  if (!opportunity) return null;

  function resetPreviewView() {
    setCurrentView("OPPORTUNITY_PREVIEW");
  }

  const handleTrackPreviewed = () =>
    shouldTrackOpportunityPreviewed && opportunity.trackPreviewed();

  // Used for setting up a new side panel view config
  const panelConfigSetupProps: SidePanelConfigSetupProps = {
    opportunity,
    selectedPerson,
    resetPreviewView,
    navigableOpportunities,
    onSubmit,
    handleTrackPreviewed,
    shouldTrackOpportunityPreviewed,
  };

  const defaultProps = {
    isOpen: true,
    onClose: () => {
      onClose?.();
      resetPreviewView();
    },
    contentRef: modalRef,
  };

  const sidePanelViewConfigs: Record<
    OPPORTUNITY_SIDE_PANEL_VIEW,
    SidePanelConfigProps
  > = {
    OPPORTUNITY_PREVIEW: {
      onAfterOpen: handleTrackPreviewed,
      pageContent: (
        <OpportunityProfile
          opportunity={opportunity}
          formLinkButton={!!opportunity.form}
          onDenialButtonClick={() => setCurrentView("MARK_INELIGIBLE")}
          selectedPerson={selectedPerson}
          shouldTrackOpportunityPreviewed={shouldTrackOpportunityPreviewed}
        />
      ),
      footerContent: (
        <OpportunityProfileFooter
          currentOpportunity={opportunity}
          navigableOpportunities={navigableOpportunities}
          handleTrackPreviewed={handleTrackPreviewed}
        />
      ),
    },
    MARK_INELIGIBLE: {
      onBackClick: resetPreviewView,
      pageContent: (
        <OpportunityDenialView
          opportunity={opportunity}
          onSubmit={() => {
            onSubmit?.();
            resetPreviewView();
          }}
        />
      ),
    },
    ...getUsIaSidePanelViewConfigs(panelConfigSetupProps),
  };

  const { onAfterOpen, onBackClick, pageContent, footerContent } =
    sidePanelViewConfigs[currentView];

  return (
    <WorkflowsPreviewModal
      {...defaultProps}
      onAfterOpen={onAfterOpen}
      onBackClick={onBackClick}
      pageContent={pageContent}
      footerContent={footerContent}
      clearSelectedPersonOnClose={clearSelectedPersonOnClose}
    />
  );
}
