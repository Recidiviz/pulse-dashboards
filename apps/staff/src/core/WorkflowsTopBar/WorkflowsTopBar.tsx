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

import { Assets, spacing } from "@recidiviz/design-system";
import React from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { headerHeight } from "../../assets/styles/spec/settings/baseColors.scss";

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  background-color: ${palette.marble3};
  height: ${headerHeight};
  padding: ${spacing.md}px;
`;

const LogoImg = styled.img`
  width: auto;
  height: 22px;
`;

const WorkflowsTopBar: React.FC = () => {
  return (
    <Wrapper>
      <LogoImg src={Assets.LOGO} alt="Recidiviz" />
    </Wrapper>
  );
};

export default WorkflowsTopBar;
