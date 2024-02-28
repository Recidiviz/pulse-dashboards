// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  Icon,
  palette,
  TooltipTrigger,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Client, UNKNOWN } from "../../WorkflowsStore";
import {
  formatPhoneNumber,
  validatePhoneNumber,
} from "../../WorkflowsStore/utils";
import { TooltipContainer } from "../sharedComponents";

const PhoneNumber = styled.div`
  ${typography.Sans12}
  background-color: ${palette.slate10};
  color: ${palette.slate85};
  margin-top: 2rem;
  display: flex;
  flex-flow: column nowrap;
  padding: 1rem;
  border-radius: 8px;
`;

const SidePanelInput = styled.input`
  ${typography.Sans16}
  border-width: 0;
  background-color: transparent;
  color: ${palette.slate85};
  padding: 0;

  ::placeholder {
    color: ${palette.slate60};
  }
`;

const PhoneNumberLabel = styled.label`
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const TooltipContent = styled.div`
  max-width: 15rem;
`;

const TooltipDetails: React.FC<{
  internalSystemName: string;
  phoneNumber?: string;
}> = ({ internalSystemName, phoneNumber }) => {
  return (
    <TooltipContainer>
      <TooltipContent>
        This number does not match the one provided by {internalSystemName}
        {validatePhoneNumber(phoneNumber) ? `: ${phoneNumber}` : `.`}
      </TooltipContent>
    </TooltipContainer>
  );
};

interface PhoneNumberInputProps {
  client: Client;
  onUpdatePhoneNumber: (phoneNumber: string) => void;
}

const PhoneNumberInput = ({
  client,
  onUpdatePhoneNumber,
}: PhoneNumberInputProps) => {
  const {
    workflowsStore: { internalSystemName },
  } = useRootStore();
  const [phoneNumber, setPhoneNumber] = useState(
    client?.milestonesPhoneNumber ?? "",
  );

  const showTooltip =
    client.milestonesPhoneNumberDoesNotMatchClient(phoneNumber);
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(event.target.value);
    setPhoneNumber(formattedNumber);
    onUpdatePhoneNumber(formattedNumber);
  };

  const handleInputBlur = () => {
    const digitsOnly = (phoneNumber ?? "").replace(/\D/g, "");
    onUpdatePhoneNumber(digitsOnly);
  };

  return (
    <PhoneNumber>
      <PhoneNumberLabel htmlFor="phoneNumber">
        Phone Number
        {showTooltip && (
          <TooltipTrigger
            contents={
              <TooltipDetails
                phoneNumber={client.phoneNumber || UNKNOWN}
                internalSystemName={internalSystemName}
              />
            }
          >
            <Icon kind="Error" size={12} color={palette.slate85} />
          </TooltipTrigger>
        )}
      </PhoneNumberLabel>
      <SidePanelInput
        type="text"
        name="phoneNumber"
        maxLength={14}
        inputMode="numeric"
        placeholder="Enter a 10-digit phone number"
        value={formatPhoneNumber(phoneNumber)}
        onBlur={handleInputBlur}
        onChange={handleInputChange}
      />
    </PhoneNumber>
  );
};
export default observer(PhoneNumberInput);
