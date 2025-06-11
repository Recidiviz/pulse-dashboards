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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { HeaderPortal } from "../../../../components/AppLayout/HeaderPortal";
import {
  FullBleedContainer,
  PageContainer,
} from "../../../../components/BaseLayout/BaseLayout";
import { hydrateTemplate } from "../../../../configs/hydrateTemplate";
import { useEGTDataContext } from "../EGTDataContext/context";
import { DatesSection } from "./DatesSection";

const LastUpdatedBanner = styled(FullBleedContainer)`
  ${typography.Sans14}

  background: ${palette.marble2};
  color: ${palette.slate85};
  text-align: center;

  ${PageContainer} {
    padding-bottom: ${rem(spacing.md)};
    padding-top: ${rem(spacing.md)};
  }
`;

export const Homepage = observer(function Homepage() {
  const { data, copy } = useEGTDataContext();

  return (
    <div>
      <HeaderPortal>
        <LastUpdatedBanner as="aside">
          <PageContainer>
            {hydrateTemplate(copy.lastUpdated, data)}
          </PageContainer>
        </LastUpdatedBanner>
      </HeaderPortal>
      <DatesSection />
    </div>
  );
});
