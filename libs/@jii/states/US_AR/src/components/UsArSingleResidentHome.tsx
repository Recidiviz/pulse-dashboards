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

import { rem } from "polished";
import styled from "styled-components";

import { usePageTitle } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { LastUpdatedBanner } from "~@jii/layout";
import { spacing } from "~design-system";

import { ProgramsCta } from "./ProgramsCta/ProgramsCta";
import { UsArImportantDates } from "./UsArImportantDates";

const Wrapper = styled.div`
  padding-bottom: ${rem(spacing.xxl)};
`;

export function UsArSingleResidentHome() {
  usePageTitle("Home");
  const metadata = useResidentMetadata("US_AR");

  return (
    <Wrapper>
      <LastUpdatedBanner lastUpdatedDate={metadata.lastUpdatedDate} />
      <UsArImportantDates metadata={metadata} />
      <ProgramsCta />
    </Wrapper>
  );
}
