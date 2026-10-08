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

import { JIIButton } from "~@jii/common-ui";

import { Info, Wrapper } from "./UsNeCheckInFooter.styles";

type UsNeCheckInFooterProps = {
  onButtonClick: () => void;
  buttonText: string;
  infoText?: string;
  isDisabled?: boolean;
  isError?: boolean;
};

export const UsNeCheckInFooter = ({
  onButtonClick,
  buttonText,
  infoText,
  isDisabled = false,
  isError = false,
}: UsNeCheckInFooterProps) => {
  return (
    <Wrapper>
      {infoText && <Info $isError={isError}>{infoText}</Info>}
      <JIIButton disabled={isDisabled} onClick={onButtonClick}>
        {buttonText}
      </JIIButton>
    </Wrapper>
  );
};
