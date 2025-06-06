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

import { Opportunity } from "../../WorkflowsStore";
import { Heading } from "./Heading";
import { AccordionSection, AccordionWrapper } from "./OpportunitiesAccordion";
import { OpportunityBanner } from "./OpportunityBanner";

type OpportunityOverviewProps = {
  opportunity: Opportunity;
  formLinkButton?: boolean;
  onDenialButtonClick?: () => void;
  justiceInvolvedPersonTitle: string;
  hideActionButtons?: boolean;
  shouldTrackOpportunityPreviewed?: boolean;
};

export const OpportunityOverview: React.FC<OpportunityOverviewProps> = ({
  opportunity,
  formLinkButton,
  onDenialButtonClick,
  justiceInvolvedPersonTitle,
  hideActionButtons,
  shouldTrackOpportunityPreviewed = true,
}) => {
  const selectedPerson = opportunity?.person;

  return (
    <>
      <Heading person={selectedPerson} trackingOpportunity={opportunity} />
      {opportunity.previewBannerText && (
        <OpportunityBanner
          opportunity={opportunity}
          title={justiceInvolvedPersonTitle}
        />
      )}
      <AccordionWrapper
        allowZeroExpanded
        preExpanded={[opportunity.accordionKey]}
      >
        <AccordionSection
          opportunity={opportunity}
          formLinkButton={formLinkButton}
          onDenialButtonClick={onDenialButtonClick}
          hideActionButtons={hideActionButtons}
          shouldTrackOpportunityPreviewed={shouldTrackOpportunityPreviewed}
        />
      </AccordionWrapper>
    </>
  );
};
