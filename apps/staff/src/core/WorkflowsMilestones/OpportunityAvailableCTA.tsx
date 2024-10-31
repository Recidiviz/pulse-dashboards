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

import { observer } from "mobx-react-lite";

import { Client, Opportunity } from "../../WorkflowsStore";
import { NavigateToFormButton } from "../../WorkflowsStore/Opportunity/Forms/NavigateToFormButton";
import {
  ButtonsContainer,
  OpportunityAvailableContainer,
  OpportunityAvailableContents,
  OpportunityAvailableHeaderText,
  OpportunityAvailableText,
} from "./styles";

interface OpportunityAvailableProps {
  client: Client;
  opportunity: Opportunity;
}

const OpportunityAvailableCTA = observer(function OpportunityAvailableCTA({
  client,
  opportunity,
}: OpportunityAvailableProps): JSX.Element {
  return (
    <OpportunityAvailableContainer
      role="status"
      aria-live="polite"
      aria-labelledby="opportunity-header"
      aria-describedby="opportunity-description"
    >
      <OpportunityAvailableContents>
        <OpportunityAvailableHeaderText id="opportunity-header">
          {opportunity.eligibilityCallToActionText}
        </OpportunityAvailableHeaderText>
        <OpportunityAvailableText id="opportunity-description">
          Would you like us to{" "}
          <strong>auto-fill the {opportunity.config.label} form?</strong> It
          will take seconds!
        </OpportunityAvailableText>
        <ButtonsContainer>
          {opportunity.form?.navigateToFormText && (
            <NavigateToFormButton opportunity={opportunity}>
              {opportunity.form.navigateToFormText}
            </NavigateToFormButton>
          )}
        </ButtonsContainer>
      </OpportunityAvailableContents>
    </OpportunityAvailableContainer>
  );
});
export default OpportunityAvailableCTA;
