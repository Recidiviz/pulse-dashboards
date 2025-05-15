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

import { UsIaOfficerApprovalView } from "../../WorkflowsJusticeInvolvedPersonProfile/UsIa/UsIaOfficerApprovalView";
import { UsIaRequestRevisionsView } from "../../WorkflowsJusticeInvolvedPersonProfile/UsIa/UsIaRequestRevisionsView";
import { SidePanelConfigProps, SidePanelConfigSetupProps } from "../types";

export function getUsIaSidePanelViewConfigs(
  panelConfigSetupProps: SidePanelConfigSetupProps,
): Record<
  "US_IA_MARK_ELIGIBLE_FOR_APPROVAL" | "US_IA_REQUEST_REVISIONS",
  SidePanelConfigProps
> {
  const { opportunity, resetPreviewView } = panelConfigSetupProps;

  return {
    US_IA_MARK_ELIGIBLE_FOR_APPROVAL: {
      onAfterOpen: () => opportunity.trackPreviewed(),
      onBackClick: resetPreviewView,
      pageContent: (
        <UsIaOfficerApprovalView
          opportunity={opportunity}
          resetPreviewView={resetPreviewView}
        />
      ),
    },
    US_IA_REQUEST_REVISIONS: {
      onAfterOpen: () => opportunity.trackPreviewed(),
      onBackClick: resetPreviewView,
      pageContent: (
        <UsIaRequestRevisionsView
          opportunity={opportunity}
          resetPreviewView={resetPreviewView}
        />
      ),
    },
  };
}
