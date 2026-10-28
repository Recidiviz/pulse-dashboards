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

import { FC } from "react";

import { Card, CardHeading, SlateCopy } from "~@jii/common-ui";
import { useUsArTranslations } from "~@jii/translation";

export const IneligibleCard: FC = () => {
  const { t } = useUsArTranslations();

  return (
    <Card>
      <CardHeading>
        {t(($) => $.programs.onMyTablet.ineligible.heading)}
      </CardHeading>
      <SlateCopy options={{ forceBlock: true }}>
        {t(($) => $.programs.onMyTablet.ineligible.body)}
      </SlateCopy>
    </Card>
  );
};
