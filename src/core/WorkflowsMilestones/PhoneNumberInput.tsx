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

import { palette, typography } from "@recidiviz/design-system";
import React, { useState } from "react";
import styled from "styled-components/macro";

import { formatPhoneNumber } from "../../WorkflowsStore/utils";

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

interface PhoneNumberInputProps {
  clientPhoneNumber?: string;
  onUpdatePhoneNumber: (phoneNumber: string) => void;
}

const PhoneNumberInput = ({
  clientPhoneNumber,
  onUpdatePhoneNumber,
}: PhoneNumberInputProps) => {
  const [phoneNumber, setPhoneNumber] = useState(clientPhoneNumber ?? "");
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(event.target.value);
    setPhoneNumber(formattedNumber);
  };

  const handleInputBlur = () => {
    const digitsOnly = (phoneNumber ?? "").replace(/\D/g, "");
    onUpdatePhoneNumber(digitsOnly);
  };

  return (
    <PhoneNumber>
      <label htmlFor="phoneNumber">Phone Number</label>
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
export default PhoneNumberInput;
