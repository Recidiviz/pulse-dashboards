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

import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";

export type OPPORTUNITY_SIDE_PANEL_VIEW =
  | "OPPORTUNITY_PREVIEW"
  | "MARK_INELIGIBLE"
  | "US_IA_MARK_ELIGIBLE_FOR_APPROVAL"
  | "US_IA_REQUEST_REVISIONS";

export type OpportunitySidePanelContextType = {
  currentView: OPPORTUNITY_SIDE_PANEL_VIEW;
  setCurrentView(view: OPPORTUNITY_SIDE_PANEL_VIEW): void;
};

export type SidePanelConfigProps = {
  onAfterOpen?: () => void;
  onBackClick?: () => void;
  pageContent: JSX.Element;
  footerContent?: JSX.Element;
  onSubmit?: () => void;
};

export type SidePanelConfigSetupProps = {
  opportunity: Opportunity;
  selectedPerson: JusticeInvolvedPerson | undefined;
  navigableOpportunities: Opportunity[] | undefined;
  shouldTrackOpportunityPreviewed?: boolean;
  resetPreviewView: () => void;
  onSubmit?: () => void;
  handleTrackPreviewed: () => void;
};
