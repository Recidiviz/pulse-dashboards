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

import { Body, Content, Heading, Wrapper } from "./ReentryFooter.styles";

// TODO OBT-50419: content and design TBD
export const ReentryFooter = () => (
  <Wrapper>
    <Content>
      <Heading>About</Heading>
      <Body>
        Made by Recidiviz, a non-profit that partners with state criminal
        justice agencies to advance their use of data and reduce incarceration.
      </Body>
    </Content>
  </Wrapper>
);
