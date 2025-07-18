// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import styled from "styled-components/macro";

export const FORM_US_IA_CBC_REPORT_FONT_FAMILY = "Arial, sans-serif";

export const FormPage = styled.div`
  font-family: ${FORM_US_IA_CBC_REPORT_FONT_FAMILY};
  display: flex;
  flex-grow: 1;
  height: 100%;
  justify-content: flex-start;
  flex-direction: column;
  font-size: ${rem(11)};
  color: black;
  background-color: white;
`;
