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
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { Card, CopyWrapper, GoButton } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

const Heading = styled.h1`
  ${typography.Sans24}

  font-size: ${rem(34)};
  margin-bottom: ${rem(spacing.lg)};
`;

export const EmptyState: FC = () => {
  const { t } = useUsMaTranslations();

  return (
    <Card>
      <Heading>{t(($) => $.home.emptyState.heading)}</Heading>
      <CopyWrapper options={{ forceBlock: true }}>
        {t(($) => $.home.emptyState.body)}
      </CopyWrapper>
      <GoButton
        to={State.Resident.EGT.$.Definition.buildRelativePath({
          pageSlug: "credits",
        })}
      >
        {t(($) => $.home.emptyState.moreInfoLink)}
      </GoButton>
    </Card>
  );
};
