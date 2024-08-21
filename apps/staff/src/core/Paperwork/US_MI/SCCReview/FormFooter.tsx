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

import { FormCheckbox } from "./FormUtils";

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-size: ${rem(7)};
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
`;

const FormFooter: React.FC = () => {
  return (
    <ContentContainer>
      <Row>
        <div>Distribution (Completed/Signed Copies Only):</div>
        <div style={{ paddingLeft: "4px" }}>
          <FormCheckbox name="residentDist" label="Prisoner" />
        </div>

        <div style={{ paddingLeft: "4px" }}>
          <FormCheckbox name="counselorDist" label="Counselor File" />
        </div>

        <div style={{ paddingLeft: "4px" }}>
          <FormCheckbox name="recordDist" label="Record Office File" />
        </div>

        <div style={{ paddingLeft: "4px" }}>
          <FormCheckbox name="centralDist" label="Central Office File" />
        </div>
        <div style={{ paddingLeft: "4px" }}>
          <FormCheckbox name="addDist" label="ADD (If Required)" />
        </div>
      </Row>
    </ContentContainer>
  );
};

export default FormFooter;
