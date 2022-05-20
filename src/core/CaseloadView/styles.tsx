// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { palette, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { UiSans18 } from "../../components/typography";

export const Heading = styled(UiSans18)`
  border-bottom: 1px solid ${palette.slate20};
  color: ${palette.slate85};
  flex: 0 0 auto;
  margin-top: ${rem(spacing.xl)};
  padding-bottom: ${rem(spacing.sm)};
`;
