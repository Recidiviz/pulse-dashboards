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

import styled from "styled-components";

import { palette } from "~design-system";

export const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${palette.marble1};
`;

export const ContentLayout = styled.div`
  flex: 1;
  display: flex;
  gap: 24px;
  padding-left: 7rem;
  padding-top: 1.5rem;
  padding-bottom: 2rem;
  margin-top: 10.5rem; /* Add space for fixed header (1rem progress bar + ~9.5rem header) */
  background: ${palette.marble3};
  z-index: 0;
  position: sticky;
`;

export const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 50rem;
  height: fit-content;
  background: ${palette.white};
  border-radius: 0.625rem;
  border: 1px solid ${palette.slate10};
  box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.35) inset;
  left: 25rem;
  position: sticky;
  padding-top: 2rem;
  padding-bottom: 2rem;
`;
