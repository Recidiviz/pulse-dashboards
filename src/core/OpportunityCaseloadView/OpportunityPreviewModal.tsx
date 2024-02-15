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

import { useState } from "react";

import { Opportunity } from "../../WorkflowsStore";
import { OpportunityDenialView } from "../OpportunityDenial";
import { OpportunityProfile } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";

type OpportunityCaseloadProps = {
  opportunity?: Opportunity;
};

type OPPORTUNITY_SIDE_PANEL_VIEW = "OPPORTUNITY_PREVIEW" | "MARK_INELIGIBLE";

export function OpportunityPreviewModal({
  opportunity,
}: OpportunityCaseloadProps): JSX.Element | null {
  const [currentView, setCurrentView] = useState<OPPORTUNITY_SIDE_PANEL_VIEW>(
    "OPPORTUNITY_PREVIEW"
  );

  if (!opportunity) return null;

  function resetPreviewView() {
    setCurrentView("OPPORTUNITY_PREVIEW");
  }

  switch (currentView) {
    case "OPPORTUNITY_PREVIEW":
      return (
        <WorkflowsPreviewModal
          isOpen={!!opportunity}
          onAfterOpen={() => opportunity?.trackPreviewed()}
          onClose={() => resetPreviewView()}
          pageContent={
            <OpportunityProfile
              opportunity={opportunity}
              formLinkButton={!!opportunity?.form}
              onDenialButtonClick={() => setCurrentView("MARK_INELIGIBLE")}
            />
          }
        />
      );
    case "MARK_INELIGIBLE":
      return (
        <WorkflowsPreviewModal
          isOpen={!!opportunity}
          onClose={() => resetPreviewView()}
          onBackClick={() => resetPreviewView()}
          pageContent={
            <OpportunityDenialView
              onSubmit={() => resetPreviewView()}
              opportunity={opportunity}
            />
          }
        />
      );
    default:
      return <div />;
  }
}
