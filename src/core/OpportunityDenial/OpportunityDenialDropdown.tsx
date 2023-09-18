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

import { Dropdown, DropdownMenu, palette } from "@recidiviz/design-system";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { Opportunity } from "../../WorkflowsStore";
import { DenialMenuOptions } from "./DenialMenuOptions";
import { EligibleMenuOption } from "./EligibleMenuOption";
import { MenuButton } from "./MenuButton";

const Wrapper = styled.div`
  flex: 1 1 auto;
`;

const DropdownContainer = styled.div<{ isMobile: boolean }>`
  min-width: ${({ isMobile }) => (isMobile ? 16 : 19)}rem;
  max-width: 26rem;

  > button {
    background-color: transparent;
    padding: 0;

    &:hover,
    &:focus,
    &:active {
      background-color: transparent;
    }

    &:focus {
      .Checkbox__box {
        background-color: ${palette.slate10};
      }
    }
  }
`;

export function OpportunityDenialDropdown({
  opportunity,
}: {
  opportunity: Opportunity;
}): JSX.Element | null {
  const {
    workflowsStore: { featureVariants: responsiveRevamp },
  } = useRootStore();
  const { isMobile } = useIsMobile(true);

  return (
    <Wrapper>
      <Dropdown>
        <MenuButton opportunity={opportunity} />
        <DropdownMenu>
          <DropdownContainer
            isMobile={!!responsiveRevamp && isMobile}
            className="OpportunityDenialDropdown"
          >
            {!opportunity.isAlert && (
              <EligibleMenuOption opportunity={opportunity} />
            )}
            <DenialMenuOptions opportunity={opportunity} />
          </DropdownContainer>
        </DropdownMenu>
      </Dropdown>
    </Wrapper>
  );
}
