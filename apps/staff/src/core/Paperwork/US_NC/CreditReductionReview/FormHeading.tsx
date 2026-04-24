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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components";

const Row = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ColContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  font-weight: bold;
  align-self: center;
  margin: ${rem(spacing.md)};
`;

const FormHeading: React.FC = () => {
  return (
    <ColContainer>
      <Row>
        <ColContainer>
          <div>
            North Carolina Department of Adult Correction, Community Supervision
          </div>
        </ColContainer>
        <ColContainer>
          <div>DCS-183</div>
          <div>Rev. 02/26</div>
        </ColContainer>
      </Row>
      <Title>CREDIT REDUCTION REVIEW</Title>
    </ColContainer>
  );
};

export default FormHeading;
