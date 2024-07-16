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

import { useRef, useState } from "react";

import { useFeatureVariants } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { OpportunityDenialView } from "../OpportunityDenial";
import { OpportunityProfile } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { OpportunityProfileFooter } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfileFooter";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";

type OpportunityCaseloadProps = {
  opportunity?: Opportunity;
  navigableOpportunities?: Opportunity[];
};

type OPPORTUNITY_SIDE_PANEL_VIEW = "OPPORTUNITY_PREVIEW" | "MARK_INELIGIBLE";

export function OpportunityPreviewModal({
  opportunity,
  navigableOpportunities,
}: OpportunityCaseloadProps): JSX.Element | null {
  const [currentView, setCurrentView] = useState<OPPORTUNITY_SIDE_PANEL_VIEW>(
    "OPPORTUNITY_PREVIEW",
  );

  const { interCandidateNavigation } = useFeatureVariants();

  const modalRef = useRef<HTMLDivElement | null>(null);

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
          contentRef={modalRef}
          pageContent={
            <OpportunityProfile
              opportunity={opportunity}
              formLinkButton={!!opportunity?.form}
              onDenialButtonClick={() => setCurrentView("MARK_INELIGIBLE")}
            />
          }
          footerContent={
            interCandidateNavigation && (
              <OpportunityProfileFooter
                currentOpportunity={opportunity}
                navigiableOpportunities={navigableOpportunities}
                modalRef={modalRef}
              />
            )
          }
        />
      );
    case "MARK_INELIGIBLE":
      return (
        <WorkflowsPreviewModal
          isOpen={!!opportunity}
          onClose={() => resetPreviewView()}
          onBackClick={() => resetPreviewView()}
          contentRef={modalRef}
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
