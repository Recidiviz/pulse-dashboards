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
  ButtonProps,
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  spacing,
} from "@recidiviz/design-system";
import { darken, rem } from "polished";
import { useState } from "react";
import { Link, LinkProps, useLocation, useParams } from "react-router-dom";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { useRootStore } from "../../../../components/StoreProvider";
import { Client, getRecordForIneligible } from "../../../../WorkflowsStore";
import { getLinkToFormWithoutOpportunity } from "../../../../WorkflowsStore/utils";
import { desktopLinkGate } from "../../../desktopLinkGate";
import { OPPORTUNITY_STATUS_COLORS } from "../../../utils/workflowsUtils";

const StyledDropdown = styled(Dropdown)`
  flex: 0 0 auto;
`;

const StyledDropdownToggle = styled(DropdownToggle)`
  background: ${OPPORTUNITY_STATUS_COLORS.eligible.buttonFill};
  color: ${palette.white};
  padding: ${rem(spacing.md)} 0;
  border-radius: 4px;
  border: 1px solid ${OPPORTUNITY_STATUS_COLORS.eligible.buttonFill};
  height: 40px;
  max-width: ${rem(200)};
  padding: ${rem(spacing.xs)} ${rem(spacing.lg)};

  &:hover,
  &:focus,
  &:active,
  &[aria-expanded="true"] {
    color: ${palette.white};
    background: ${darken(0.1, OPPORTUNITY_STATUS_COLORS.eligible.buttonFill)};
    border: 1px solid
      ${darken(0.1, OPPORTUNITY_STATUS_COLORS.eligible.buttonFill)};
  }
`;

const StyledDropdownMenuItem = styled(DropdownMenuItem)`
  :focus {
    background-color: ${palette.slate10};
    color: ${palette.pine2};
    border-radius: 0px;
  }
`;

type NavigateToFormButtonProps = Omit<LinkProps, "to" | "onClick"> &
  Partial<ButtonProps> & {
    client: Client;
  };

export function UsTnNavigateToTepeFormButton({
  client,
  onClick,
  ...props
}: React.PropsWithChildren<NavigateToFormButtonProps>):
  | JSX.Element
  | boolean
  | null {
  const { pathname } = useLocation();
  const { officerPseudoId } = useParams();

  // get usTnExpiration configuration for link
  const {
    workflowsRootStore: { opportunityConfigurationStore },
    workflowsStore,
    firestoreStore,
    analyticsStore,
  } = useRootStore();

  // check if the client has a record or not
  const [hasRecord, setHasRecord] = useState(false);

  // FV that controls this feature directly
  if (!workflowsStore.featureVariants.usTnTEPENotesForAll) return null;

  const config = opportunityConfigurationStore.opportunities["usTnExpiration"];
  // can be missing if an upstream FV is not enabled
  if (!config) return null;

  const linkToForm = getLinkToFormWithoutOpportunity(
    pathname,
    officerPseudoId,
    client,
    config,
  );

  getRecordForIneligible(
    client,
    "usTnExpiration",
    workflowsStore,
    firestoreStore,
  ).then((record) => setHasRecord(record !== undefined));

  const handleOnClick = (reason: string) => {
    desktopLinkGate({
      headline: "Referral Unavailable in Mobile View",
    });

    analyticsStore.trackUsTnExpirationFormGenerationReason({
      justiceInvolvedPersonId: client.pseudonymizedId,
      reason: reason,
    });
  };

  const reasons = {
    SUPERVISION_EXPIRATION: "Supervision Expiration",
    TRANSFER: "Transfer",
    CLIENT_DECEASED: "Client Deceased",
  };

  return (
    hasRecord && (
      <StyledDropdown>
        <StyledDropdownToggle showCaret={true}>
          Generate TEPE
        </StyledDropdownToggle>
        <DropdownMenu>
          {Object.entries(reasons).map(([key, value]) => (
            <Link
              {...props}
              to={linkToForm}
              aria-label="Navigate to form link"
              className="NavigateToFormLink"
            >
              <StyledDropdownMenuItem onClick={(event) => handleOnClick(key)}>
                {value}
              </StyledDropdownMenuItem>
            </Link>
          ))}
        </DropdownMenu>
      </StyledDropdown>
    )
  );
}
