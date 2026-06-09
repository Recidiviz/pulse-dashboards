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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { Outlet, useMatch } from "react-router-dom";
import styled from "styled-components";

import { FullBleedContainer, PageContainer } from "~@jii/common-ui";
import { ScreenFillingWrapper } from "~@jii/layout";
import { State } from "~@jii/paths";
import { useUsNeTranslations } from "~@jii/translation";
import { palette } from "~design-system";

const Footer = styled(FullBleedContainer).attrs({ as: "footer" })`
  background: ${palette.pine3};
`;

const FooterContents = styled(PageContainer)`
  ${typography.Sans14}
  color: ${palette.white};
  padding-bottom: ${rem(spacing.xl)};
  padding-top: ${rem(spacing.xl)};
`;

const DisclaimerFooter = () => {
  const { t } = useUsNeTranslations();
  return (
    <Footer>
      <FooterContents>{t(($) => $.disclaimer)}</FooterContents>
    </Footer>
  );
};

/**
 * Layout route for all US_NE pages. Uses ScreenFillingWrapper to pin a common
 * footer to the bottom of the screen, rendering the matched route in the top
 * slot via an Outlet.
 */
export const UsNeLayout = () => {
  // The definition page renders its own PageLinksFooter at the bottom, so
  // collapse the gap above the DisclaimerFooter to keep the two footers flush.
  const isDefinitionPage = useMatch(State.Resident.UsNeMoreInformation.path);

  return (
    <ScreenFillingWrapper
      flushBottom={Boolean(isDefinitionPage)}
      top={<Outlet />}
      bottom={<DisclaimerFooter />}
    />
  );
};
