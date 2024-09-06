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

import { palette, typography } from "@recidiviz/design-system";
import styled from "styled-components/macro";

const NoDataMessageContainer = styled.div`
  width: 535px;
  ${typography.Sans14}
  color: ${palette.slate60};
  display: flex;
  justify-content: center;
  text-align: center;
  margin: auto;

  span {
    max-width: 285px;
  }
`;

const NoDataMessage = () => {
  return (
    <NoDataMessageContainer>
      <span>
        There are not enough historical records of similar offenses to show this
        data
      </span>
    </NoDataMessageContainer>
  );
};

export default NoDataMessage;
