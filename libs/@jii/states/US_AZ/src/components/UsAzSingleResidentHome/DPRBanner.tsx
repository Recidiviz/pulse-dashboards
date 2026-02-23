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

import { typography } from "@recidiviz/design-system";
import Markdown from "markdown-to-jsx";
import { rem, rgba } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { ButtonLink } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsAzTranslations } from "~@jii/translation";
import { palette, spacing } from "~design-system";

// TODO(#6719): refactor to design system and combine with other similar components
const Wrapper = styled.div`
  ${typography.Sans14}
  border-left: ${rem(4)} solid ${palette.signal.notification};
  background: ${rgba(palette.signal.notification, 0.1)};
  margin: ${rem(spacing.xl)} 0;
  padding: ${rem(spacing.md)};
  display: flex;
  gap: ${rem(spacing.xl)};
  justify-items: space-between;
  align-items: center;

  span {
    flex: 1 1 auto;
  }

  a {
    flex: 0 0 auto;
  }
`;

export const DPRBanner: FC = () => {
  const { t } = useUsAzTranslations();

  return (
    <Wrapper>
      <Markdown>{t(($) => $.importantDates.dprBanner.message)}</Markdown>
      <ButtonLink
        kind="primary"
        to={State.Resident.$.UsAzMoreInformation.DPR.buildRelativePath({})}
      >
        {t(($) => $.importantDates.dprBanner.linkText)}
      </ButtonLink>
    </Wrapper>
  );
};
