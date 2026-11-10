// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import React from "react";

import {
  ActionButton,
  CopyButton,
} from "~@idaho-th/client/components/common/buttons";
import { StatusBadge } from "~@idaho-th/client/components/StatusBadge";
import { HOME_PLAN_TYPE } from "~@idaho-th/client/constants/common";
import { HomePlan } from "~@idaho-th/client/interfaces/common";
import { Button2 } from "~@idaho-th/client/styles";
import { formatResponseTimestamp } from "~@idaho-th/client/utils/date";

import HomeIcon from "../../../assets/home.svg?react";
import ClockIcon from "../../../assets/tabler-icon-clock.svg?react";
import MailIcon from "../../../assets/tabler-icon-mail.svg?react";
import PhoneIcon from "../../../assets/tabler-icon-phone.svg?react";
import UserIcon from "../../../assets/user-icon.svg?react";
import { Spinner } from "../../../common/LoadingSpinner/Spinner";
import * as Styled from "./StaffHomePlanView.styles";

interface HomePlanRowProps {
  homePlan: HomePlan | null;
  isLoading?: boolean;
  isClosed?: boolean;
  isSelectProviderDisabled?: boolean;
  onAddAddress: () => void;
  onSelectProvider: () => void;
  onCopy: (text: string) => Promise<boolean>;
}

export const HomePlanRow: React.FC<HomePlanRowProps> = ({
  homePlan,
  isLoading = false,
  isClosed = false,
  isSelectProviderDisabled = true,
  onAddAddress,
  onSelectProvider,
  onCopy,
}) => {
  if (isLoading) {
    return (
      <Styled.AddressRow>
        <Styled.AddressRowLeft>
          <Spinner size="1.25rem" />
        </Styled.AddressRowLeft>
      </Styled.AddressRow>
    );
  }

  if (homePlan === null) {
    return (
      <Styled.AddressRow>
        <Styled.AddressRowLeft>
          <Styled.AddressLabelWrapper>
            <Styled.AddressIconWrapper>
              <HomeIcon />
            </Styled.AddressIconWrapper>
            <Styled.AddressLabel>Enter a home plan</Styled.AddressLabel>
          </Styled.AddressLabelWrapper>
        </Styled.AddressRowLeft>

        <Styled.HomePlanButtonGroup>
          <ActionButton
            variant="secondary"
            disabled={isClosed}
            onClick={onAddAddress}
            height="2rem"
          >
            <Button2>Enter an address manually</Button2>
          </ActionButton>
          <ActionButton
            disabled={isClosed || isSelectProviderDisabled}
            onClick={onSelectProvider}
            height="2rem"
          >
            <Button2>Select a provider</Button2>
          </ActionButton>
        </Styled.HomePlanButtonGroup>
      </Styled.AddressRow>
    );
  }

  if (homePlan.type === HOME_PLAN_TYPE.MANUAL_ADDRESS) {
    return (
      <Styled.AddressBlock>
        <Styled.AddressRow>
          <Styled.AddressRowLeft>
            <Styled.AddressLabelWrapper>
              <Styled.AddressIconWrapper>
                <HomeIcon />
              </Styled.AddressIconWrapper>
              <Styled.AddressLabel>Address</Styled.AddressLabel>
            </Styled.AddressLabelWrapper>
            <Styled.AddressValue title={homePlan.address ?? undefined}>
              {homePlan.address}
            </Styled.AddressValue>
          </Styled.AddressRowLeft>
        </Styled.AddressRow>
        <Styled.Divider />
      </Styled.AddressBlock>
    );
  }

  const { provider } = homePlan;
  // The organization's first assigned user, or null when it has none — see
  // toOrganizationContact on the server. Render blank rather than invent one.
  const contact = provider?.contact ?? null;

  if (!provider)
    return (
      <Styled.AddressRow>
        <Styled.AddressRowLeft>
          <Styled.AddressIconWrapper>
            <HomeIcon />
          </Styled.AddressIconWrapper>
          <Styled.AddressLabel>
            Could not fetch provider details
          </Styled.AddressLabel>
        </Styled.AddressRowLeft>
      </Styled.AddressRow>
    );

  return (
    <Styled.ProviderSection>
      <Styled.ProviderHeaderBlock>
        <Styled.ProviderName>{provider.name}</Styled.ProviderName>
        <Styled.ProviderUpdatedAt>
          Updated at {formatResponseTimestamp(homePlan.updatedAt)}
        </Styled.ProviderUpdatedAt>
      </Styled.ProviderHeaderBlock>

      <Styled.ContactItem>
        <Styled.ContactLeft>
          <Styled.ContactUserIconWrapper>
            <UserIcon />
          </Styled.ContactUserIconWrapper>
          <Styled.ContactLabel>Contact name</Styled.ContactLabel>
        </Styled.ContactLeft>
        <Styled.ContactRight>
          <Styled.ContactValue>{contact?.contactName}</Styled.ContactValue>
          <CopyButton
            text={contact?.contactName ?? null}
            ariaLabel="Copy name"
            onCopy={onCopy}
          />
        </Styled.ContactRight>
      </Styled.ContactItem>

      <Styled.ContactItem>
        <Styled.ContactLeft>
          <Styled.ContactIconWrapper>
            <MailIcon />
          </Styled.ContactIconWrapper>
          <Styled.ContactLabel>Email</Styled.ContactLabel>
        </Styled.ContactLeft>
        <Styled.ContactRight>
          <Styled.ContactValue>{contact?.email}</Styled.ContactValue>
          <CopyButton
            text={contact?.email ?? null}
            ariaLabel="Copy email"
            onCopy={onCopy}
          />
        </Styled.ContactRight>
      </Styled.ContactItem>

      <Styled.ContactItem>
        <Styled.ContactLeft>
          <Styled.ContactIconWrapper>
            <PhoneIcon />
          </Styled.ContactIconWrapper>
          <Styled.ContactLabel>Phone</Styled.ContactLabel>
        </Styled.ContactLeft>
        <Styled.ContactRight>
          <Styled.ContactValue>{contact?.contactPhone}</Styled.ContactValue>
          <CopyButton
            text={contact?.contactPhone ?? null}
            ariaLabel="Copy phone"
            onCopy={onCopy}
          />
        </Styled.ContactRight>
      </Styled.ContactItem>

      <Styled.ContactItem>
        <Styled.ContactLeft>
          <Styled.ContactIconWrapper>
            <ClockIcon />
          </Styled.ContactIconWrapper>
          <Styled.ContactLabel>Status</Styled.ContactLabel>
        </Styled.ContactLeft>
        <StatusBadge status={provider.status} />
      </Styled.ContactItem>
    </Styled.ProviderSection>
  );
};
