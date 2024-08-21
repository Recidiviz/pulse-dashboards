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

import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { strings } from "./constants";
import FormCheckbox from "./FormCheckbox";
import {
  DispositionCell,
  EligibilityCell,
  SignOffCell,
} from "./SignOffSectionCells";

const ContentContainer = styled.div`
  display: grid;
  grid-template: repeat(7, 1fr) / 49% 3% 48%;
  height: 75px;
  font-size: ${rem(9)};
`;

const SeparatorColumn = styled.div`
  grid-area: 3 / 2 / span 3 / span 1;
  background-color: #353535;
`;

const SignOffSection: React.FC = () => {
  return (
    <ContentContainer>
      <EligibilityCell>
        {strings.eligibilityHeader}
        <FormCheckbox
          toggleable
          name="eligibleForAdministrativeParole"
          style={{ marginBottom: "1px", marginLeft: "6px", borderWidth: "1px" }}
        />
        YES
        <FormCheckbox
          toggleable
          invert
          name="eligibleForAdministrativeParole"
          style={{ marginBottom: "1px", marginLeft: "6px", borderWidth: "1px" }}
        />
        NO
      </EligibilityCell>
      <SignOffCell column={1} label={strings.agentName} />
      <SignOffCell column={3} label={strings.agentSignature} />
      <DispositionCell>{strings.dispositionNotes}</DispositionCell>
      <SeparatorColumn />
    </ContentContainer>
  );
};

export default SignOffSection;
